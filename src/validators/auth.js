// const { check, body } = require("express-validator");
// const { validateResult } = require("../utils/handleValidators");

// const validateLogin = [
//     check("email").exists().notEmpty(),
//     check("password").exists().notEmpty(),
//     (req, res, next) => {
//         validateResult(req, res, next);
//     },
// ];
// const validateRegister = [
//     check("name").exists().notEmpty().isLength({ min: 3, max: 99 }),
//     check("lastName").exists().notEmpty(),
//     check("identity").exists().notEmpty(), // Agrega la validación para el campo identity
//     check("email").exists().notEmpty().isEmail(),
//     check("password").exists().notEmpty().isLength({ min: 8, max: 15 }),
//     check("phone").exists().notEmpty(), // Agrega la validación para el campo phone
//     // check("addresses").exists().notEmpty(), // Agrega la validación para el campo adress
//     check("rol").exists().notEmpty().isIn(["user", "seller"]),
//     check("addresses[0][street]")
//     .exists()
//     .notEmpty()
//     .withMessage("La calle es obligatoria"),

//   check("addresses[0][city]")
//     .exists()
//     .notEmpty()
//     .withMessage("La ciudad es obligatoria"),

//   check("addresses[0][country]")
//     .exists()
//     .notEmpty()
//     .withMessage("El país es obligatorio"),

//     // ✔ storeName solo obligatorio si es seller
//     body("storeName")
//         .if(body("rol").equals("seller"))
//         .exists().withMessage("storeName es obligatorio para sellers")
//         .notEmpty().withMessage("storeName no puede estar vacío"),

//         // ✔ planId obligatorio solo si es seller
//     body("planId")
//         .if(body("rol").equals("seller"))
//         .exists().withMessage("planId es obligatorio para sellers")
//         .notEmpty().withMessage("planId no puede estar vacío")
//         .isMongoId().withMessage("El planId debe ser un ObjectId válido"),
//     (req, res, next) => {
//         validateResult(req, res, next);
//     },
// ];

// module.exports = { validateLogin, validateRegister };

const { check } = require("express-validator");
const { validateResult } = require("../utils/handleValidators");

/* ================= VALIDACIÓN LOGIN ================= */
const validateLogin = [
    check("email").exists().notEmpty().isEmail(),
    check("password").exists().notEmpty(),
    (req, res, next) => validateResult(req, res, next),
];

/* ================= VALIDACIÓN REGISTRO USUARIO ================= */
const validatorRegisterUser = [
    check("name").exists().notEmpty().isLength({ min: 3, max: 99 }),
    check("lastName").exists().notEmpty(),
    check("identity").exists().notEmpty(),
    check("email").exists().notEmpty().isEmail(),
    check("password").exists().notEmpty().isLength({ min: 8, max: 15 }),
    check("phone").exists().notEmpty(),
    // Direcciones básicas para el cliente
    check("addresses[0][street]").exists().notEmpty().withMessage("La calle es obligatoria"),
    check("addresses[0][city]").exists().notEmpty().withMessage("La ciudad es obligatoria"),
    check("addresses[0][state]").exists().notEmpty().withMessage("El departamento/estado es obligatorio"),
    (req, res, next) => validateResult(req, res, next),
];

/* ================= VALIDACIÓN REGISTRO VENDEDOR ================= */
const validatorRegisterSeller = [
    // Datos personales
    check("name").exists().notEmpty(),
    check("lastName").exists().notEmpty(),
    check("identity").exists().notEmpty(),
    check("email").exists().notEmpty().isEmail(),
    check("password").exists().notEmpty().isLength({ min: 8, max: 15 }),
    check("phone").exists().notEmpty(),
    
    // Datos obligatorios de Tienda
    check("storeName").exists().notEmpty().withMessage("El nombre de la tienda es obligatorio"),
    check("planId").exists().notEmpty().isMongoId().withMessage("Debes seleccionar un plan válido"),
    
    // NUEVA VALIDACIÓN: Categoría de la tienda
    check("storeCategory")
        .exists()
        .notEmpty()
        .withMessage("La categoría de la tienda es obligatoria")
        .isIn(["Tecnología", "Moda", "Ferretería", "Supermercado", "Hogar", "Belleza", "Deportes", "Otros"])
        .withMessage("Categoría no válida"),

    // Dirección de la tienda / despacho
    check("addresses[0][street]").exists().notEmpty().withMessage("La dirección de la tienda es obligatoria"),
    check("addresses[0][city]").exists().notEmpty().withMessage("La ciudad es obligatoria"),
    
    (req, res, next) => validateResult(req, res, next),
];

module.exports = { validateLogin, validatorRegisterUser, validatorRegisterSeller };