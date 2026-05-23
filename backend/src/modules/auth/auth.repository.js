//auth.repository.js
const db = require('../../config/db');

async function createUser({ email, username, password }) {
  // Se não foi dado username, usa a parte antes do @
  const finalUsername = username?.trim() || email.split('@')[0];
  const res = await db.query(
    `INSERT INTO users (email, username, password)
     VALUES ($1, $2, $3)
     RETURNING id, email, username`,
    [email, finalUsername, password]
  );
  return res.rows[0];
}

async function findByEmail(email) {
  const res = await db.query(
    `SELECT * FROM users WHERE email = $1`,
    [email]
  );
  return res.rows[0] || null;
}

module.exports = {
  createUser,
  findByEmail
};