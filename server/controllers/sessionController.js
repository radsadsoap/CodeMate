const Session = require('../models/session')
const roomId = require('../utils/generateRoomId')
require('dotenv').config()

const createSession = async (req, res) => {
    try {
        const userId = req.user.id

        const linkShare = `${process.env.BASE_URL}/join/${roomId}`

        const session = new Session({
            roomId,
            linkShare,
            participants: [userId],
        })
        await session.save()
        res.status(201).json({ message: 'Session Created', roomId, linkShare })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

const joinSession = async (req, res) => {
    try {
        const { roomId } = req.params
        const userId = req.user.id
        const session = await Session.findOne({ roomId })
        if (!session)
            return res.status(404).json({ message: 'Session not found' })

        if (!session.participants.includes(userId)) {
            session.participants.push(userId)
            await session.save()
        }

        res.status(200).json({
            message: 'Joined session',
            roomId,
            participants: session.participants,
        })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

const sessionHistory = async (req, res) => {
    try {
        const { roomId } = req.params
        const session = await Session.findOne({ roomId }).populate(
            'codeHistory.author',
            'name'
        )
        if (!session)
            return res.status(404).json({ message: 'Session not found' })

        res.status(200).json({
            message: 'Session history retrieved',
            roomId,
            codeHistory: session.codeHistory,
        })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

module.exports = {
    createSession,
    joinSession,
    sessionHistory,
}
