import * as Y from 'yjs';
import * as awarenessProtocol from 'y-protocols/awareness';
import * as decoding from 'lib0/decoding';
import { Session } from '../models/session.js';
import { colorFor } from '../utils/colors.js';
import { LANGUAGES, LIMITS, STARTER_CODE } from '../utils/constants.js';

const SAVE_DEBOUNCE_MS = 1_500;
const SAVE_MAX_WAIT_MS = 8_000;
const UNLOAD_DELAY_MS = 30_000;
const MAX_AWARENESS_IDS_PER_SOCKET = 4;

let io = null;
const rooms = new Map();
const loading = new Map();

export function attachIo(server) {
    io = server;
}

export function createInitialDocState(code = STARTER_CODE) {
    const doc = new Y.Doc();
    doc.transact(() => {
        for (const language of LANGUAGES) doc.getText(language).insert(0, code[language] ?? '');
    });
    const state = Buffer.from(Y.encodeStateAsUpdate(doc));
    doc.destroy();
    return state;
}

function readAwarenessClientIds(update) {
    const decoder = decoding.createDecoder(update);
    const count = decoding.readVarUint(decoder);
    const ids = [];
    for (let index = 0; index < count; index += 1) {
        ids.push(decoding.readVarUint(decoder));
        decoding.readVarUint(decoder);
        decoding.readVarString(decoder);
    }
    return ids;
}

const toRoom = (roomId, originSocketId) =>
    typeof originSocketId === 'string' && io.sockets.sockets.has(originSocketId)
        ? io.to(roomId).except(originSocketId)
        : io.to(roomId);

class Room {
    constructor(session) {
        this.roomId = session.roomId;
        this.sessionId = session._id;
        this.title = session.title;
        this.ownerId = String(session.createdBy);
        this.language = session.language;
        this.editLocked = session.editLocked;
        this.editors = new Set(session.editors.map(String));

        this.doc = new Y.Doc();
        Y.applyUpdate(this.doc, session.docState);
        this.awareness = new awarenessProtocol.Awareness(this.doc);
        this.awareness.setLocalState(null);

        this.members = new Map();
        this.hands = new Map();
        this.awarenessOwners = new Map();
        this.run = null;
        this.runSocketId = null;
        this.lastRun = null;

        this.dirty = false;
        this.firstDirtyAt = 0;
        this.saveTimer = null;
        this.saveQueue = Promise.resolve();
        this.unloadTimer = null;

        this.doc.on('update', (update, origin) => this.handleDocUpdate(update, origin));
        this.awareness.on('update', (changes, origin) => this.handleAwarenessUpdate(changes, origin));
    }

    isOwner(userId) {
        return userId === this.ownerId;
    }

    canEdit(userId) {
        return this.isOwner(userId) || !this.editLocked || this.editors.has(userId);
    }

    memberOf(socket) {
        return this.members.get(socket.data.user.id);
    }

    addSocket(socket) {
        clearTimeout(this.unloadTimer);
        const { user } = socket.data;
        let member = this.members.get(user.id);
        const isNewMember = !member;
        if (!member) {
            const taken = new Set([...this.members.values()].map(({ color }) => color));
            member = {
                user,
                color: colorFor(user.id, taken),
                sockets: new Set(),
                voiceSockets: new Set(),
                micOn: false,
                mutedByHost: false,
                joinedAt: Date.now(),
            };
            this.members.set(user.id, member);
        }
        member.sockets.add(socket.id);
        return isNewMember;
    }

    removeSocket(socket) {
        const member = this.memberOf(socket);
        this.releaseAwareness(socket);
        if (!member) return { wasLastSocket: false, wasInVoice: false };

        const wasInVoice = member.voiceSockets.delete(socket.id);
        if (member.voiceSockets.size === 0) member.micOn = false;
        member.sockets.delete(socket.id);

        const wasLastSocket = member.sockets.size === 0;
        if (wasLastSocket) {
            this.members.delete(member.user.id);
            this.hands.delete(member.user.id);
        }
        if (this.members.size === 0) this.scheduleUnload();
        return { wasLastSocket, wasInVoice };
    }

