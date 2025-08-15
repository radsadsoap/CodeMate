const jwt = require("jsonwebtoken");
const { jwtOptions, jwtSecret } = require("../config/auth");

const generateToken = (user) => {
    return jwt.sign({ id: user._id, role: user.role }, jwtSecret, jwtOptions);
};

module.exports = generateToken;
