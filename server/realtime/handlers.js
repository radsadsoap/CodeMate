import { randomUUID } from 'node:crypto';
import mongoose from 'mongoose';
import * as Y from 'yjs';
import { z } from 'zod';
import { env } from '../config/env.js';
import { Session } from '../models/session.js';
import { LANGUAGES, LIMITS } from '../utils/constants.js';
import { ROOM_CODE_PATTERN } from '../utils/roomCode.js';
import { acquireRoom, getRoom } from './rooms.js';

const RUN_LOCK_MS = 60_000;
const OUTPUT_CHARS = 64_000;
const AWARENESS_BYTES = 16 * 1024;

const iceServers = [
    { urls: 'stun:stun.l.google.com:19302' },
    ...(env.turnUrls.length
        ? [{ urls: env.turnUrls, username: env.TURN_USERNAME, credential: env.TURN_CREDENTIAL }]
        : []),
];

const output = z
    .string()
    .max(OUTPUT_CHARS * 4)
    .transform((value) => value.slice(0, OUTPUT_CHARS));

const schemas = {
    join: z.object({ roomId: z.string().regex(ROOM_CODE_PATTERN) }),
    language: z.object({ language: z.enum(LANGUAGES) }),
    lock: z.object({ locked: z.boolean() }),
    grant: z.object({
        userId: z.string().refine((value) => mongoose.isValidObjectId(value)),
        allowed: z.boolean(),
    }),
    mic: z.object({ on: z.boolean() }),
    mute: z.object({ userId: z.string().max(64), muted: z.boolean() }),
    signal: z.object({
        to: z.string().max(64),
        description: z
            .object({
                type: z.enum(['offer', 'answer', 'rollback']),
                sdp: z.string().max(20_000).optional(),
            })
            .optional(),
        candidate: z
            .object({
                candidate: z.string().max(2_000),
                sdpMid: z.string().max(64).nullish(),
                sdpMLineIndex: z.number().int().min(0).max(64).nullish(),
                usernameFragment: z.string().max(256).nullish(),
            })
            .nullish(),
    }),
    runStart: z.object({ language: z.enum(LANGUAGES) }),
    runFinish: z.object({
        runId: z.string().max(64),
        result: z.object({
            status: z.enum(['ok', 'error', 'compile_error', 'timeout', 'unavailable', 'rate_limited']),
            exitCode: z.number().int().nullable(),
            stdout: output,
            stderr: output,
            compileOutput: output,
            durationMs: z.number().int().min(0).max(10 * 60_000),
            message: z.string().max(300).optional(),
        }),
    }),
};

const parse = (schema, payload) => {
    const result = schema.safeParse(payload);
    return result.success ? result.data : null;
};

const reply = (ack, payload) => {
    if (typeof ack === 'function') ack(payload);
};

const fail = (ack, message, code = 'bad_request') => reply(ack, { error: { message, code } });

function createBucket(capacity, refillPerSecond) {
    let tokens = capacity;
    let last = Date.now();
    return () => {
        const now = Date.now();
        tokens = Math.min(capacity, tokens + ((now - last) / 1000) * refillPerSecond);
        last = now;
        if (tokens < 1) return false;
        tokens -= 1;
        return true;
    };
}