    presence() {
        return [...this.members.values()]
            .map(({ user, color, voiceSockets, micOn, mutedByHost, joinedAt }) => ({
                id: user.id,
                name: user.name,
                role: user.role,
                color,
                isOwner: this.isOwner(user.id),
                canEdit: this.canEdit(user.id),
                handRaisedAt: this.hands.get(user.id) ?? null,
                voice: { joined: voiceSockets.size > 0, micOn: micOn && !mutedByHost, mutedByHost },
                joinedAt,
            }))
            .sort((a, b) => Number(b.isOwner) - Number(a.isOwner) || a.joinedAt - b.joinedAt);
    }

    snapshot() {
        return {
            roomId: this.roomId,
            title: this.title,
            ownerId: this.ownerId,
            language: this.language,
            editLocked: this.editLocked,
            members: this.presence(),
            running: this.run,
        };
    }

    broadcastState() {
        io.to(this.roomId).emit('room:state', this.snapshot());
    }

    voicePeers(excludeSocketId) {
        const peers = [];
        for (const { user, voiceSockets } of this.members.values()) {
            for (const socketId of voiceSockets) {
                if (socketId !== excludeSocketId) peers.push({ socketId, userId: user.id });
            }
        }
        return peers;
    }

    hasVoiceSocket(socketId) {
        for (const { voiceSockets } of this.members.values()) {
            if (voiceSockets.has(socketId)) return true;
        }
        return false;
    }

    applyClientUpdate(update, socketId) {
        Y.applyUpdate(this.doc, update, socketId);
        // Trim instead of rejecting so every client converges on the same bounded document.
        for (const language of LANGUAGES) {
            const text = this.doc.getText(language);
            if (text.length > LIMITS.codeChars) {
                text.delete(LIMITS.codeChars, text.length - LIMITS.codeChars);
            }
        }
    }

    handleDocUpdate(update, origin) {
        this.markDirty();
        toRoom(this.roomId, origin).emit('yjs:update', update);
    }

    applyAwarenessUpdate(update, socket) {
        const ids = readAwarenessClientIds(update);
        const owned = socket.data.awarenessIds;
        for (const id of ids) {
            const owner = this.awarenessOwners.get(id);
            if (owner && owner !== socket.id) return false;
            if (!owner && owned.size >= MAX_AWARENESS_IDS_PER_SOCKET) return false;
        }
        for (const id of ids) {
            this.awarenessOwners.set(id, socket.id);
            owned.add(id);
        }
        awarenessProtocol.applyAwarenessUpdate(this.awareness, update, socket.id);
        for (const id of ids) {
            if (this.awareness.getStates().has(id)) continue;
            this.awarenessOwners.delete(id);
            owned.delete(id);
        }
        return true;
    }

    handleAwarenessUpdate({ added, updated, removed }, origin) {
        const changed = [...added, ...updated, ...removed];
        if (changed.length === 0) return;

        const user = typeof origin === 'string' ? io.sockets.sockets.get(origin)?.data.user : null;
        if (user) {
            // Cursor labels come from the authenticated account, never from the client payload.
            const color = this.members.get(user.id)?.color ?? colorFor(user.id);
            for (const id of [...added, ...updated]) {
                const state = this.awareness.getStates().get(id);
                if (state) state.user = { id: user.id, name: user.name, color, colorLight: `${color}33` };
            }
        }

        const update = awarenessProtocol.encodeAwarenessUpdate(this.awareness, changed);
        toRoom(this.roomId, origin).emit('awareness:update', update);
    }

    encodeAwareness() {
        const ids = [...this.awareness.getStates().keys()];
        return ids.length ? awarenessProtocol.encodeAwarenessUpdate(this.awareness, ids) : null;
    }

