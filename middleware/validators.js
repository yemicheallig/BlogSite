const { body, validationResult } = require('express-validator');

// Validation rules for logging in
exports.loginValidator = [
  body('email')
    .isEmail().withMessage('Please provide a valid email address.')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password field cannot be left blank.'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Re-render the login page with the first specific error message
      return res.status(400).render('login', { error: errors.array()[0].msg });
    }
    next();
  }
];

// Validation rules for the visitor Contact Form
exports.contactValidator = [
  body('name').trim().notEmpty().withMessage('Name is required.'),
  body('email').isEmail().withMessage('Valid email is required.').normalizeEmail(),
  body('subject').trim().notEmpty().withMessage('Subject cannot be empty.'),
  body('message').isLength({ min: 10 }).withMessage('Message must be at least 10 characters long.'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
  }
];