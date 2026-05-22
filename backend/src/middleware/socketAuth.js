const { verify } = require('../utils/jwt');

module.exports = (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error('Token obrigatório'));
    }

    const decoded = verify(token);

    socket.user = decoded;

    next();
  } catch (err) {
    next(new Error('Token inválido'));
  }
};