const jwt = require('jsonwebtoken');
require('dotenv').config();
const JWT_SECRET = process.env.JWT_SECRET


const tokenSign = async (user) => {
    const sing = jwt.sign(
        {
            id: user.id,
            role: user.role
        },
        JWT_SECRET,
        {
            expiresIn:"2h"
        }
    )
    return sing
}

const verifyToken = async (tokenJwt) => {
    try {
        return jwt.verify(tokenJwt, JWT_SECRET);
    } catch (error) {
        console.error('Error al verificar el token:', error.message);
        return null;
    }
}

module.exports = {
    tokenSign,
    verifyToken
}