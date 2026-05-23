const redis = require('../../config/redis');

// ─── socket ↔ user mappings ────────────────────────────────────────────────

const USER_KEY   = (userId)   => `presence:user:${userId}`;
const SOCKET_KEY = (socketId) => `socket:user:${socketId}`;

async function setUserOnline(userId, socketId) {
  await redis.set(USER_KEY(userId),   socketId);
  await redis.set(SOCKET_KEY(socketId), userId);
}

async function setUserOffline(socketId) {
  const userId = await redis.get(SOCKET_KEY(socketId));
  if (userId) {
    await redis.del(USER_KEY(userId));
    await redis.del(SOCKET_KEY(socketId));
  }
  return userId;
}

async function getSocketByUserId(userId) {
  return redis.get(USER_KEY(userId));
}

async function getAllOnlineUserIds() {
  const keys = await redis.keys('presence:user:*');
  return keys.map((key) => key.split(':')[2]);
}

// ─── group last-seen tracking ─────────────────────────────────────────────
// Used to compute unread count when a user reconnects.

const GROUP_SEEN_KEY = (userId, groupId) => `group_seen:${userId}:${groupId}`;

/**
 * Record the moment a user last read a group (call when they open or send in it).
 */
async function setGroupLastSeen(userId, groupId) {
  await redis.set(GROUP_SEEN_KEY(userId, groupId), new Date().toISOString());
}

/**
 * Returns ISO string of last read time, or null if never seen.
 */
async function getGroupLastSeen(userId, groupId) {
  return redis.get(GROUP_SEEN_KEY(userId, groupId));
}

module.exports = {
  setUserOnline,
  setUserOffline,
  getSocketByUserId,
  getAllOnlineUserIds,
  setGroupLastSeen,
  getGroupLastSeen,
};