    releaseAwareness(socket) {
        const ids = [...(socket.data.awarenessIds ?? [])];
        socket.data.awarenessIds?.clear();
        for (const id of ids) this.awarenessOwners.delete(id);
        if (ids.length) awarenessProtocol.removeAwarenessStates(this.awareness, ids, null);
    }

    markDirty() {
        this.dirty = true;
        const now = Date.now();
        if (!this.firstDirtyAt) this.firstDirtyAt = now;
        clearTimeout(this.saveTimer);
        const delay = Math.min(SAVE_DEBOUNCE_MS, Math.max(0, this.firstDirtyAt + SAVE_MAX_WAIT_MS - now));
        this.saveTimer = setTimeout(() => this.persist(), delay);
    }

    persist() {
        this.saveQueue = this.saveQueue.then(() => this.writeSnapshot());
        return this.saveQueue;
    }

    async writeSnapshot() {
        if (!this.dirty) return;
        clearTimeout(this.saveTimer);
        this.saveTimer = null;
        this.dirty = false;
        this.firstDirtyAt = 0;

        const docState = Buffer.from(Y.encodeStateAsUpdate(this.doc));
        const code = Object.fromEntries(
            LANGUAGES.map((language) => [language, this.doc.getText(language).toString()])
        );

        try {
            await Session.updateOne({ _id: this.sessionId }, { $set: { docState, code } });
            io.to(this.roomId).emit('doc:saved', { at: new Date().toISOString() });
        } catch (error) {
            console.error(`Saving room ${this.roomId} failed; retrying.`, error);
            this.markDirty();
        }
    }

    scheduleUnload() {
        clearTimeout(this.unloadTimer);
        this.unloadTimer = setTimeout(async () => {
            if (this.members.size > 0) return;
            await this.persist();
            if (this.members.size > 0 || rooms.get(this.roomId) !== this) return;
            rooms.delete(this.roomId);
            this.destroy();
        }, UNLOAD_DELAY_MS);
    }

    destroy() {
        clearTimeout(this.saveTimer);
        clearTimeout(this.unloadTimer);
        this.awareness.destroy();
        this.doc.destroy();
    }
}

async function loadRoom(roomId) {
    const session = await Session.findOne({ roomId, isActive: true }).select('+docState');
    if (!session) return null;

    if (!session.docState?.length) {
        const code = Object.fromEntries(
            LANGUAGES.map((language) => [language, session.code?.[language] ?? STARTER_CODE[language]])
        );
        session.docState = createInitialDocState(code);
        await session.save();
    }

    const room = new Room(session);
    rooms.set(roomId, room);
    return room;
}

export function acquireRoom(roomId) {
    const existing = rooms.get(roomId);
    if (existing) return Promise.resolve(existing);
    if (!loading.has(roomId)) {
        loading.set(
            roomId,
            loadRoom(roomId).finally(() => loading.delete(roomId))
        );
    }
    return loading.get(roomId);
}

export function getRoom(roomId) {
    return rooms.get(roomId) ?? null;
}

export function roomStats(roomId) {
    const room = rooms.get(roomId);
    return { online: room?.members.size ?? 0, raisedHands: room?.hands.size ?? 0 };
}

export async function closeRoom(roomId, reason) {
    const room = rooms.get(roomId);
    if (room) {
        rooms.delete(roomId);
        if (reason === 'ended') await room.persist();
        room.destroy();
    }
    if (!io) return;

    io.to(roomId).emit('room:closed', { reason });
    for (const socket of io.sockets.sockets.values()) {
        if (socket.data.roomId !== roomId) continue;
        socket.leave(roomId);
        socket.data.roomId = null;
        socket.data.awarenessIds.clear();
    }
}

export async function persistAllRooms() {
    await Promise.all([...rooms.values()].map((room) => room.persist()));
}
