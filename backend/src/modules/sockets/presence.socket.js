const presenceService = require('../presence/presence.service');
const presenceRepo    = require('../presence/presence.repository');
const deliveryEngine  = require('../delivery/delivery.engine');
const groupsService   = require('../groups/groups.service');
const usersRepo       = require('../users/users.repository');
const messagesRepo    = require('../messages/messages.repository');
const { verify }      = require('../../utils/jwt');
const EVENTS          = require('./events');

module.exports = function (io, socket) {

  // ─── auth ─────────────────────────────────────────────────────────────────
  let user;
  try {
    const token = socket.handshake.auth.token;
    if (token) user = verify(token);
  } catch {
    socket.disconnect(true);
    return;
  }
  if (!user) return;
  socket.user = user;

  // ─── JOIN ─────────────────────────────────────────────────────────────────
  socket.on(EVENTS.JOIN, async () => {
    if (socket.joined) return;
    socket.joined = true;

    await presenceService.setOnline(user.id, socket.id);

    // broadcast to everyone else — always include username so clients don't
    // have to look it up and never show "undefined entrou"
    socket.broadcast.emit(EVENTS.USER_ONLINE, {
      id:       user.id,
      username: user.username,
    });

    // full user list for the joining socket
    const allUsers    = await usersRepo.findAll();
    const onlineUsers = await presenceService.getAllOnlineUsers();
    const onlineSet   = new Set(onlineUsers.map((u) => Number(u.id)));

    socket.emit('initial_users',
      allUsers.map((u) => ({
        id:       u.id,
        username: u.username,
        online:   onlineSet.has(Number(u.id)),
      }))
    );

    // groups for this user
    const userGroups = await groupsService.getGroupsForUser(user.id);
    socket.emit(EVENTS.USER_GROUPS, userGroups);

    // join all group rooms + send history with unread info
    for (const group of userGroups) {
      socket.join(`group:${group.id}`);

      const messages    = await messagesRepo.getGroupMessages(group.id);
      const lastSeen    = await presenceRepo.getGroupLastSeen(user.id, group.id);
      const unreadCount = lastSeen
        ? messages.filter((m) => new Date(m.created_at) > new Date(lastSeen)).length
        : 0;

      socket.emit(EVENTS.GROUP_HISTORY, {
        groupId:     group.id,
        messages:    messages.map((m) => ({ ...m, sender_name: m.sender_name || 'Desconhecido' })),
        unreadCount,
        unreadSince: lastSeen || null,
      });
    }

    await deliveryEngine.flushOfflineMessages(user.id, socket);

    console.log(`🟢 ${user.username} online (socket ${socket.id})`);
  });

  // ─── DISCONNECT ───────────────────────────────────────────────────────────
  socket.on('disconnect', async () => {
    setTimeout(async () => {
      if (socket.connected) return;

      const userId = await presenceService.setOffline(socket.id);
      if (!userId) return;

      // FIX: always resolve the username — socket.user may still be in scope,
      // but if not we fall back to a DB lookup so clients never see "undefined saiu"
      let username = socket.user?.username;
      if (!username) {
        try {
          const u = await usersRepo.findById(userId);
          username = u?.username;
        } catch { /* ignore */ }
      }
      username = username || `utilizador ${userId}`;

      io.emit(EVENTS.USER_OFFLINE, { id: userId, username });
      console.log(`🔴 ${username} offline`);
    }, 1000);
  });
};