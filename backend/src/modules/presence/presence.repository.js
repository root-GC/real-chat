// presence.repository.js
const redis = require('../../config/redis');

const USER_KEY = (userId) => `presence:user:${userId}`;
const SOCKET_KEY = (socketId) => `socket:user:${socketId}`;

async function setUserOnline(userId, socketId) {
  await redis.set(USER_KEY(userId), socketId);
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
  return keys.map(key => key.split(':')[2]);
}

module.exports = { setUserOnline, setUserOffline, getSocketByUserId, getAllOnlineUserIds };