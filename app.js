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

// 5. Mount Router Files (Clean and uncluttered)
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/admin');

app.use('/', authRoutes);
app.use('/', adminRoutes); // Mounts everything from routes/admin.js

// 6. Public route fallback
app.get('/login', (req, res) => res.render('login', { error: null }));

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server executing live on http://localhost:${PORT}`));