const User = require("../models/User");
const bcrypt = require("bcryptjs");

const createAdminUser = async () => {
  try {
    const exists = await User.findOne({ rol: "admin" });
    if (exists) {
      console.log("🟢 Admin ya existe");
      return;
    }

    const hashedPassword = await bcrypt.hash("Jose2021*", 10);

    await User.create({
      name: "Super",
      lastName: "Admin",
      email: "admin@tienda.com",
      password: hashedPassword,
      rol: "admin",
    });

    console.log("✨ Admin creado → admin@tienda.com ");

  } catch (error) {
    console.error("❌ Error creando admin:", error);
  }
};

module.exports = createAdminUser;
