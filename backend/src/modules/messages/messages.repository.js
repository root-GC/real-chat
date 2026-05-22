const db = require('../../config/db');

async function create({ sender_id, receiver_id, group_id, content, type = 'text', status = 'sent' }) {
  const res = await db.query(
    `INSERT INTO messages (sender_id, receiver_id, group_id, content, type, status)
     VALUES ($1,$2,$3,$4,$5,$6)
     RETURNING *`,
    [sender_id, receiver_id || null, group_id || null, content, type, status]
  );
  return res.rows[0];
}

async function findByIds(ids) {
  if (ids.length === 0) return [];
  const res = await db.query(
    `SELECT m.*, u.username as sender_name
     FROM messages m
     JOIN users u ON u.id = m.sender_id
     WHERE m.id = ANY($1)
     ORDER BY m.created_at ASC`,
    [ids]
  );
  return res.rows;
}

async function getConversation(userId, otherId) {
  const res = await db.query(
    `SELECT m.*, u.username as sender_name
     FROM messages m
     JOIN users u ON u.id = m.sender_id
     WHERE (sender_id = $1 AND receiver_id = $2)
        OR (sender_id = $2 AND receiver_id = $1)
     ORDER BY m.created_at ASC`,
    [userId, otherId]
  );
  return res.rows;
}

async function getGroupMessages(groupId) {
  const res = await db.query(
    `SELECT m.*, u.username as sender_name
     FROM messages m
     JOIN users u ON u.id = m.sender_id
     WHERE m.group_id = $1
     ORDER BY m.created_at ASC`,
    [groupId]
  );
  return res.rows;
}

async function updateStatus(messageId, status) {
  await db.query(`UPDATE messages SET status = $2 WHERE id = $1`, [messageId, status]);
}

async function getMessageById(id) {
  const res = await db.query(`SELECT * FROM messages WHERE id = $1`, [id]);
  return res.rows[0] || null;
}

async function updateContent(id, content) {
  await db.query(
    `UPDATE messages SET content = $1, edited_at = NOW() WHERE id = $2`,
    [content, id]
  );
}

async function markAsDeleted(id) {
  await db.query(
    `UPDATE messages SET deleted_at = NOW(), content = '' WHERE id = $1`,
    [id]
  );
}

module.exports = {
  create, findByIds,
  getConversation,
  getGroupMessages,
  getMessageById,
  updateContent,
  markAsDeleted,
  updateStatus
};