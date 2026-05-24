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

// 🔥 SOCKET.IO
const io = new Server(server, {
  cors: {
    origin: "https://real-chat-ruddy.vercel.app",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  },

  transports: ['websocket'],
  //allowEIO3: true, // 🔥 volta isto
  // pingInterval: 25000,
  // pingTimeout: 60000,
});

// ⚠️ configurações avançadas SÓ depois de criar o io
// io.engine.opts.allowEIO3 = true;

// // CORS engine (opcional)
// io.engine.opts.cors = {
//   origin: true,
// };

//🔐 AUTH MIDDLEWARE
io.use((socket, next) => {
  try {
    socketAuth(socket, next);
  } catch (err) {
    return next(new Error('Auth failed'));
  }
});

// 🔌 LOAD SOCKET EVENTS
socketLoader(io);

// 🚀 START SERVER
server.listen(env.PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${env.PORT}`);
});