const mongoose = require("mongoose");
const role = require("../config/auth");

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },

    role: {
        type: String,
        enum: ["student", "teaching_assistant"],
        default: "student",
    },
});

module.exports = mongoose.model("User", UserSchema);
