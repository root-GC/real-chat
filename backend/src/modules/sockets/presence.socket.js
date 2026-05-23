const presenceService   = require('../presence/presence.service');
const deliveryEngine    = require('../delivery/delivery.engine');
const usersRepo         = require('../users/users.repository');
const messagesRepo      = require('../messages/messages.repository');
const { verify }        = require('../../utils/jwt');
const EVENTS            = require('./events');

module.exports = function (io, socket) {

  let user;

  try {
    const token = socket.handshake.auth.token;
    if (token) user = verify(token);
  } catch (e) {
    socket.disconnect(true);
    return;
  }

  if (!user) return;

  socket.user = user;

  // ─── JOIN ─────────────────────────────────────────────────────────────────
  socket.on(EVENTS.JOIN, async () => {
    if (socket.joined) return;
    socket.joined = true;

    // mark online
    await presenceService.setOnline(user.id, socket.id);

    // notify everyone else
    socket.broadcast.emit('user:online', {
      id: user.id,
      username: user.username,
    });

    // ── FIX: join the default group room so group:send broadcasts reach this socket
    socket.join('group:1');

    // send full user list (online/offline) to the joining socket
    const allUsers     = await usersRepo.findAll();
    const onlineUsers  = await presenceService.getAllOnlineUsers();
    const onlineSet    = new Set(onlineUsers.map((u) => Number(u.id)));

    socket.emit('initial_users',
      allUsers.map((u) => ({
        id: u.id,
        username: u.username,
        online: onlineSet.has(Number(u.id)),
      }))
    );

    // ── FIX: renamed from 'history' → 'group:history' so chatContext can
    //         distinguish it from any future per-room history events
    const groupMessages = await messagesRepo.getGroupMessages(1);

    socket.emit('group:history',
      groupMessages.map((m) => ({
        ...m,
        sender_name: m.sender_name || 'Desconhecido',
      }))
    );

    // flush any offline private messages queued while user was away
    await deliveryEngine.flushOfflineMessages(user.id, socket);

    console.log(`🟢 ${user.username} online (socket ${socket.id})`);
  });

  // ─── DISCONNECT ───────────────────────────────────────────────────────────
  socket.on('disconnect', async () => {
    // small grace window — avoids flapping on mobile reconnects
    setTimeout(async () => {
      if (socket.connected) return;

      const userId = await presenceService.setOffline(socket.id);

      if (userId) {
        io.emit('user:offline', { id: userId });
        console.log(`🔴 user ${userId} offline`);
      }
    }, 1000);
  });
};