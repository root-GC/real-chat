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
  let tokenPayload;
  try {
    const token = socket.handshake.auth.token;
    if (token) tokenPayload = verify(token);
  } catch {
    socket.disconnect(true);
    return;
  }
  if (!tokenPayload) return;

  // Store token payload temporarily; we'll enrich with DB data on JOIN
  socket.user = tokenPayload;

  // ─── JOIN ─────────────────────────────────────────────────────────────────
  socket.on(EVENTS.JOIN, async () => {
    if (socket.joined) return;
    socket.joined = true;

    // FIX: always load from DB so username is guaranteed to be correct.
    // JWTs often only contain { id, email } — never assume username is in the token.
    let dbUser;
    try {
      dbUser = await usersRepo.findById(tokenPayload.id);
    } catch (e) {
      console.error('[JOIN] could not load user from DB:', e.message);
      socket.disconnect(true);
      return;
    }

    if (!dbUser) {
      socket.disconnect(true);
      return;
    }

    // Overwrite socket.user with the definitive DB record
    // Cast id to Number so comparisons with DB values never fail
    socket.user = {
      id:       Number(dbUser.id),
      username: dbUser.username,
      email:    dbUser.email,
    };

    await presenceService.setOnline(socket.user.id, socket.id);

    // Broadcast to everyone else — username now guaranteed from DB
    socket.broadcast.emit(EVENTS.USER_ONLINE, {
      id:       socket.user.id,
      username: socket.user.username,
    });

    // Full user list for the joining socket
    const allUsers    = await usersRepo.findAll();
    const onlineUsers = await presenceService.getAllOnlineUsers();
    const onlineSet   = new Set(onlineUsers.map((u) => Number(u.id)));

    socket.emit('initial_users',
      allUsers.map((u) => ({
        id:       Number(u.id),
        username: u.username,
        online:   onlineSet.has(Number(u.id)),
      }))
    );

    // Groups for this user
    const userGroups = await groupsService.getGroupsForUser(socket.user.id);
    socket.emit(EVENTS.USER_GROUPS, userGroups);

    // Join all group rooms + send history
    for (const group of userGroups) {
      socket.join(`group:${group.id}`);

      const messages    = await messagesRepo.getGroupMessages(group.id);
      const lastSeen    = await presenceRepo.getGroupLastSeen(socket.user.id, group.id);
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

    await deliveryEngine.flushOfflineMessages(socket.user.id, socket);

    console.log(`🟢 ${socket.user.username} (id=${socket.user.id}) online`);
  });

  // ─── DISCONNECT ───────────────────────────────────────────────────────────
  socket.on('disconnect', async () => {
    setTimeout(async () => {
      if (socket.connected) return;

      const userId = await presenceService.setOffline(socket.id);
      if (!userId) return;

      // socket.user is set on JOIN; if JOIN never fired (e.g. disconnect before join)
      // fall back to a DB lookup so clients never see "undefined saiu"
      const username = socket.user?.username ?? (async () => {
        try { return (await usersRepo.findById(userId))?.username; } catch { return null; }
      })() ?? `utilizador ${userId}`;

      // username might be a Promise if we hit the async fallback — resolve it
      const resolvedName = (username instanceof Promise)
        ? (await username) || `utilizador ${userId}`
        : username;

      io.emit(EVENTS.USER_OFFLINE, { id: Number(userId), username: resolvedName });
      console.log(`🔴 ${resolvedName} offline`);
    }, 1000);
  });
};