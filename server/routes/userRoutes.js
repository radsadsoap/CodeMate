const express = require("express");
const { register, login } = require("../controllers/userController");
const { authMiddleware, checkRole } = require("../middlewares/authmiddleware");

const router = express.Router();
router.post("/register", register);
router.post("/login", login);
router.get(
    "/me",
    authMiddleware,
    checkRole("teaching_assistant"),
    (req, res) => {
        res.status(200).json({ user: req.user });
    }
);

module.exports = router;
