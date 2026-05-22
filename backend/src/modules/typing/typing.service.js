const presenceService = require('../presence/presence.service');

async function handleTypingStart({ fromId, toId }) {
  const socketId = await presenceService.getSocketId(toId);
  return socketId; // quem vai emitir é o socket handler
}

module.exports = { handleTypingStart };