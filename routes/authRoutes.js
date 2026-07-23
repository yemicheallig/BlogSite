const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { loginValidator } = require('../middleware/validators');

// Apply validator array right between path string and controller executor
router.get('/',authController.index)
router.get('/blogs',authController.blogs)
router.get('/post/:id',authController.posts)
router.get('/contact', authController.contact)
router.post('/contact',authController.contactForm)
router.get('/about', authController.about)
router.get('/search', authController.searchPage);



module.exports = router;