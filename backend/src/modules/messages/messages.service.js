// messages.service.js
const deliveryEngine = require('../delivery/delivery.engine');
const repo = require('./messages.repository');

async function sendPrivate({ fromId, toId, content }) {
  return deliveryEngine.send({ fromId, toId, content });
}

async function sendGroup({ fromId, groupId, content }) {
  const msg = await repo.create({
    sender_id: fromId,
    group_id: groupId,
    content,
    type: 'group',
    status: 'sent',
  });
  return { msg };
}

async function getConversation(userId, otherId) {
  return repo.getConversation(userId, otherId);
}

async function getGroupMessages(groupId) {
  return repo.getGroupMessages(groupId);
}

async function editMessage(messageId, content) {
  await repo.updateContent(messageId, content);
  return repo.getMessageById(messageId);
}

async function deleteMessage(messageId) {
  const msg = await repo.getMessageById(messageId);
  if (!msg) return null;
  await repo.markAsDeleted(messageId);
  return msg;
}

module.exports = {
  sendPrivate,
  sendGroup,
  getConversation,
  getGroupMessages,
  editMessage,
  deleteMessage,
};