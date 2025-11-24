const { check } = require("express-validator");
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
    check("adress").exists().notEmpty(), // Agrega la validación para el campo adress
    (req, res, next) => {
        validateResult(req, res, next);
    },
];

module.exports = { validateLogin, validateRegister };