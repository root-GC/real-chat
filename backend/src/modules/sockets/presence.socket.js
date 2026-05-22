const presenceService = require('../presence/presence.service');
const deliveryEngine = require('../delivery/delivery.engine');
const usersRepo = require('../users/users.repository');
const messagesRepo = require('../messages/messages.repository'); // ← NOVO
const { verify } = require('../../utils/jwt');
const EVENTS = require('./events');

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

  socket.on(EVENTS.JOIN, async () => {
    if (socket.joined) return;
    socket.joined = true;

    await presenceService.setOnline(user.id, socket.id);
    socket.broadcast.emit('user:online', { id: user.id, username: user.username || user.email });

    // Lista inicial de contactos
    try {
      const allUsers = await usersRepo.findAll();
      const onlineUsers = await presenceService.getAllOnlineUsers();
      const onlineIds = new Set(onlineUsers.map(u => u.id));
      const usersWithStatus = allUsers.map(u => ({
        id: u.id,
        username: u.username,
        online: onlineIds.has(String(u.id)),
      }));
      socket.emit('initial_users', usersWithStatus);
    } catch (err) {
      console.error('Erro ao enviar initial_users:', err);
    }

    // Enviar histórico recente do grupo (evita o refresh)
    try {
      const groupMessages = await messagesRepo.getGroupMessages(1); // grupo geral id=1
      socket.emit('history', groupMessages);
    } catch (err) {
      console.error('Erro ao enviar histórico do grupo:', err);
    }

    // Mensagens offline privadas
    await deliveryEngine.flushOfflineMessages(user.id, socket);
    console.log(`✅ ${user.username || user.email} online`);
  });

  socket.on('disconnect', async () => {
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