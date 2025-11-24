const User = require("../models/User");
const bcrypt = require("bcryptjs");

const resetAdminPassword = async (newPassword = "AdminNuevo123*") => {
  try {
    const admin = await User.findOne({ rol: "admin" });

    if (!admin) {
      return console.log("❌ No existe admin");
    }

    admin.password = await bcrypt.hash(newPassword, 10);
    await admin.save();

    console.log("🔐 Nueva contraseña de admin:");
    console.log(`Email: ${admin.email}`);
    console.log(`Password: ${newPassword}`);

  } catch (error) {
    console.error("Error:", error);
  }
};

module.exports = resetAdminPassword;
