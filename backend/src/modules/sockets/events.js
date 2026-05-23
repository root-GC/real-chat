module.exports = {
  // Client → Server
  JOIN:          'join',
  PRIVATE_SEND:  'private:send',
  GROUP_SEND:    'group:send',
  TYPING_START:  'typing:start',
  TYPING_STOP:   'typing:stop',

  // Server → Client
  PRIVATE_MESSAGE: 'private:message',
  GROUP_MESSAGE:   'group:message',   // broadcast to group:N room
  GROUP_HISTORY:   'group:history',   // FIX: renamed from 'history'
  USER_ONLINE:     'user:online',
  USER_OFFLINE:    'user:offline',
  USERS_UPDATE:    'users:update',
  TYPING:          'typing',
};