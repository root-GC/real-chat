// import { io } from 'socket.io-client';

// const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

// const socket = io(SOCKET_URL, {
//   autoConnect: false,
//   auth: { token: '' },
// });

// export function connectSocket(token) {
//   socket.auth.token = token;
//   if (!socket.connected) {
//     socket.connect();
//   }
// }

// export function disconnectSocket() {
//   if (socket.connected) {
//     socket.disconnect();
//   }
// }

// export default socket;

import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL;

const socket = io(SOCKET_URL, {
  autoConnect: false,
  transports: ['websocket'],// 🔥 importante no ngrok
  auth: {}
});

// 🔥 DEBUG DE CONEXÃO
socket.on("connect", () => {
  console.log("CONNECTED");
});

socket.on("connect", () => {
  console.log("CONNECTED", socket.id);
});

socket.on("connect_error", (err) => {
  console.log("CONNECT ERROR", err.message);
});

// conecta com token atualizado
export function connectSocket(token) {
  socket.auth.token = token;

  if (!socket.connected) {
    socket.connect();
  }
}

export function disconnectSocket() {
  if (socket.connected) {
    socket.disconnect();
  }
}

export default socket;