export function registerHandlers(io, socket) {
    const { user } = socket.data;
    socket.data.roomId = null;
    socket.data.awarenessIds = new Set();

    const takeToken = createBucket(240, 60);
    socket.use((packet, next) => {
        if (takeToken()) return next();
        const ack = packet.at(-1);
        fail(ack, 'Too many actions at once. Slow down for a moment.', 'rate_limited');
    });

    // Socket.IO does not catch rejected handlers, so every handler goes through this guard.
    // When a client emits without a payload, the acknowledgement arrives as the first argument.
    const on = (event, handler) =>
        socket.on(event, async (...args) => {
            const ack = typeof args.at(-1) === 'function' ? args.pop() : undefined;
            try {
                await handler(args[0], ack);
            } catch (error) {
                console.error(`[socket ${event}] user ${user.id}:`, error);
                fail(ack, 'Something went wrong on our side. Try again.', 'server_error');
            }
        });

    const currentRoom = () => (socket.data.roomId ? getRoom(socket.data.roomId) : null);

    function leaveRoom() {
        const roomId = socket.data.roomId;
        if (!roomId) return;
        const room = getRoom(roomId);
        socket.data.roomId = null;
        socket.leave(roomId);
        if (!room) return;

        const { wasLastSocket, wasInVoice } = room.removeSocket(socket);
        if (wasInVoice) socket.to(roomId).emit('voice:peer-left', { socketId: socket.id });
        if (room.runSocketId === socket.id) {
            room.run = null;
            room.runSocketId = null;
        }
        if (wasLastSocket) socket.to(roomId).emit('room:member-left', { id: user.id, name: user.name });
        room.broadcastState();
    }

    on('room:join', async (payload, ack) => {
        const data = parse(schemas.join, payload);
        if (!data) return fail(ack, 'That room code is not valid.');

        // A client re-joins its own room to resync; only switching rooms counts as leaving.
        if (socket.data.roomId !== data.roomId) leaveRoom();
        const { matchedCount } = await Session.updateOne(
            { roomId: data.roomId, isActive: true },
            { $addToSet: { participants: user.id } }
        );
        const room = matchedCount ? await acquireRoom(data.roomId) : null;
        if (!room) return fail(ack, 'This session has ended or no longer exists.', 'not_found');
        if (!socket.connected) return;

        socket.join(room.roomId);
        socket.data.roomId = room.roomId;
        const isNewMember = room.addSocket(socket);

        reply(ack, {
            state: room.snapshot(),
            doc: Y.encodeStateAsUpdate(room.doc),
            awareness: room.encodeAwareness(),
            lastRun: room.lastRun,
            iceServers,
        });

        if (isNewMember) socket.to(room.roomId).emit('room:member-joined', { id: user.id, name: user.name });
        room.broadcastState();
    });

    on('room:leave', leaveRoom);
    on('disconnect', leaveRoom);

    on('yjs:update', (update) => {
        const room = currentRoom();
        if (!room || !(update instanceof Uint8Array)) return;
        if (update.byteLength > LIMITS.updateBytes) {
            socket.emit('room:error', { message: 'That change is too large to sync. Paste it in smaller parts.' });
            socket.emit('room:resync');
            return;
        }
        if (!room.canEdit(user.id)) {
            socket.emit('room:resync');
            return;
        }
        try {
            room.applyClientUpdate(new Uint8Array(update), socket.id);
        } catch {
            socket.emit('room:resync');
        }
    });

    on('awareness:update', (update) => {
        const room = currentRoom();
        if (!room || !(update instanceof Uint8Array) || update.byteLength > AWARENESS_BYTES) return;
        try {
            room.applyAwarenessUpdate(new Uint8Array(update), socket);
        } catch {
            // Malformed awareness payloads are dropped; the client resends on its next heartbeat.
        }
    });

    on('room:language', async (payload, ack) => {
        const room = currentRoom();
        const data = parse(schemas.language, payload);
        if (!room || !data) return fail(ack, 'Pick one of the supported languages.');
        if (!room.canEdit(user.id)) return fail(ack, 'You have view-only access right now.', 'forbidden');

        if (room.language !== data.language) {
            room.language = data.language;
            await Session.updateOne({ _id: room.sessionId }, { $set: { language: data.language } });
            room.broadcastState();
        }
        reply(ack, { ok: true });
    });

    on('room:lock', async (payload, ack) => {
        const room = currentRoom();
        const data = parse(schemas.lock, payload);
        if (!room || !data) return fail(ack, 'That request was not valid.');
        if (!room.isOwner(user.id)) return fail(ack, 'Only the session TA can change who edits.', 'forbidden');

        room.editLocked = data.locked;
        await Session.updateOne({ _id: room.sessionId }, { $set: { editLocked: data.locked } });
        room.broadcastState();
        reply(ack, { ok: true });
    });

    on('room:grant', async (payload, ack) => {
        const room = currentRoom();
        const data = parse(schemas.grant, payload);
        if (!room || !data) return fail(ack, 'That request was not valid.');
        if (!room.isOwner(user.id)) return fail(ack, 'Only the session TA can change who edits.', 'forbidden');

        if (data.allowed) room.editors.add(data.userId);
        else room.editors.delete(data.userId);
        await Session.updateOne({ _id: room.sessionId }, { $set: { editors: [...room.editors] } });
        room.broadcastState();
        reply(ack, { ok: true });
    });

    on('hand:raise', (payload, ack) => {
        const room = currentRoom();
        if (!room) return fail(ack, 'Join the session first.');
        if (room.isOwner(user.id)) return fail(ack, 'You are hosting this session.');

        if (!room.hands.has(user.id)) {
            room.hands.set(user.id, Date.now());
            io.to(room.roomId).emit('hand:raised', { id: user.id, name: user.name });
            room.broadcastState();
        }
        reply(ack, { ok: true });
    });

    on('hand:lower', (payload, ack) => {
        const room = currentRoom();
        if (!room) return fail(ack, 'Join the session first.');
        const target = typeof payload?.userId === 'string' ? payload.userId : user.id;
        if (target !== user.id && !room.isOwner(user.id)) {
            return fail(ack, 'Only the session TA can lower other hands.', 'forbidden');
        }

        if (room.hands.delete(target)) room.broadcastState();
        reply(ack, { ok: true });
    });

    on('voice:join', (payload, ack) => {
        const room = currentRoom();
        const member = room?.memberOf(socket);
        if (!member) return fail(ack, 'Join the session first.');

        const peers = room.voicePeers(socket.id);
        member.voiceSockets.add(socket.id);
        reply(ack, { peers });
        socket.to(room.roomId).emit('voice:peer-joined', { socketId: socket.id, userId: user.id });
        room.broadcastState();
    });

    on('voice:leave', () => {
        const room = currentRoom();
        const member = room?.memberOf(socket);
        if (!member?.voiceSockets.delete(socket.id)) return;

        if (member.voiceSockets.size === 0) member.micOn = false;
        socket.to(room.roomId).emit('voice:peer-left', { socketId: socket.id });
        room.broadcastState();
    });

    on('voice:signal', (payload) => {
        const room = currentRoom();
        const data = parse(schemas.signal, payload);
        if (!room || !data || !room.hasVoiceSocket(socket.id) || !room.hasVoiceSocket(data.to)) return;
        io.to(data.to).emit('voice:signal', {
            from: socket.id,
            description: data.description,
            candidate: data.candidate,
        });
    });

    on('voice:mic', (payload) => {
        const room = currentRoom();
        const member = room?.memberOf(socket);
        const data = parse(schemas.mic, payload);
        if (!member || !data) return;

        member.micOn = data.on && !member.mutedByHost && member.voiceSockets.size > 0;
        room.broadcastState();
    });

    on('voice:mute', (payload, ack) => {
        const room = currentRoom();
        const data = parse(schemas.mute, payload);
        if (!room || !data) return fail(ack, 'That request was not valid.');
        if (!room.isOwner(user.id)) return fail(ack, 'Only the session TA can mute others.', 'forbidden');

        const target = room.members.get(data.userId);
        if (!target || room.isOwner(data.userId)) return fail(ack, 'That person is not in the session.');

        target.mutedByHost = data.muted;
        if (data.muted) target.micOn = false;
        room.broadcastState();
        reply(ack, { ok: true });
    });

    on('run:start', (payload, ack) => {
        const room = currentRoom();
        const data = parse(schemas.runStart, payload);
        if (!room || !data) return fail(ack, 'Join the session first.');
        if (room.run && Date.now() - room.run.startedAt < RUN_LOCK_MS) {
            return fail(ack, `${room.run.by.name} is running code right now.`, 'busy');
        }

        room.run = {
            id: randomUUID(),
            by: { id: user.id, name: user.name },
            language: data.language,
            startedAt: Date.now(),
        };
        room.runSocketId = socket.id;
        io.to(room.roomId).emit('run:started', room.run);
        reply(ack, { runId: room.run.id });
    });

    on('run:finish', (payload) => {
        const room = currentRoom();
        const data = parse(schemas.runFinish, payload);
        if (!room || !data || room.run?.id !== data.runId || room.runSocketId !== socket.id) return;

        room.lastRun = { ...room.run, ...data.result, finishedAt: Date.now() };
        room.run = null;
        room.runSocketId = null;
        io.to(room.roomId).emit('run:finished', room.lastRun);
    });
}
