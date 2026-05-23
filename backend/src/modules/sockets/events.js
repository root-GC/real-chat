module.exports = {
  // Client → Server
  JOIN:           'join',
  PRIVATE_SEND:   'private:send',
  GROUP_SEND:     'group:send',
  JOIN_GROUP:     'join:group',    // join a specific room mid-session
  GROUP_READ:     'group:read',    // user opened / is viewing a group
  TYPING_START:   'typing:start',
  TYPING_STOP:    'typing:stop',

  // Server → Client
  PRIVATE_MESSAGE:  'private:message',
  GROUP_MESSAGE:    'group:message',
  GROUP_HISTORY:    'group:history',   // { groupId, messages, unreadCount, unreadSince }
  USER_GROUPS:      'user:groups',     // list of groups on connect
  USER_ONLINE:      'user:online',
  USER_OFFLINE:     'user:offline',
  USERS_UPDATE:     'users:update',
  TYPING:           'typing',
};