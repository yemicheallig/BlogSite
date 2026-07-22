const express = require('express');
const router = express.Router();
const pathController = require('../controllers/pathController');

router.get('/',pathController.index)
router.get('/blogs',pathController.blogs)
router.get('/post/:id',pathController.posts)
router.get('/contact', pathController.contact)
router.post('/contact',pathController.contactForm)
router.get('/about', pathController.about)
router.get('/search', pathController.searchPage);

router.get('/sitemap.xml', pathController.getSitemap);

module.exports = router;