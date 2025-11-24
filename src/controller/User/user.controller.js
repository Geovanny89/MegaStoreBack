const User = require("../../models/User");

const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(404).send("No existe usuario con ese ID");
        }

        const { name, lastName, identity, email, password, phone, adress } = req.body;
        if (!name && !lastName && !identity && !email && !password && !phone && !adress) {
            return res.status(400).send("No se proporcionaron datos de actualización");
        }

        const updateUsers = {
            ...(name && { name }),
            ...(lastName && { lastName }),
            ...(identity && { identity }),
            ...(email && { email }),
            ...(password && { password }),
            ...(phone && { phone }),
            ...(adress && { adress }),
        };

        const update = await User.findByIdAndUpdate(id, updateUsers, { new: true });
        res.status(200).send(update);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
};

const deleteUser = async(req,res)=>{
    try {
        const {id}= req.params
        if(!id){
            res.status(404).send("No existe Usuario con ese ID")
            return
        }
        const user = await User.findByIdAndDelete(id)
        res.status(200).send("Usuario eliminado con éxito")
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
}
module.exports={
    updateUser,
    deleteUser
}