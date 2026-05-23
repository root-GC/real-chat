const presenceService = require('../presence/presence.service');
const EVENTS          = require('./events');

module.exports = function (io, socket) {
  const user = socket.user;

  // ── TYPING START ──────────────────────────────────────────────────────────
  // Client emits: { type: 'private' | 'group', id: partnerId | groupId }
  socket.on(EVENTS.TYPING_START, async ({ type, id }) => {
    if (!type || !id) return;

    const payload = {
      type,
      id,
      userId:   user.id,
      username: user.username,
      active:   true,
    };

    if (type === 'private') {
      // send only to the partner if online
      const targetSocketId = await presenceService.getSocketId(id);
      if (targetSocketId) {
        io.to(targetSocketId).emit('typing:update', payload);
      }
    } else if (type === 'group') {
      // broadcast to everyone else in the group room
      socket.to(`group:${id}`).emit('typing:update', payload);
    }
  });

  // ── TYPING STOP ───────────────────────────────────────────────────────────
  socket.on(EVENTS.TYPING_STOP, async ({ type, id }) => {
    if (!type || !id) return;

    const payload = {
      type,
      id,
      userId:   user.id,
      username: user.username,
      active:   false,
    };

    if (type === 'private') {
      const targetSocketId = await presenceService.getSocketId(id);
      if (targetSocketId) {
        io.to(targetSocketId).emit('typing:update', payload);
      }
    } else if (type === 'group') {
      socket.to(`group:${id}`).emit('typing:update', payload);
    }
  });
};