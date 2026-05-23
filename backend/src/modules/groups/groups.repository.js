const db = require('../../config/db');

async function findAllForUser(userId) {
  const res = await db.query(
    `SELECT g.*
     FROM groups g
     JOIN group_members gm ON gm.group_id = g.id
     WHERE gm.user_id = $1
     ORDER BY g.created_at ASC`,
    [userId]
  );
  return res.rows;
}

async function findById(groupId) {
  const res = await db.query(`SELECT * FROM groups WHERE id = $1`, [groupId]);
  return res.rows[0] || null;
}

async function create(name, createdBy) {
  const res = await db.query(
    `INSERT INTO groups (name, created_by) VALUES ($1, $2) RETURNING *`,
    [name, createdBy]
  );
  return res.rows[0];
}

async function addMember(groupId, userId) {
  await db.query(
    `INSERT INTO group_members (group_id, user_id) VALUES ($1, $2)
     ON CONFLICT DO NOTHING`,
    [groupId, userId]
  );
}

async function removeMember(groupId, userId) {
  await db.query(
    `DELETE FROM group_members WHERE group_id = $1 AND user_id = $2`,
    [groupId, userId]
  );
}

async function getMembers(groupId) {
  const res = await db.query(
    `SELECT u.id, u.username
     FROM users u
     JOIN group_members gm ON gm.user_id = u.id
     WHERE gm.group_id = $1
     ORDER BY u.username ASC`,
    [groupId]
  );
  return res.rows;
}

async function isMember(groupId, userId) {
  const res = await db.query(
    `SELECT 1 FROM group_members WHERE group_id = $1 AND user_id = $2`,
    [groupId, userId]
  );
  return res.rows.length > 0;
}

module.exports = {
  findAllForUser,
  findById,
  create,
  addMember,
  removeMember,
  getMembers,
  isMember,
};