const messageService  = require('../messages/messages.service');
const messagesRepo    = require('../messages/messages.repository');
const presenceRepo    = require('../presence/presence.repository');
const groupsService   = require('../groups/groups.service');
const EVENTS          = require('./events');

module.exports = function (io, socket) {

  // ─── CREATE GROUP ─────────────────────────────────────────────────────────
  socket.on('group:create', async ({ name, memberIds = [] }) => {
    try {
      if (!name?.trim()) {
        socket.emit('group:create:error', 'O nome do grupo é obrigatório.');
        return;
      }

      const group = await groupsService.createGroup(
        name.trim(),
        socket.user.id,
        memberIds
      );

      // creator joins the room immediately
      socket.join(`group:${group.id}`);
      socket.emit('group:created', group);

      // notify other members if they're online
      for (const uid of memberIds) {
        const targetSocket = await presenceRepo.getGroupLastSeen(uid, group.id)
          .then(() => null)  // we just need the socket id
          .catch(() => null);

        // simpler: use presence service directly
        const { getSocketId } = require('../presence/presence.service');
        const sid = await getSocketId(uid);
        if (sid) {
          io.to(sid).emit('user:groups:new', group);   // frontend addGroup()
          io.to(sid).emit('group:created:notify', {    // optional toast
            groupName: group.name,
            createdBy: socket.user.username,
          });
        }
      }
    } catch (e) {
      console.error('[group:create]', e);
      socket.emit('group:create:error', 'Erro interno ao criar grupo.');
    }
  });

  // ─── SEND GROUP MESSAGE ───────────────────────────────────────────────────
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

    io.to(`group:${groupId}`).emit(EVENTS.GROUP_MESSAGE, payload);
    await presenceRepo.setGroupLastSeen(fromId, groupId);
  });

  // ─── JOIN GROUP MID-SESSION ───────────────────────────────────────────────
  socket.on(EVENTS.JOIN_GROUP, async ({ groupId }) => {
    const ok = await groupsService.isMember(groupId, socket.user.id);
    if (!ok) return;

    socket.join(`group:${groupId}`);

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

  // ─── MARK GROUP AS READ ───────────────────────────────────────────────────
  socket.on(EVENTS.GROUP_READ, async ({ groupId }) => {
    await presenceRepo.setGroupLastSeen(socket.user.id, groupId);
  });
};