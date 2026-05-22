const messageService = require('../messages/messages.service');
const EVENTS = require('./events');

module.exports = function (io, socket) {
  socket.on(EVENTS.GROUP_SEND, async (data) => {
    const { groupId, content } = data;
    const fromId = socket.user.id;

    // guarda no banco via service
    const { msg } = await messageService.sendGroup({ fromId, groupId, content });

    // envia para TODOS os clientes conectados
    io.emit(EVENTS.GROUP_MESSAGE, {
      ...msg,
      sender_name: socket.user.username,
    });
  });
};