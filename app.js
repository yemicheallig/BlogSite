const express = require('express');
const session = require('express-session');
const path = require('path');
const app = express();
require('events').EventEmitter.defaultMaxListeners = 20;

// 1. Configure view engine and static assets FIRST
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// 2. Body parsers
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// 3. Set up sessions
app.use(session({
  secret: 'super_secret_session_key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24, // 1 day
    secure: false 
  }
}));

// 4. Global layout helper (Combined into one clean middleware)
app.use((req, res, next) => {
  res.locals.user = req.session.userId ? {
    id: req.session.userId,
    name: req.session.userName,
    role: req.session.userRole,
    avatar: req.session.adminUser?.avatar || '/images/admin-avatar.jpg'
  } : null;
  next();
});

app.use((req, res, next) => {
    res.locals.req = req; // Makes 'req' available inside ALL EJS templates
    next();
});

// 5. Mount Router Files (Clean and uncluttered)
const pathRoutes = require('./routes/pathRoutes');
const adminRoutes = require('./routes/admin');

app.use('/', pathRoutes);
app.use('/', adminRoutes); // Mounts everything from routes/admin.js

// -------------------------------------------------------------
// 404 CATCH-ALL MIDDLEWARE 
// -------------------------------------------------------------
app.use((req, res) => {
    res.status(404).render('public/404', {
        title: '404 - Page Not Found | Blogify',
        activePage: '',
        meta: {
            title: '404 - Page Not Found | Blogify',
            description: 'The requested page could not be found on Blogify.'
        }
    });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server executing live on http://localhost:${PORT}`));