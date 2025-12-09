const User = require("../../models/User");

const getUserById = async (req, res) => {
  try {
    const id = req.user.id; // viene del middleware

    const user = await User.findById(id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    res.status(200).json(user);

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};


const updateUser = async (req, res) => {
  try {
    const id = req.user.id;

    const allowed = ["name", "lastName", "identity", "email", "phone", "adress"];

    const updateData = {};
    allowed.forEach(key => {
      if (req.body[key]) updateData[key] = req.body[key];
    });

    const userUpdated = await User.findByIdAndUpdate(id, updateData, { new: true })
      .select("-password");

    res.status(200).json(userUpdated);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};


const deleteUser = async (req, res) => {
  try {
    const id = req.user.id;

    await User.findByIdAndDelete(id);

    res.status(200).json({ message: "Usuario eliminado con éxito" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

module.exports={
    getUserById,
    updateUser,
    deleteUser
}