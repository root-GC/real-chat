require('dotenv').config();
const socketAuth = require('./src/middleware/socketAuth');


const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const env = require('./src/config/env');
const socketLoader = require('./src/modules/sockets/socket.index');

const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: '*' },
});
io.use(socketAuth);
// Carrega todos os handlers do socket
socketLoader(io);

server.listen(env.PORT, () => {
  console.log(`🚀 Server running on port ${env.PORT}`);
});