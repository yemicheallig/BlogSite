// Restrict routes to authenticated administrators only
exports.isAdmin = (req, res, next) => {
  if (req.session && req.session.userId && req.session.userRole === 'admin') {
    return next();
  }
  // Unauthorized attempt: redirect back to safe login portal
  res.redirect('/login');
};

// Optional: Restrict routes to general logged-in users
exports.isAuthenticated = (req, res, next) => {
  if (req.session && req.session.userId) {
    return next();
  }
  res.redirect('/login');
};
