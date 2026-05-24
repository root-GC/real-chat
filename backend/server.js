// require('dotenv').config();
// const socketAuth = require('./src/middleware/socketAuth');


// const http = require('http');
// const { Server } = require('socket.io');
// const app = require('./app');
// const env = require('./src/config/env');
// const socketLoader = require('./src/modules/sockets/socket.index');

// const server = http.createServer(app);

// const io = new Server(server, {
//   cors: { origin: '*' },
// });
// io.use(socketAuth);
// // Carrega todos os handlers do socket
// socketLoader(io);

// server.listen(env.PORT, () => {
//   console.log(`🚀 Server running on port ${env.PORT}`);
// });

require('dotenv').config();

const http = require('http');
const { Server } = require('socket.io');

const app = require('./app');
const env = require('./src/config/env');

const socketAuth = require('./src/middleware/socketAuth');
const socketLoader = require('./src/modules/sockets/socket.index');

const server = http.createServer(app);

// 🔥 SOCKET.IO CONFIG CORRIGIDO
const io = new Server(server, {
  cors: {
    origin: [
      // 'http://localhost:5173',
      'https://*.vercel.app',
    ],
    credentials: true,
  },

  transports: ['websocket', 'polling'], // importante para ngrok

  pingInterval: 25000,
  pingTimeout: 60000,
});

// 🔐 AUTH MIDDLEWARE
io.use((socket, next) => {
  try {
    socketAuth(socket, next);
  } catch (err) {
    return next(new Error('Auth failed'));
  }
});

// 🔌 LOAD SOCKET EVENTS
socketLoader(io);

server.listen(env.PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${env.PORT}`);
});