const messageService = require('../messages/messages.service');
const usersRepo = require('../users/users.repository');
const presenceService = require('../presence/presence.service');
const EVENTS = require('./events');

module.exports = function (io, socket) {
  // Enviar mensagem privada
  socket.on(EVENTS.PRIVATE_SEND, async (data) => {
    const { toId, content } = data;
    const fromId = socket.user.id;
    const fromUsername = socket.user.username || 'Utilizador';

    const result = await messageService.sendPrivate({ fromId, toId, content });

    let receiverName = 'Desconhecido';
    try {
      const receiver = await usersRepo.findById(toId);
      receiverName = receiver?.username || `user_${toId}`;
    } catch (e) {}

    // Confirmação para o remetente
    socket.emit(EVENTS.PRIVATE_MESSAGE, {
      ...result.msg,
      sender_name: fromUsername,
      receiver_name: receiverName,
      self: true,
    });

    // Entrega ao destinatário se estiver online
    if (result.socketId) {
      io.to(result.socketId).emit(EVENTS.PRIVATE_MESSAGE, {
        ...result.msg,
        sender_name: fromUsername,
        receiver_name: receiverName,
      });
    }
  });

  // Histórico privado
  socket.on('privateHistory', async ({ myId, otherUsername }) => {
    try {
      const otherUser = await usersRepo.findByUsername(otherUsername);
      if (!otherUser) {
        socket.emit('privateHistory', { with: otherUsername, messages: [] });
        return;
      }
      const messages = await messageService.getConversation(myId, otherUser.id);
      socket.emit('privateHistory', { with: otherUsername, messages });
    } catch (err) {
      socket.emit('privateHistory', { with: otherUsername, messages: [] });
    }
  });

  // Editar mensagem
  socket.on('message:edit', async ({ messageId, content }) => {
    try {
      const updated = await messageService.editMessage(messageId, content);
      if (!updated) return;

      if (updated.receiver_id) {
        const receiverSocket = await presenceService.getSocketId(updated.receiver_id);
        const senderSocket = await presenceService.getSocketId(updated.sender_id);
        if (receiverSocket) io.to(receiverSocket).emit('message:edited', updated);
        if (senderSocket) io.to(senderSocket).emit('message:edited', updated);
      } else {
        io.to(`group:${updated.group_id}`).emit('message:edited', updated);
      }
    } catch (e) {
      console.error('Erro ao editar:', e);
    }
  });

  // Apagar mensagem
  socket.on('message:delete', async ({ messageId }) => {
    try {
      const deleted = await messageService.deleteMessage(messageId);
      if (!deleted) return;

      if (deleted.receiver_id) {
        const receiverSocket = await presenceService.getSocketId(deleted.receiver_id);
        const senderSocket = await presenceService.getSocketId(deleted.sender_id);
        if (receiverSocket) io.to(receiverSocket).emit('message:deleted', deleted);
        if (senderSocket) io.to(senderSocket).emit('message:deleted', deleted);
      } else {
        io.to(`group:${deleted.group_id}`).emit('message:deleted', deleted);
      }
    } catch (e) {
      console.error('Erro ao apagar:', e);
    }
  });
};