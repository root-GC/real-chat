
// import { create } from 'zustand';

// const usePresenceStore = create((set) => ({
//   // Lista de utilizadores online: [{ userId, username }]
//   onlineUsers: [],

//   setOnlineUsers: (users) => {
//     // O backend envia array de { userId, socketId } ou array de { id, username }
//     // Vamos normalizar para { id, username, online: true }
//     const online = users.map((u) => ({
//       id: u.userId || u.id,
//       username: u.username,
//     }));
//     set({ onlineUsers: online });
//   },
// }));

// export default usePresenceStore;