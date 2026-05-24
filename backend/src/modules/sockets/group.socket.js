const messageService  = require('../messages/messages.service');
const messagesRepo    = require('../messages/messages.repository');
const presenceRepo    = require('../presence/presence.repository');
const presenceService = require('../presence/presence.service');
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

      // creator joins the room and gets confirmation
      socket.join(`group:${group.id}`);
      socket.emit('group:created', group);

      // notify members who are currently online
      for (const uid of memberIds) {
        const sid = await presenceService.getSocketId(uid);
        if (sid) {
          io.to(sid).emit('user:groups:new', group);
          io.to(sid).emit('group:created:notify', {
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

  // ─── DELETE GROUP ─────────────────────────────────────────────────────────
  socket.on('group:delete', async ({ groupId }) => {
    try {
      // service handles ownership + global-group guards
      const { group, memberIds } = await groupsService.deleteGroup(
        groupId,
        socket.user.id
      );

      // acknowledge to the requester
      socket.emit('group:deleted:ack', { groupId });

      // notify all online members so their UIs remove the group immediately
      for (const uid of memberIds) {
        const sid = await presenceService.getSocketId(uid);
        if (sid) {
          io.to(sid).emit('group:deleted', { groupId, groupName: group.name });
        }
      }

      // make all sockets leave the room (safety)
      io.socketsLeave(`group:${groupId}`);
    } catch (e) {
      console.error('[group:delete]', e.message);
      socket.emit('group:delete:error', e.message || 'Erro ao apagar grupo.');
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

    const messages    = await messagesRepo.getGroupMessages(groupId);
    const lastSeen    = await presenceRepo.getGroupLastSeen(socket.user.id, groupId);
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