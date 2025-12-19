const { Server } = require("socket.io");

module.exports = (server, app) => {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  // 👉 guardamos io en express
  app.set("io", io);

  io.on("connection", (socket) => {
    console.log("🟢 Usuario conectado:", socket.id);

    /* ============================
       UNIRSE A SALA DE ORDEN
    ============================ */
    socket.on("joinOrder", (orderId) => {
      const room = `order_${orderId}`;
      socket.join(room);
      console.log(`📦 Socket ${socket.id} unido a ${room}`);
    });

    socket.on("disconnect", () => {
      console.log("🔴 Usuario desconectado:", socket.id);
    });
  });
};
