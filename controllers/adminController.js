// controllers/adminController.js
const db = require('../config/db');
const bcrypt = require('bcrypt'); 

// 1. Render the admin registration form
exports.getRegister = (req, res) => {
    res.render('admin/register', { error: null, success: null });
};

// 2. Process the registration submission
exports.postRegister = async (req, res) => {
    const { name, email, password, confirmPassword } = req.body;

    try {
        // Validation: Check if passwords match
        if (password !== confirmPassword) {
            return res.render('admin/register', { error: 'Passwords do not match.', success: null });
        }

        // Validation: Check if user already exists
        const [existingUser] = await db.query('SELECT id FROM users WHERE email = ? LIMIT 1', [email]);
        if (existingUser.length > 0) {
            return res.render('admin/register', { error: 'Email is already registered.', success: null });
        }

        // Securely hash the password (using 10 salt rounds)
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert the new admin user into the database (setting role to 'admin')
        await db.query(
            'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
            [name, email, hashedPassword, 'admin']
        );

        return res.render('admin/register', { 
            error: null, 
            success: 'Admin registered successfully! You can now log in.' 
        });

    } catch (err) {
        console.error("Registration Error:", err);
        return res.render('admin/register', { error: 'An error occurred during registration.', success: null });
    }
};

exports.getLogin = (req, res) => {
    res.render('admin/login', { error: null });
};

