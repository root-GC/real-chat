// import { useCallback } from 'react';
// import api from '../services/api';
// import socket from '../services/socket';
// import useAuthStore from '../store/auth.store';
// import useChatStore from '../store/chat.store';

// export default function useChat() {
//   const { user } = useAuthStore();
//   const {
//     messages,
//     setMessages,
//     addMessage,
//     addPrivateMessage,
//     privateChats,
//     unreadByUser,
//     resetUnread,
//     setTyping,
//   } = useChatStore();

//   // Enviar mensagem de grupo
//   const sendGroupMessage = useCallback(
//     (text) => {
//       if (!text.trim()) return;
//       socket.emit('group:send', { text }); // vamos criar este evento no backend? No backend atual temos "message". Preciso padronizar. Vou usar 'group:send' ou manter 'message'. Vou manter 'message' por enquanto, mas vamos criar handler no backend.
//       // Mas no novo backend, não temos group ainda. Vou manter compatível.
//     },
//     []
//   );

//   // Enviar mensagem privada
//   const sendPrivateMessage = useCallback(
//     (toId, text) => {
//       if (!text.trim()) return;
//       socket.emit('private:send', { toId, content: text });
//     },
//     []
//   );

//   // Carregar histórico do grupo
//   const loadGroupHistory = useCallback(async () => {
//     // No backend atual, é via socket. Vamos mantê-lo.
//     socket.emit('history');
//     // O resultado será tratado no useSocket
//   }, []);

//   // Carregar histórico privado
//   const loadPrivateHistory = useCallback(async (partnerUsername) => {
//     // Precisamos do ID do parceiro. Vamos buscar na lista de online ou fazer uma chamada REST.
//     // Suponhamos que temos o ID armazenado em algum lado. Vou criar um endpoint REST.
//     // Por enquanto, vamos usar a API REST: GET /api/messages/conversation/:userId
//     // Mas precisamos do userId. O frontend pode guardar um mapa de username->id.
//     // Vou criar um store de users (simples). Vou adicionar.
//   }, []);

//   return {
//     messages,
//     privateChats,
//     unreadByUser,
//     sendGroupMessage,
//     sendPrivateMessage,
//     loadGroupHistory,
//     loadPrivateHistory,
//     resetUnread,
//   };
// }