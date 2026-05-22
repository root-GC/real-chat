const db = require('../../config/db');

async function findById(id) {
  const res = await db.query(
    `SELECT id, username, email FROM users WHERE id = $1`,
    [id]
  );
  return res.rows[0] || null;
}

async function findByEmail(email) {
  const res = await db.query(
    `SELECT id, username, email, password FROM users WHERE email = $1`,
    [email]
  );
  return res.rows[0] || null;
}

async function findByUsername(username) {
  const res = await db.query(
    `SELECT id, username, email FROM users WHERE username = $1`,
    [username]
  );
  return res.rows[0] || null;
}

async function create({ email, username, password }) {
  const res = await db.query(
    `INSERT INTO users (email, username, password)
     VALUES ($1, $2, $3)
     RETURNING id, username, email`,
    [email, username || email, password]
  );
  return res.rows[0];
}

async function findAll() {
  const res = await db.query(
    `SELECT id, username, email FROM users ORDER BY username ASC`
  );
  return res.rows;
}

module.exports = { findById, findByEmail, findByUsername, create, findAll };