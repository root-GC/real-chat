// import { create } from 'zustand';

// const useChatStore = create((set, get) => ({
//   messages: [],
//   privateChats: {},
//   unreadByUser: {},
//   typingUsers: {},

//   setMessages: (msgs) => set({ messages: msgs }),

//   addMessage: (msg) => set((state) => ({ messages: [...state.messages, msg] })),

//   setPrivateMessages: (partner, msgs) =>
//     set((state) => ({
//       privateChats: { ...state.privateChats, [partner]: msgs },
//     })),

//   addPrivateMessage: (partner, msg) =>
//     set((state) => {
//       const chat = state.privateChats[partner] || [];
//       return {
//         privateChats: { ...state.privateChats, [partner]: [...chat, msg] },
//       };
//     }),

//   incrementUnread: (partner) =>
//     set((state) => ({
//       unreadByUser: {
//         ...state.unreadByUser,
//         [partner]: (state.unreadByUser[partner] || 0) + 1,
//       },
//     })),

//   resetUnread: (partner) =>
//     set((state) => ({
//       unreadByUser: { ...state.unreadByUser, [partner]: 0 },
//     })),

//   setTyping: (username, isTyping) =>
//     set((state) => ({
//       typingUsers: { ...state.typingUsers, [username]: isTyping },
//     })),
// }));

// export default useChatStore;