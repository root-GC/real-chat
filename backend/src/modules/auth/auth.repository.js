const db = require('../../config/db'); // ajusta caminho se necessário

async function createUser({ email, username, password }) {
  const res = await db.query(
    `INSERT INTO users (email, username, password)
     VALUES ($1, $2, $3)
     RETURNING id, email, username`,
    [email, username, password]
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