exports.postLogin = async (req, res) => {
    // Add .trim() to clean up any accidental spaces
const email = req.body.email.trim();
const password = req.body.password.trim();
    
    // DEBUG LOG 1: Check what the browser is sending
    console.log("--- Login Attempt ---");
    console.log("Submitted Email:", email);
    console.log("Submitted Password:", password);
    
    try {
        // Fetch user from the database
        const [rows] = await db.query('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);
        
        // DEBUG LOG 2: Check if database actually found a matching user
        console.log("Database Query Results Length:", rows.length);
        if (rows.length > 0) {
            console.log("User Found in DB:", rows[0].email);
            console.log("Hashed Password in DB:", rows[0].password);
            console.log("User Role in DB:", rows[0].role);
        } else {
            console.log("No user found in DB matching email:", email);
        }

        if (rows.length === 0) {
            return res.render('admin/login', { error: 'Invalid credentials provided. (No user found)' });
        }

        const user = rows[0];

        // Check password using bcrypt
        const isMatch = await bcrypt.compare(password, user.password);
        
        // DEBUG LOG 3: Check if Bcrypt matched
        console.log("Bcrypt Match Result:", isMatch);

        if (!isMatch) {
            return res.render('admin/login', { error: 'Invalid credentials provided. (Password mismatch)' });
        }

        if (user.role !== 'admin') {
            return res.render('admin/login', { error: 'Access denied. Admins only.' });
        }

        // Bind information dynamically to the session
        req.session.userId = user.id;
        req.session.userName = user.name;
        req.session.userRole = user.role;
        
        req.session.adminUser = { 
            id: user.id, 
            name: user.name, 
            email: user.email, 
            bio: user.bio,
            avatar: user.avatar || '/images/admin-avatar.jpg'
        };
        
        return res.redirect('/admin/dashboard');

    } catch (err) {
        console.error("Login Error:", err);
        return res.render('admin/login', { error: 'An unexpected database error occurred.' });
    }
};

exports.getProfile = async (req, res) => {
    // If user is logged in, pull the latest real-time values from the database
    if (req.session.userId) {
        try {
            const [rows] = await db.query('SELECT id, name, email, bio, avatar, role FROM users WHERE id = ?', [req.session.userId]);
            if (rows.length > 0) {
                const user = rows[0];
                // Keep the session fully synced with any direct DB edits
                req.session.adminUser = {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    bio: user.bio,
                    avatar: user.avatar || '/images/admin-avatar.jpg'
                };
                return res.render('admin/profile', { user: req.session.adminUser, success: null, error: null });
            }
        } catch (err) {
            console.error("Fetch Profile Error:", err);
        }
    }
    
    // Safety redirect if session isn't populated or query fails
    res.redirect('/admin/login');
};

exports.updateProfile = async (req, res) => {
    const { name, email, bio } = req.body;
    const userId = req.session.userId;

    try {
        // 1. Run live UPDATE query on the MySQL Database
        await db.query(
            'UPDATE users SET name = ?, email = ?, bio = ? WHERE id = ?', 
            [name, email, bio, userId]
        );
        
        // 2. Synchronize active session values with the updated database state
        if (req.session.adminUser) {
            req.session.adminUser.name = name;
            req.session.adminUser.email = email;
            req.session.adminUser.bio = bio;
        }
        req.session.userName = name;

        res.render('admin/profile', { 
            user: req.session.adminUser, 
            success: 'Profile updated successfully in the database!', 
            error: null 
        });
    } catch (err) {
        console.error("Update Profile Error:", err);
        res.render('admin/profile', { 
            user: { ...req.body, avatar: req.session.adminUser?.avatar || '/images/admin-avatar.jpg' }, 
            success: null, 
            error: 'Failed to update database profile record.' 
        });
    }
};

exports.updateAvatar = async (req, res) => {
    if (!req.file) {
        return res.redirect('/admin/profile?error=No file selected or invalid format');
    }
    
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    const userId = req.session.userId;

    try {
        // 1. Update database entry
        await db.query('UPDATE users SET avatar = ? WHERE id = ?', [avatarUrl, userId]);
        
        // 2. Sync session wrapper image paths
        if (req.session.adminUser) {
            req.session.adminUser.avatar = avatarUrl;
        }
        
        res.redirect('/admin/profile');
    } catch (err) {
        console.error("Update Avatar Error:", err);
        res.redirect('/admin/profile?error=Failed to save uploaded image path to database');
    }
};

exports.getDashboard = async (req, res) => {
    try {
        // 1. Execute aggregate queries in parallel
        const [totalPostsQuery] = await db.query('SELECT COUNT(*) AS count FROM posts');
const [publishedPostsQuery] = await db.query(
  `SELECT COUNT(*) AS count FROM posts WHERE status = 'published'`
);        const [draftPostsQuery] = await db.query('SELECT COUNT(*) AS count FROM posts WHERE status = "draft"');
        const [categoriesQuery] = await db.query('SELECT COUNT(*) AS count FROM categories');
        
        // Dynamic count of media files (unique images uploaded in posts + avatars)
        const [mediaQuery] = await db.query(`
            SELECT (
                (SELECT COUNT(DISTINCT featured_image) FROM posts WHERE featured_image IS NOT NULL) + 
                (SELECT COUNT(DISTINCT avatar) FROM users WHERE avatar IS NOT NULL)
            ) AS count
        `);

        // 2. Fetch the latest 5 posts to display in a "Recent Activity" table
        const [recentPosts] = await db.query(`
            SELECT p.*, u.name AS author, c.name AS category_name 
            FROM posts p 
            JOIN users u ON p.author_id = u.id 
            LEFT JOIN categories c ON p.category_id = c.id 
            ORDER BY p.created_at DESC 
            LIMIT 5
        `);

        // Assemble metrics object
        const metrics = {
            totalPosts: totalPostsQuery[0].count,
            publishedPosts: publishedPostsQuery[0].count,
            draftPosts: draftPostsQuery[0].count,
            categories: categoriesQuery[0].count,
            totalMedia: mediaQuery[0].count
        };

        // 3. Render dashboard view with dynamic metrics
        res.render('admin/dashboard', { 
            metrics, 
            recentPosts,
            user: req.session.adminUser 
        });

    } catch (err) {
        console.error("Dashboard Metrics Error:", err);
        res.status(500).send("Error loading admin dashboard.");
    }
};

exports.logOut =  async  (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error("Logout Error:", err);
            return res.redirect('/admin/dashboard');
        }
        res.clearCookie('connect.sid'); // Clear the session cookie
        res.redirect('/'); // Or '/admin/login'
    });
};

// Handle Logout
exports.logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
    }
    res.redirect('/login');
  });
};
