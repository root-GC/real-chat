module.exports = {
  // Cliente -> Servidor
  JOIN: 'join',
  PRIVATE_SEND: 'private:send',
  TYPING_START: 'typing:start',
  TYPING_STOP: 'typing:stop',

  // Servidor -> Cliente
  PRIVATE_MESSAGE: 'private:message',
  USER_ONLINE: 'user:online',
  USER_OFFLINE: 'user:offline',
  USERS_UPDATE: 'users:update',
  TYPING: 'typing',
  GROUP_SEND: 'group:send',
  GROUP_MESSAGE: 'group:message'

};
