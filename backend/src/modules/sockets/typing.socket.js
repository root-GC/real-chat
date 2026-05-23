// typing.socket.js

const typingService = require('../typing/typing.service');
const EVENTS = require('./events');

module.exports = function (io, socket) {
  socket.on(EVENTS.TYPING_START, async ({ toId }) => {
    const targetSocketId = await typingService.handleTypingStart({
      fromId: socket.user.id,
      toId,
    });

    if (targetSocketId) {
      io.to(targetSocketId).emit(EVENTS.TYPING, {
        from: socket.user.id,
        fromUsername: socket.user.username,
      });
    }
  });

  // typing stop pode ser omitido no cliente com timeout
  socket.on(EVENTS.TYPING_STOP, ({ toId }) => {
    // opcional: enviar um evento 'typing:stop'
  });
};