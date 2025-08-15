const express = require("express");
const router = express.Router();

const { authMiddleware } = require("../middlewares/authmiddleware");
const {
    createSession,
    joinSession,
    sessionHistory,
} = require("../controllers/sessionController");

router.post("/create", authMiddleware, createSession);
router.get("/join/:roomId", authMiddleware, joinSession);
router.get("/history/:roomId", authMiddleware, sessionHistory);

module.exports = router;
