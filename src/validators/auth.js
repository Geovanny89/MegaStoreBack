const { check, body } = require("express-validator");
const { validateResult } = require("../utils/handleValidators");

const validateLogin = [
    check("email").exists().notEmpty(),
    check("password").exists().notEmpty(),
    (req, res, next) => {
        validateResult(req, res, next);
    },
];
const validateRegister = [
    check("name").exists().notEmpty().isLength({ min: 3, max: 99 }),
    check("lastName").exists().notEmpty(),
    check("identity").exists().notEmpty(), // Agrega la validación para el campo identity
    check("email").exists().notEmpty().isEmail(),
    check("password").exists().notEmpty().isLength({ min: 8, max: 15 }),
    check("phone").exists().notEmpty(), // Agrega la validación para el campo phone
    check("addresses").exists().notEmpty(), // Agrega la validación para el campo adress
    check("rol").exists().notEmpty().isIn(["user", "seller"]),
    // ✔ storeName solo obligatorio si es seller
    body("storeName")
        .if(body("rol").equals("seller"))
        .exists().withMessage("storeName es obligatorio para sellers")
        .notEmpty().withMessage("storeName no puede estar vacío"),

        // ✔ planId obligatorio solo si es seller
    body("planId")
        .if(body("rol").equals("seller"))
        .exists().withMessage("planId es obligatorio para sellers")
        .notEmpty().withMessage("planId no puede estar vacío")
        .isMongoId().withMessage("El planId debe ser un ObjectId válido"),
    (req, res, next) => {
        validateResult(req, res, next);
    },
];

module.exports = { validateLogin, validateRegister };