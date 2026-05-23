// offline.service.js

const redis = require('../../config/redis');

const QUEUE_KEY = (userId) => `offline_queue:${userId}`;

async function pushMessage(userId, messageId) {
  await redis.lpush(QUEUE_KEY(userId), messageId);
}

async function getQueuedMessageIds(userId) {
  return redis.lrange(QUEUE_KEY(userId), 0, -1);
}

async function clearQueue(userId) {
  await redis.del(QUEUE_KEY(userId));
}

module.exports = { pushMessage, getQueuedMessageIds, clearQueue };