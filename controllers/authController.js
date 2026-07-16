const bcrypt = require('bcrypt');
const User = require('../models/userModel');

// Handle Admin & User Login
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1. Fetch user by email
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).render('login', { error: 'Invalid email or password.' });
    }

    // 2. Verify hashed password securely using bcrypt
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).render('login', { error: 'Invalid email or password.' });
    }

    // 3. Establish Session State
    req.session.userId = user.id;
    req.session.userName = user.name;
    req.session.userRole = user.role;

    // 4. Track state and redirect based on privileges
    if (user.role === 'admin') {
      return res.redirect('/admin/dashboard');
    }
    res.redirect('/');
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).render('login', { error: 'An unexpected server error occurred.' });
  }
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


