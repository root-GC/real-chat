// import axios from 'axios';

// const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// const api = axios.create({
//   baseURL: API_BASE,
// });

// // Interceptador para incluir token em todas as requisições
// api.interceptors.request.use((config) => {
//   const token = localStorage.getItem('token');
//   if (token) {
//     config.headers.Authorization = `Bearer ${token}`;
//   }
//   return config;
// });

// export default api;

// import { io } from 'socket.io-client';

// const socket = io('http://localhost:3000', {
//   auth: {
//     token: localStorage.getItem('token'),
//   },
// });

import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: `${API_BASE}/api`,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true'
  }
});


// injeta token automaticamente
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;