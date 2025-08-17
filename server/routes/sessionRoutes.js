const express = require('express')
const router = express.Router()

const { authMiddleware, checkRole } = require('../middlewares/authmiddleware')
const {
    createSession,
    joinSession,
    sessionHistory,
    getUserSessions,
    endSession,
    saveCode,
    getParticipants,
    leaveSession,
} = require('../controllers/sessionController')

// Basic session routes
router.post('/create', authMiddleware, createSession)
router.get('/join/:roomId', authMiddleware, joinSession)
router.get('/history/:roomId', authMiddleware, sessionHistory)
router.get('/my-sessions', authMiddleware, getUserSessions)
router.delete('/:roomId', authMiddleware, endSession)

// Code
router.put('/:roomId/code', authMiddleware, saveCode)

//Participants
router.get('/:roomId/participants', authMiddleware, getParticipants)
router.post('/:roomId/leave', authMiddleware, leaveSession)

module.exports = router
