import { z } from 'zod';
import { Session } from '../models/session.js';
import { closeRoom, createInitialDocState, roomStats } from '../realtime/rooms.js';
import { LANGUAGES, ROLES, STARTER_CODE } from '../utils/constants.js';
import { HttpError } from '../utils/httpError.js';
import { generateRoomCode, ROOM_CODE_PATTERN } from '../utils/roomCode.js';

export const createSessionSchema = z.object({
    title: z
        .string({ error: 'Give the session a title.' })
        .trim()
        .min(1, 'Give the session a title.')
        .max(80, 'Keep the title under 80 characters.'),
    language: z.enum(LANGUAGES, { error: 'Pick one of the supported languages.' }),
});

export const roomParamsSchema = z.object({
    roomId: z
        .string()
        .trim()
        .toLowerCase()
        .regex(ROOM_CODE_PATTERN, 'Room codes look like abc-defg-hij.'),
});

const idOf = (value) => String(value?._id ?? value);

const isParticipant = (session, userId) =>
    session.participants.some((participant) => idOf(participant) === userId);

function summarize(session, viewer) {
    const { online, raisedHands } = session.isActive
        ? roomStats(session.roomId)
        : { online: 0, raisedHands: 0 };

    return {
        roomId: session.roomId,
        title: session.title,
        language: session.language,
        isActive: session.isActive,
        createdAt: session.createdAt,
        endedAt: session.endedAt ?? null,
        owner: { id: idOf(session.createdBy), name: session.createdBy?.name ?? null },
        isOwner: idOf(session.createdBy) === viewer.id,
        participantCount: session.participants.length,
        online,
        raisedHands,
    };
}

async function findSession(roomId) {
    const session = await Session.findOne({ roomId }).populate('createdBy', 'name');
    if (!session) throw new HttpError(404, 'No session uses that code. Check it and try again.');
    return session;
}

function assertOwner(session, user) {
    if (idOf(session.createdBy) !== user.id) {
        throw new HttpError(403, 'Only the TA who created this session can do that.');
    }
}

export async function listSessions(req, res) {
    const sessions = await Session.find({ participants: req.user._id })
        .sort({ createdAt: -1 })
        .limit(100)
        .populate('createdBy', 'name')
        .lean();
    res.json({ sessions: sessions.map((session) => summarize(session, req.user)) });
}

export async function createSession(req, res) {
    if (req.user.role !== ROLES.TA) {
        throw new HttpError(403, 'Only teaching assistants can start sessions. Ask your TA for a code.');
    }

    const { title, language } = req.valid.body;
    const docState = createInitialDocState();

    for (let attempt = 0; attempt < 5; attempt += 1) {
        try {
            const session = await Session.create({
                roomId: generateRoomCode(),
                title,
                language,
                createdBy: req.user._id,
                participants: [req.user._id],
                docState,
                code: STARTER_CODE,
            });
            await session.populate('createdBy', 'name');
            return res.status(201).json({ session: summarize(session, req.user) });
        } catch (error) {
            if (error?.code !== 11000) throw error;
        }
    }

    throw new HttpError(503, 'Could not reserve a room code. Try again.');
}

export async function getSession(req, res) {
    const session = await findSession(req.valid.params.roomId);
    const summary = summarize(session, req.user);

    // Code from ended sessions stays private to the people who were in the room.
    if (!session.isActive && isParticipant(session, req.user.id)) {
        summary.code = session.code;
    }

    res.json({ session: summary });
}

export async function joinSession(req, res) {
    const session = await findSession(req.valid.params.roomId);
    if (!session.isActive) {
        throw new HttpError(410, 'This session has ended. Ask your TA for a new code.');
    }

    if (!isParticipant(session, req.user.id)) {
        await Session.updateOne({ _id: session._id }, { $addToSet: { participants: req.user._id } });
        session.participants.push(req.user._id);
    }

    res.json({ session: summarize(session, req.user) });
}

export async function endSession(req, res) {
    const session = await findSession(req.valid.params.roomId);
    assertOwner(session, req.user);

    if (session.isActive) {
        session.isActive = false;
        session.endedAt = new Date();
        await session.save();
        await closeRoom(session.roomId, 'ended');
    }

    const ended = await findSession(session.roomId);
    res.json({ session: { ...summarize(ended, req.user), code: ended.code } });
}

export async function deleteSession(req, res) {
    const session = await findSession(req.valid.params.roomId);
    assertOwner(session, req.user);

    await closeRoom(session.roomId, 'deleted');
    await Session.deleteOne({ _id: session._id });
    res.status(204).end();
}
