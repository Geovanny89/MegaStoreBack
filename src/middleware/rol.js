
const checkRol = (roles) => (req, res, next) => {
    try {
        const { user } = req
      
        const rolesByUser = user.rol;
       
        const checkValueRol= roles.some((rolSingle) => rolesByUser.includes(rolSingle))
        if (rolesByUser.includes("employee")) {
            next();
            return;
        }
        if (!checkValueRol) {
            res.status(403).send("Usuario  no tiene permisos")
            return
        }
        next()

    } catch (error) {
        console.log(error)
        res.status(403).send("Error de Servidor ")
    }
}
module.exports = checkRol;