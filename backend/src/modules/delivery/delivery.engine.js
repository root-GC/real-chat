// delivery.engine.js
const presenceService = require('../presence/presence.service');
const offlineService = require('./offline.service');
const messagesRepo = require('../messages/messages.repository');

async function send({ fromId, toId, content }) {
  const msg = await messagesRepo.create({
    sender_id: fromId,
    receiver_id: toId,
    content,
    status: 'sent',
  });

  const socketId = await presenceService.getSocketId(toId);

  if (socketId) {
    await messagesRepo.updateStatus(msg.id, 'delivered');
    return { msg, delivered: true, socketId };
  }

  await offlineService.pushMessage(toId, msg.id);
  return { msg, delivered: false, socketId: null };
}

async function flushOfflineMessages(userId, socket) {
  const ids = await offlineService.getQueuedMessageIds(userId);
  if (ids.length === 0) return;

  const messages = await messagesRepo.findByIds(ids);

  for (const msg of messages) {
    socket.emit('private:message', {
      ...msg,
      sender_name: msg.sender_name || 'Desconhecido',
    });
    await messagesRepo.updateStatus(msg.id, 'delivered');
  }

  await offlineService.clearQueue(userId);
}

module.exports = { send, flushOfflineMessages };