const jwt = require("jsonwebtoken");

const role = {
    jwtSecret: process.env.JWT_SECRET,
    jwtOptions: { expiresIn: "1d" },
    roles: {
        STUDENT: "student",
        TA: "teaching_assistant",
    },
};

module.exports = role;
