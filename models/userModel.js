const db = require('../config/db');

const User = {
  // Find an admin or visitor by email
  findByEmail: async (email) => {
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0]; // Returns user object or undefined
  },

  // Create a new user (Useful for seeding an initial admin account)
  create: async (name, email, hashedPassword, role = 'visitor') => {
    const [result] = await db.query(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, role]
    );
    return result.insertId;
  }
};

module.exports = User;

