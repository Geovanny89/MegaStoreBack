const User = require("../models/User");
const { verifyToken } = require("../utils/handleJwt");

const authMiddleware = async (req, res, next) => {
    try {
        // Verificar si el token está presente
        if (!req.headers.authorization) {
            return res.status(401).json({
                error: "NO_TOKEN",
                message: "Token no proporcionado"
            });
        }

        // Obtener el token de los headers
        const token = req.headers.authorization.split(" ").pop();

        // Verificar el token (sin await)
        const dataToken = verifyToken(token);

        if (!dataToken || !dataToken.id) {
            return res.status(401).json({
                error: "INVALID_TOKEN",
                message: "Token inválido"
            });
        }

        // Buscar al usuario por ID
        const user = await User.findById(dataToken.id);
        if (!user) {
            return res.status(401).json({
                error: "USER_NOT_FOUND",
                message: "Usuario no encontrado"
            });
        }

        // Asignar usuario a la solicitud
        req.user = user;
        next();
        
    } catch (error) {
        // Manejo de error si el token está expirado
        if (error.name === "TokenExpiredError") {
            console.log("Token expirado:", error);
            return res.status(401).json({
                error: "TOKEN_EXPIRED",
                message: "Tu sesión ha expirado"
            });
        }

        // Manejo de otros errores de JWT
        if (error.name === "JsonWebTokenError") {
            return res.status(401).json({
                error: "INVALID_TOKEN",
                message: "Token inválido"
            });
        }

        // Si es un error general, devolver error interno
        console.error("Error de autenticación:", error);
        return res.status(500).json({
            error: "SERVER_ERROR",
            message: "Error interno del servidor"
        });
    }
};

module.exports = authMiddleware;
