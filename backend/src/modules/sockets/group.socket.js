const messageService  = require('../messages/messages.service');
const messagesRepo    = require('../messages/messages.repository');
const presenceRepo    = require('../presence/presence.repository');
const groupsService   = require('../groups/groups.service');
const EVENTS          = require('./events');

module.exports = function (io, socket) {

  // ─── SEND GROUP MESSAGE ──────────────────────────────────────────────────
  socket.on(EVENTS.GROUP_SEND, async ({ groupId, content, clientId }) => {
    const fromId = socket.user.id;

    const { msg } = await messageService.sendGroup({ fromId, groupId, content });

    const payload = {
      id:          msg.id,
      content:     msg.content,
      sender_id:   fromId,
      sender_name: socket.user.username,
      group_id:    groupId,
      created_at:  msg.created_at,
      clientId,
    };

    // broadcast only inside the room (not io.emit)
    io.to(`group:${groupId}`).emit(EVENTS.GROUP_MESSAGE, payload);

    // mark sender as having seen up to now
    await presenceRepo.setGroupLastSeen(fromId, groupId);
  });

  // ─── JOIN GROUP MID-SESSION ──────────────────────────────────────────────
  // Called by the frontend after creating a new group or being added to one.
  socket.on(EVENTS.JOIN_GROUP, async ({ groupId }) => {
    // verify membership before joining room
    const ok = await groupsService.isMember(groupId, socket.user.id);
    if (!ok) return;

    socket.join(`group:${groupId}`);

    // send full history + unread info (same logic as presence.socket JOIN)
    const messages = await messagesRepo.getGroupMessages(groupId);
    const lastSeen = await presenceRepo.getGroupLastSeen(socket.user.id, groupId);

    const unreadCount = lastSeen
      ? messages.filter((m) => new Date(m.created_at) > new Date(lastSeen)).length
      : 0;

    socket.emit(EVENTS.GROUP_HISTORY, {
      groupId,
      messages:    messages.map((m) => ({ ...m, sender_name: m.sender_name || 'Desconhecido' })),
      unreadCount,
      unreadSince: lastSeen || null,
    });
  });

  // ─── MARK GROUP AS READ ──────────────────────────────────────────────────
  // Frontend emits this whenever the user opens or switches to a group.
  socket.on(EVENTS.GROUP_READ, async ({ groupId }) => {
    await presenceRepo.setGroupLastSeen(socket.user.id, groupId);
  });
};