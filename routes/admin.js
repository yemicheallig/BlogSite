const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const adminController = require('../controllers/adminController');
const postController = require('../controllers/postController');
const { isAdmin } = require('../middleware/authMiddleware'); // Your route protection middleware

// Configure Multer Storage for avatars
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads/avatars/');
    },
    filename: (req, file, cb) => {
        // Unique filename: admin-timestamp.ext
        cb(null, `admin-${Date.now()}${path.extname(file.originalname)}`);
    }
});

// File validation filter
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
        return cb(null, true);
    } else {
        cb(new Error('Only images (.jpeg, .jpg, .png, .webp) are allowed!'));
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 2 * 1024 * 1024 } // 2MB Limit
});

// Routes
router.get('/admin/register', adminController.getRegister);
router.post('/admin/register', adminController.postRegister);
router.get('/admin/login', adminController.getLogin);
router.post('/admin/login', adminController.postLogin);
router.get('/admin/profile', isAdmin, adminController.getProfile);
router.get('/admin/dashboard', isAdmin, adminController.getDashboard);
router.get('/admin/logout', adminController.logOut);


// Profile Update Routes
router.post('/admin/profile/update', adminController.updateProfile);
router.post('/admin/profile/avatar', upload.single('avatar'), adminController.updateAvatar);


// Configure Multer for Post Featured Images
const postStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads/posts/');
    },
    filename: (req, file, cb) => {
        // Formats filename to: post-timestamp.ext
        cb(null, `post-${Date.now()}${path.extname(file.originalname)}`);
    }
});

const uploadPostImg = multer({ 
    storage: postStorage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit for high-quality post graphics
});

// Post Management Routes (All protected by isAdmin)
router.get('/admin/posts', isAdmin, postController.getAllPosts);
router.get('/admin/posts/create', isAdmin, postController.getCreatePost);
router.post('/admin/posts/create', isAdmin, uploadPostImg.single('featured_image'), postController.postCreatePost);
router.get('/admin/posts/edit/:id', isAdmin, postController.getEditPost);
router.post('/admin/posts/edit/:id', isAdmin, uploadPostImg.single('featured_image'), postController.postEditPost);
router.post('/admin/posts/delete/:id', isAdmin, postController.deletePost);
router.post('/admin/posts/toggle-status/:id', isAdmin, postController.togglePostStatus);

router.get('/logout', adminController.logout);

module.exports = router;