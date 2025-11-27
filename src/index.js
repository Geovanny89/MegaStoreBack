require('dotenv').config();
const express = require("express");
const cors = require('cors');
const bodyParser= require('body-parser');
const cookieParser = require("cookie-parser");
const seedPlanes = require('./seed/seedPlanes.js');
const stripeRoutes = require('./routes/User/stripe.js');
const stripeWebhookHandler = require('./webhooks/stripeWebhook');
const { JWT_SECRET } = process.env;

const app = express();

/* -------------------------------------------------------------------------- */
/*                            1. WEBHOOK SIN JSON                             */
/* -------------------------------------------------------------------------- */
app.post(
  '/api/webhook/stripe',
  express.raw({ type: 'application/json' }),
  stripeWebhookHandler
);

/* -------------------------------------------------------------------------- */
/*                         2. JSON PARSERS (DESPUÉS)                          */
/* -------------------------------------------------------------------------- */
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

/* -------------------------------------------------------------------------- */
/*                              3. CONFIG CORS                                */
/* -------------------------------------------------------------------------- */
app.use(cors({
  origin: '*',
  methods: "GET,POST,PUT,DELETE",
  credentials: true,
  allowedHeaders: ['Content-Type', 'x-user-session','Authorization']
}));

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", '*');
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  res.header("Access-Control-Allow-Methods",
    "GET, POST, OPTIONS, PUT, DELETE"
  );
  next();
});

/* -------------------------------------------------------------------------- */
/*                            4. COOKIE + ROUTES                              */
/* -------------------------------------------------------------------------- */
app.use(cookieParser(JWT_SECRET));

// Rutas Stripe
app.use('/api/stripe', stripeRoutes);

// Rutas generales
app.use('/api', require('./routes/index.js'));

/* -------------------------------------------------------------------------- */
/*                              5. INICIO SERVIDOR                            */
/* -------------------------------------------------------------------------- */
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});

/* -------------------------------------------------------------------------- */
/*                             6. DATABASE + ADMIN                            */
/* -------------------------------------------------------------------------- */
require('./database/db.js');
const createAdmin = require('./utils/createAdmin');
createAdmin();
seedPlanes();