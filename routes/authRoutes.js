const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { loginValidator } = require('../middleware/validators');

// Apply validator array right between path string and controller executor
router.post('/login', loginValidator, authController.login);
router.get('/logout', authController.logout);

module.exports = router;