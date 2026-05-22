// import { create } from 'zustand';
// import api from '../services/api';
// import { connectSocket, disconnectSocket } from '../services/socket';

// const useAuthStore = create((set) => ({
//   user: JSON.parse(localStorage.getItem('user') || 'null'),
//   token: localStorage.getItem('token') || null,

//   // Login com email + password
//   login: async (email, password) => {
//     const { data } = await api.post('/auth/login', { email, password });
//     const { user, token } = data;
//     localStorage.setItem('token', token);
//     localStorage.setItem('user', JSON.stringify(user));
//     set({ user, token });
//     connectSocket(token);
//     return user;
//   },

//   // Registo com email, username (opcional) e password
//   register: async (email, username, password) => {
//     const payload = { email, password };
//     if (username?.trim()) {
//       payload.username = username.trim();
//     }
//     const { data } = await api.post('/auth/register', payload);
//     const { user, token } = data;
//     localStorage.setItem('token', token);
//     localStorage.setItem('user', JSON.stringify(user));
//     set({ user, token });
//     connectSocket(token);
//     return user;
//   },

//   logout: () => {
//     localStorage.removeItem('token');
//     localStorage.removeItem('user');
//     set({ user: null, token: null });
//     disconnectSocket();
//   },
// }));

// export default useAuthStore;