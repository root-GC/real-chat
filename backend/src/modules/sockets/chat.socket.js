const messageService  = require('../messages/messages.service');
const usersRepo       = require('../users/users.repository');
const presenceService = require('../presence/presence.service');
const EVENTS          = require('./events');

module.exports = function (io, socket) {

  // ─── PRIVATE MESSAGE ──────────────────────────────────────────────────────
  socket.on(EVENTS.PRIVATE_SEND, async (data) => {
    const { toId, content, clientId } = data;
    const fromId = socket.user.id;

    const result = await messageService.sendPrivate({ fromId, toId, content });

    const receiver = await usersRepo.findById(toId);

    const payload = {
      id:            result.msg.id,
      content:       result.msg.content,
      sender_id:     fromId,
      receiver_id:   toId,
      sender_name:   socket.user.username,
      receiver_name: receiver?.username || `user_${toId}`,
      created_at:    result.msg.created_at,
      clientId,
    };

    // echo back to sender (replaces optimistic message via clientId dedup in context)
    socket.emit(EVENTS.PRIVATE_MESSAGE, payload);

    // deliver to receiver if online
    const receiverSocketId = await presenceService.getSocketId(toId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit(EVENTS.PRIVATE_MESSAGE, payload);
    }
  });

  // ─── PRIVATE HISTORY ──────────────────────────────────────────────────────
  socket.on('privateHistory', async ({ myId, otherId }) => {
    try {
      const messages = await messageService.getConversation(myId, otherId);

      socket.emit('privateHistory', {
        with: otherId,
        messages: messages.map((m) => ({
          ...m,
          sender_name: m.sender_name || 'user',
        })),
      });
    } catch (err) {
      console.error('[privateHistory]', err);
      socket.emit('privateHistory', { with: otherId, messages: [] });
    }
  });

  // ─── EDIT MESSAGE ─────────────────────────────────────────────────────────
  socket.on('message:edit', async ({ messageId, content }) => {
    try {
      const updated = await messageService.editMessage(messageId, content);
      if (!updated) return;

      const payload = { ...updated, edited: true };

      if (updated.receiver_id) {
        // private message: notify both participants
        const senderSocket   = await presenceService.getSocketId(updated.sender_id);
        const receiverSocket = await presenceService.getSocketId(updated.receiver_id);
        if (senderSocket)   io.to(senderSocket).emit('message:edited', payload);
        if (receiverSocket) io.to(receiverSocket).emit('message:edited', payload);
      } else {
        // group message: broadcast to room
        io.to(`group:${updated.group_id}`).emit('message:edited', payload);
      }
    } catch (e) {
      console.error('[message:edit]', e);
    }
  });

  // ─── DELETE MESSAGE ───────────────────────────────────────────────────────
  socket.on('message:delete', async ({ messageId }) => {
    try {
      const deleted = await messageService.deleteMessage(messageId);
      if (!deleted) return;

      if (deleted.receiver_id) {
        const senderSocket   = await presenceService.getSocketId(deleted.sender_id);
        const receiverSocket = await presenceService.getSocketId(deleted.receiver_id);
        if (senderSocket)   io.to(senderSocket).emit('message:deleted', deleted);
        if (receiverSocket) io.to(receiverSocket).emit('message:deleted', deleted);
      } else {
        io.to(`group:${deleted.group_id}`).emit('message:deleted', deleted);
      }
    } catch (e) {
      console.error('[message:delete]', e);
    }
  });
};