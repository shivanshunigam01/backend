const { body } = require('express-validator');

exports.loginValidator = [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];
