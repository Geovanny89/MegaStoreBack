require('dotenv').config();
const express = require("express");
const cors = require('cors');
const bodyParser = require('body-parser');
const cookieParser = require("cookie-parser");
const http = require("http");
const { JWT_SECRET } = process.env;

// Importaciones de base de datos y utilidades
require('./database/db.js');
const seedPlanes = require('./seed/seedPlanes.js');
const createAdmin = require('./utils/createAdmin');
const stripeWebhookHandler = require('./webhooks/stripeWebhook');

const app = express();
const server = http.createServer(app); // ✅ Creamos el server HTTP primero

/* -------------------------------------------------------------------------- */
/* 1. CONFIGURACIÓN DE SOCKET.IO                                              */
/* -------------------------------------------------------------------------- */
// Lo inicializamos antes que las rutas para tener la instancia lista
require("./socket/socket")(server, app); 

/* -------------------------------------------------------------------------- */
/* 2. WEBHOOK DE STRIPE (DEBE IR ANTES QUE EL BODY PARSER JSON)               */
/* -------------------------------------------------------------------------- */
app.post(
  '/api/webhook/stripe',
  express.raw({ type: 'application/json' }),
  stripeWebhookHandler
);

/* -------------------------------------------------------------------------- */
/* 3. MIDDLEWARES GLOBALES (JSON, CORS, COOKIES)                              */
/* -------------------------------------------------------------------------- */
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser(JWT_SECRET));

app.use(cors({
  origin: '*', // En producción, especifica tu URL de frontend
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'x-user-session', 'Authorization']
}));

/* -------------------------------------------------------------------------- */
/* 4. INYECCIÓN DE SOCKET EN REQ (¡IMPORTANTE: ANTES DE LAS RUTAS!)           */
/* -------------------------------------------------------------------------- */
app.use((req, res, next) => {
  // Recuperamos la instancia de io que guardamos en app.set dentro de socket/socket.js
  const io = app.get("io");
  req.io = io;
  next();
});

/* -------------------------------------------------------------------------- */
/* 5. RUTAS DE LA API                                                         */
/* -------------------------------------------------------------------------- */
const stripeRoutes = require('./routes/User/stripe.js');
app.use('/api/stripe', stripeRoutes);
app.use('/api', require('./routes/index.js'));

/* -------------------------------------------------------------------------- */
/* 6. INICIALIZACIÓN Y SEEDING                                                */
/* -------------------------------------------------------------------------- */
const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`🚀 Servidor escuchando en el puerto ${PORT}`);
  console.log("📍 Webhook de Stripe activo en /api/webhook/stripe");
  
  // Ejecutamos tareas iniciales
  createAdmin();
  seedPlanes();
});

// require('dotenv').config();
// const express = require("express");
// const cors = require('cors'); 
// const cookieParser = require("cookie-parser");

// const seedPlanes = require('./seed/seedPlanes.js');
// const stripeRoutes = require('./routes/User/stripe.js');
// const stripeWebhookHandler = require('./webhooks/stripeWebhook');
// const { JWT_SECRET } = process.env;

// const app = express();

// /* --------------------------------------------- */
// /*      1. WEBHOOK PRIMERO Y SIN JSON PARSER     */
// /* --------------------------------------------- */
// app.post(
//   '/api/webhook/stripe',
//   express.raw({ type: 'application/json' }),
//   stripeWebhookHandler
// );


// // urlencoded normal
// app.use(express.urlencoded({ extended: true }));

// /* --------------------------------------------- */
// /*                     3. CORS                   */
// /* --------------------------------------------- */
// app.use(cors({
//   origin: '*',
//   methods: "GET,POST,PUT,DELETE",
//   credentials: true,
//   allowedHeaders: ['Content-Type', 'x-user-session','Authorization']
// }));

// /* --------------------------------------------- */
// /*           4. COOKIES + RUTAS NORMALES         */
// /* --------------------------------------------- */
// app.use(cookieParser(JWT_SECRET));

// // rutas stripe (checkout)
// app.use('/api/stripe', stripeRoutes);

// // rutas generales
// app.use('/api', require('./routes/index.js'));

// /* --------------------------------------------- */
// /*                 5. INICIO SERVER              */
// /* --------------------------------------------- */
// const PORT = process.env.PORT || 3001;

// app.listen(PORT, () => {
//   console.log(`Servidor escuchando en ${PORT}`);
//   console.log("Webhook funcionando: /api/webhook/stripe");
// });

// /* --------------------------------------------- */
// /*             6. DATABASE + ADMIN               */
// /* --------------------------------------------- */
// require('./database/db.js');
// const createAdmin = require('./utils/createAdmin');
// createAdmin();
// seedPlanes();
