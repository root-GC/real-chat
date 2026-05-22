const presenceRepo = require('./presence.repository');
const usersRepo = require('../users/users.repository');

async function setOnline(userId, socketId) {
  // Remove socket antigo se existir
  const existingSocket = await presenceRepo.getSocketByUserId(userId);
  if (existingSocket && existingSocket !== socketId) {
    await presenceRepo.setUserOffline(existingSocket);
  }
  await presenceRepo.setUserOnline(userId, socketId);
}

async function setOffline(socketId) {
  return presenceRepo.setUserOffline(socketId);
}

async function getSocketId(userId) {
  return presenceRepo.getSocketByUserId(userId);
}

async function isOnline(userId) {
  const socket = await presenceRepo.getSocketByUserId(userId);
  return !!socket;
}

async function getAllOnlineUsers() {
  const ids = await presenceRepo.getAllOnlineUserIds();
  const users = [];
  for (const id of ids) {
    try {
      const user = await usersRepo.findById(id);
      users.push({ id, username: user?.username || `user_${id}` });
    } catch {
      users.push({ id, username: `user_${id}` });
    }
  }
  return users;
}

module.exports = { setOnline, setOffline, getSocketId, isOnline, getAllOnlineUsers };