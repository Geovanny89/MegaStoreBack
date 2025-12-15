const jwt = require("jsonwebtoken");
require("dotenv").config();

const JWT_SECRET = process.env.JWT_SECRET;

const tokenSign = (user) => {
    return jwt.sign(
        {
            id: user.id,
            rol: user.rol
        },
        JWT_SECRET,
        {
            expiresIn: "2h"
        }
    );
};

// 🔴 NO async
// 🔴 NO try/catch
// 🔴 NO console.log
const verifyToken = (tokenJwt) => {
    return jwt.verify(tokenJwt, JWT_SECRET);
};

module.exports = {
    tokenSign,
    verifyToken
};
