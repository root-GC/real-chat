const presenceService = require('../presence/presence.service');
const presenceRepo    = require('../presence/presence.repository');
const deliveryEngine  = require('../delivery/delivery.engine');
const groupsService   = require('../groups/groups.service');
const usersRepo       = require('../users/users.repository');
const messagesRepo    = require('../messages/messages.repository');
const { verify }      = require('../../utils/jwt');
const EVENTS          = require('./events');

module.exports = function (io, socket) {

  // ─── auth ────────────────────────────────────────────────────────────────
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

    // 1. mark online
    await presenceService.setOnline(user.id, socket.id);

    // 2. notify everyone else (they show a toast in their UI)
    socket.broadcast.emit(EVENTS.USER_ONLINE, {
      id:       user.id,
      username: user.username,
    });

    // 3. full user list → joining socket
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

    // 4. get user's groups (auto-adds them to global group:1 if needed)
    const userGroups = await groupsService.getGroupsForUser(user.id);

    // send group list so frontend sidebar populates immediately
    socket.emit(EVENTS.USER_GROUPS, userGroups);

    // 5. for every group: join socket room + send history with unread info
    for (const group of userGroups) {
      socket.join(`group:${group.id}`);

      const messages  = await messagesRepo.getGroupMessages(group.id);
      const lastSeen  = await presenceRepo.getGroupLastSeen(user.id, group.id);

      // count messages the user missed since they last saw this group
      const unreadCount = lastSeen
        ? messages.filter((m) => new Date(m.created_at) > new Date(lastSeen)).length
        : 0;

      socket.emit(EVENTS.GROUP_HISTORY, {
        groupId:      group.id,
        messages:     messages.map((m) => ({ ...m, sender_name: m.sender_name || 'Desconhecido' })),
        unreadCount,
        unreadSince:  lastSeen || null,
      });
    }

    // 6. flush queued offline private messages
    await deliveryEngine.flushOfflineMessages(user.id, socket);

    console.log(`🟢 ${user.username} online (socket ${socket.id})`);
  });

  // ─── DISCONNECT ───────────────────────────────────────────────────────────
  socket.on('disconnect', async () => {
    // 1-second grace avoids flapping on mobile page transitions
    setTimeout(async () => {
      if (socket.connected) return;

      const userId = await presenceService.setOffline(socket.id);

      if (userId) {
        // find username for toast message
        let username = `user_${userId}`;
        try {
          const u = await usersRepo.findById(userId);
          if (u) username = u.username;
        } catch { /* ignore */ }

        io.emit(EVENTS.USER_OFFLINE, { id: userId, username });
        console.log(`🔴 ${username} offline`);
      }
    }, 1000);
  });
};