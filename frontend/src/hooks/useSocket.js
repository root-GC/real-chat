// import { useEffect } from 'react';
// import socket from '../services/socket';
// import useAuthStore from '../store/auth.store';
// import useChatStore from '../store/chat.store';
// import usePresenceStore from '../store/presence.store';
// import useUserStore from '../store/user.store';

// export default function useSocket() {
//   const { user } = useAuthStore();
//   const {
//     addMessage,
//     addPrivateMessage,
//     setMessages,
//     setPrivateMessages,
//     setTyping,
//   } = useChatStore();
//   const { setOnlineUsers } = usePresenceStore();
//   const { addOrUpdateUser, markOffline } = useUserStore();

//   const showToast = (message, type = 'info') => {
//     window.dispatchEvent(new CustomEvent('toast', { detail: { message, type } }));
//   };

//   useEffect(() => {
//     if (!user) return;

//     const handleConnect = () => {
//       console.log('Socket conectado');
//       socket.emit('join');
//     };

//     const handleGroupMessage = (msg) => {
//       addMessage({
//         ...msg,
//         sender_name: msg.sender_name || msg.user,
//         content: msg.content || msg.text,
//       });
//     };

//     const handlePrivateMessage = (msg) => {
//       const partnerUsername =
//         msg.sender_id === user.id ? msg.receiver_name : msg.sender_name;
//       if (!partnerUsername) return;
//       addPrivateMessage(partnerUsername, msg);
//     };

//     const handleUsersUpdate = (users) => {
//       const others = users.filter(u => u.id !== String(user.id));
//       setOnlineUsers(others);

//       const onlineIds = new Set(others.map(u => u.id));
//       const allUsers = useUserStore.getState().users;

//       others.forEach(u => {
//         const previous = allUsers[u.id];
//         if (!previous || !previous.online) {
//           showToast(`${u.username} está online`, 'info');
//         }
//         addOrUpdateUser({ id: u.id, username: u.username, online: true });
//       });

//       Object.keys(allUsers).forEach(id => {
//         if (!onlineIds.has(id) && allUsers[id].online) {
//           markOffline(id);
//           showToast(`${allUsers[id].username} saiu`, 'info');
//         }
//       });
//     };

//     // ✅ NOVO: receber a lista completa de contactos ao ligar
//     const handleInitialUsers = (users) => {
//       // users: [{ id, username, online }]
//       users.forEach(u => {
//         addOrUpdateUser({ id: u.id, username: u.username, online: u.online });
//       });
//       // atualiza a lista de online (sem o próprio)
//       const onlineOthers = users.filter(u => u.online && u.id !== String(user.id));
//       setOnlineUsers(onlineOthers);
//     };

//     const handleTyping = ({ fromUsername }) => {
//       setTyping(fromUsername, true);
//       setTimeout(() => setTyping(fromUsername, false), 3000);
//     };

//     const handleGroupHistory = (msgs) => {
//       const formatted = msgs.map(m => ({
//         ...m,
//         content: m.text || m.content,
//         sender_name: m.sender || m.sender_name,
//       }));
//       setMessages(formatted);
//     };

//     const handlePrivateHistory = (data) => {
//       const { with: partner, messages: msgs } = data;
//       const formatted = msgs.map(m => ({
//         ...m,
//         content: m.text || m.content,
//         sender_name: m.sender || m.sender_name,
//       }));
//       setPrivateMessages(partner, formatted);
//     };

//     socket.on('connect', handleConnect);
//     socket.on('group:message', handleGroupMessage);
//     socket.on('message', handleGroupMessage);
//     socket.on('private:message', handlePrivateMessage);
//     socket.on('users:update', handleUsersUpdate);
//     socket.on('typing', handleTyping);
//     socket.on('history', handleGroupHistory);
//     socket.on('privateHistory', handlePrivateHistory);
//     socket.on('initial_users', handleInitialUsers);  // ← NOVO

//     if (socket.connected) {
//       handleConnect();
//     } else {
//       socket.connect();
//     }

//     return () => {
//       socket.off('connect', handleConnect);
//       socket.off('group:message', handleGroupMessage);
//       socket.off('message', handleGroupMessage);
//       socket.off('private:message', handlePrivateMessage);
//       socket.off('users:update', handleUsersUpdate);
//       socket.off('typing', handleTyping);
//       socket.off('history', handleGroupHistory);
//       socket.off('privateHistory', handlePrivateHistory);
//       socket.off('initial_users', handleInitialUsers); // ← NOVO
//     };
//   }, [user]);
// }