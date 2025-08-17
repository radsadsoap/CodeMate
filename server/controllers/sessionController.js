const Session = require('../models/session')
const generateRoomId = require('../utils/generateRoomId')
require('dotenv').config()

const createSession = async (req, res) => {
    try {
        const userId = req.user.id
        const { language } = req.body
        const roomId = generateRoomId()

        const linkShare = `${process.env.BASE_URL}/join/${roomId}`

        const session = new Session({
            roomId,
            linkShare,
            participants: [userId],
            createdBy: userId,
            language: language || 'python',
        })
        await session.save()
        res.status(201).json({
            message: 'Session Created',
            roomId,
            linkShare,
            session: session._id,
        })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

const joinSession = async (req, res) => {
    try {
        const { roomId } = req.params
        const userId = req.user.id

        const session = await Session.findOne({
            roomId,
            isActive: true,
        }).populate('participants', 'name email role')

        if (!session)
            return res
                .status(404)
                .json({ message: 'Session not found or inactive' })

        if (!session.participants.some((p) => p._id.toString() === userId)) {
            session.participants.push(userId)
            await session.save()
        }

        res.status(200).json({
            message: 'Joined session successfully',
            session: {
                roomId: session.roomId,
                language: session.language,
                currentCode: session.currentCode,
                participants: session.participants,
                createdBy: session.createdBy,
            },
        })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

const sessionHistory = async (req, res) => {
    try {
        const { roomId } = req.params
        const session = await Session.findOne({ roomId })
            .populate('codeHistory.author', 'name')
            .populate('participants', 'name email')

        if (!session)
            return res.status(404).json({ message: 'Session not found' })

        res.status(200).json({
            message: 'Session history retrieved',
            session: {
                roomId: session.roomId,
                language: session.language,
                codeHistory: session.codeHistory,
                participants: session.participants,
                createdAt: session.createdAt,
                endedAt: session.endedAt,
            },
        })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

const getUserSessions = async (req, res) => {
    try {
        const userId = req.user.id

        const sessions = await Session.find({
            participants: userId,
        })
            .populate('createdBy', 'name')
            .populate('participants', 'name')
            .sort({ createdAt: -1 })

        res.status(200).json({
            message: 'User sessions retrieved',
            sessions: sessions.map((session) => ({
                roomId: session.roomId,
                language: session.language,
                isActive: session.isActive,
                participants: session.participants.length,
                createdBy: session.createdBy,
                createdAt: session.createdAt,
                linkShare: session.linkShare,
            })),
        })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

const endSession = async (req, res) => {
    try {
        const { roomId } = req.params
        const userId = req.user.id

        const session = await Session.findOne({ roomId })

        if (!session)
            return res.status(404).json({ message: 'Session not found' })

        if (
            session.createdBy.toString() != userId &&
            req.user.role != 'teaching_assistant'
        )
            return res
                .status(403)
                .json({ message: 'Not authorized to end the session' })

        session.isActive = false
        session.endedAt = new Date()
        await session.save()

        res.status(200).json({
            message: 'Session ended successfully',
            roomId: session.roomId,
        })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

const saveCode = async (req, res) => {
    try {
        const { roomId } = req.params
        const { code } = req.body
        const userId = req.user.id

        const session = await Session.findOne({ roomId, isActive: true })

        if (!session)
            return res
                .status(404)
                .json({ message: 'Session not found or inactive' })

        if (!session.participants.includes(userId))
            return res
                .status(403)
                .json({ message: 'Not a participant of this session' })

        session.currentCode = code

        session.codeHistory.push({
            code,
            author: userId,
            timestamp: new Date(),
        })

        await session.save()

        res.status(200).json({
            message: 'Code saved successfully',
            timestamp: new Date(),
        })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

const getParticipants = async (req, res) => {
    try {
        const { roomId } = req.params

        const session = await Session.findOne({ roomId })
            .populate('participants', 'name email role')
            .populate('raisedHands', 'name email')

        if (!session)
            return res.status(404).json({ message: 'Session not found' })

        res.status(200).json({
            message: 'Participants retrieved',
            participants: session.participants,
            raisedHands: session.raisedHands,
            totalParticipants: session.participants.length,
        })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

const leaveSession = async (req, res) => {
    try {
        const { roomId } = req.params
        const userId = req.user.id

        const session = await Session.findOne({ roomId })

        if (!session)
            return res.status(404).json({ message: 'Session not found' })

        session.participants = session.participants.filter(
            (p) => p.toString() !== userId
        )

        session.raisedHands = session.raisedHands.filter(
            (p) => p.toString() !== userId
        )

        await session.save()

        res.status(200).json({
            message: 'Left session successfully',
            roomId: session.roomId,
        })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

const raiseHand = async (req, res) => {
    try {
        const { roomId } = req.params;
        const userId = req.user.id;

        const session = await Session.findOne({ roomId, isActive: true });

        if (!session)
            return res
                .status(404)
                .json({ message: "Session not found or inactive" });

        if (!session.participants.includes(userId)) {
            return res
                .status(403)
                .json({ message: "Not a participant of this session" });
        }

        if (!session.raisedHands.includes(userId)) {
            session.raisedHands.push(userId);
            await session.save();
        }

        res.status(200).json({
            message: "Hand raised successfully",
            roomId: session.roomId,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const lowerHand = async (req, res) => {
    try {
        const { roomId } = req.params;
        const userId = req.user.id;

        const session = await Session.findOne({ roomId });

        if (!session)
            return res.status(404).json({ message: "Session not found" });

        session.raisedHands = session.raisedHands.filter(
            (p) => p.toString() !== userId
        );
        await session.save();

        res.status(200).json({
            message: "Hand lowered successfully",
            roomId: session.roomId,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getRaisedHands = async (req, res) => {
    try {
        const { roomId } = req.params;

        const session = await Session.findOne({ roomId }).populate(
            "raisedHands",
            "name email"
        );

        if (!session)
            return res.status(404).json({ message: "Session not found" });

        res.status(200).json({
            message: "Raised hands retrieved",
            raisedHands: session.raisedHands,
            count: session.raisedHands.length,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getTADashboard = async (req, res) => {
    try {
        const activeSessions = await Session.find({ isActive: true })
            .populate("createdBy", "name email")
            .populate("participants", "name email")
            .populate("raisedHands", "name email")
            .sort({ createdAt: -1 });

        const dashboardData = activeSessions.map((session) => ({
            roomId: session.roomId,
            language: session.language,
            createdBy: session.createdBy,
            participantCount: session.participants.length,
            raisedHandsCount: session.raisedHands.length,
            raisedHands: session.raisedHands,
            createdAt: session.createdAt,
            linkShare: session.linkShare,
        }));

        res.status(200).json({
            message: "TA Dashboard data retrieved",
            totalActiveSessions: activeSessions.length,
            totalRaisedHands: activeSessions.reduce(
                (sum, s) => sum + s.raisedHands.length,
                0
            ),
            sessions: dashboardData,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getAllRaisedHands = async (req, res) => {
    try {
        const sessionsWithRaisedHands = await Session.find({
            isActive: true,
            raisedHands: { $ne: [] },
        })
            .populate("createdBy", "name email")
            .populate("raisedHands", "name email")
            .sort({ createdAt: -1 });

        res.status(200).json({
            message: "All raised hands retrieved",
            totalSessions: sessionsWithRaisedHands.length,
            sessions: sessionsWithRaisedHands.map((session) => ({
                roomId: session.roomId,
                language: session.language,
                createdBy: session.createdBy,
                raisedHands: session.raisedHands,
                createdAt: session.createdAt,
                linkShare: session.linkShare,
            })),
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    createSession,
    joinSession,
    sessionHistory,
    getUserSessions,
    endSession,
    saveCode,
    getParticipants,
    leaveSession,
    raiseHand,
    lowerHand,
    getRaisedHands,
    getTADashboard,
    getAllRaisedHands,
}
