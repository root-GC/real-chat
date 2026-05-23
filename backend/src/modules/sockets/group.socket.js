// group.socket.js

const messageService = require('../messages/messages.service');
const EVENTS = require('./events');

module.exports = function (io, socket) {

  socket.on(EVENTS.GROUP_SEND, async (data) => {
    const { groupId, content, clientId } = data;
    const fromId = socket.user.id;

    const { msg } = await messageService.sendGroup({
      fromId,
      groupId,
      content,
    });

    const payload = {
      id: msg.id,
      content: msg.content,
      sender_id: fromId,
      sender_name: socket.user.username,
      group_id: groupId,
      created_at: msg.created_at,
      clientId,
    };

    // IMPORTANTE: apenas grupo, não io.emit global
    io.to(`group:${groupId}`).emit(EVENTS.GROUP_MESSAGE, payload);
  });
};