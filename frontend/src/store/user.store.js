// import { create } from 'zustand';

// const useUserStore = create((set, get) => ({
//   users: {},

//   setUsers: (usersArray) => {
//     const map = {};
//     usersArray.forEach(u => {
//       map[u.id] = { id: u.id, username: u.username, online: u.online ?? false };
//     });
//     set({ users: map });
//   },

//   addOrUpdateUser: (userObj) => {
//     set(state => ({
//       users: {
//         ...state.users,
//         [userObj.id]: { ...state.users[userObj.id], ...userObj },
//       },
//     }));
//   },

//   markOffline: (userId) => {
//     set(state => {
//       if (!state.users[userId]) return state;
//       return {
//         users: {
//           ...state.users,
//           [userId]: { ...state.users[userId], online: false },
//         },
//       };
//     });
//   },

//   getUsersArray: () => {
//     return Object.values(get().users);
//   },

//   getUser: (username) => {
//     return Object.values(get().users).find(u => u.username === username);
//   },
// }));

// export default useUserStore;