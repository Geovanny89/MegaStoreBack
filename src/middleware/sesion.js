const User = require("../models/User");
const { verifyToken } = require("../utils/handleJwt");

const authMiddleware = async(req, res, next) =>{
    try {
        if(!req.headers.authorization){
            res.status(401).send("Not_Token")
            return
        }
        const token = req.headers.authorization.split(' ').pop();
        const dataToken = await verifyToken(token)
        // console.log( 'Holaaaaaaaaaaaa ' + token)
        if(!dataToken.id){
            res.status(401).send("Error_Id_Token")
            return
        }
        const user = await User.findById(dataToken.id)
        req.user = user
        next();
    } catch (error) {
        console.log(error)
        res.status(500).json({message: error.message})
    }
}

module.exports = authMiddleware