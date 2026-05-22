const EVENTS = require('./events');

module.exports = function (io) {
  io.on('connection', (socket) => {
    // Inicializa os handlers, passando a autenticação
    require('./presence.socket')(io, socket);
    require('./chat.socket')(io, socket);
    require('./typing.socket')(io, socket);
  });
};