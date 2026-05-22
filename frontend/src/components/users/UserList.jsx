// import useUserStore from '../../store/user.store';
// import useChatStore from '../../store/chat.store';

// export default function UserList({ onSelectUser }) {
//   const { getUsersArray } = useUserStore();
//   const { unreadByUser, typingUsers } = useChatStore();

//   const users = getUsersArray();

//   return (
//     <div className="user-list">
//       {users.map((u) => (
//         <div
//           key={u.id}
//           className={`user-item ${u.online ? 'online' : 'offline'}`}
//           onClick={() => onSelectUser(u.username)}
//         >
//           <span>{u.username}</span>
//           {unreadByUser[u.username] > 0 && (
//             <span className="unread-badge">{unreadByUser[u.username]}</span>
//           )}
//           {typingUsers[u.username] && <span className="typing">a escrever...</span>}
//           <span
//             className={u.online ? 'online-indicator' : 'offline-indicator'}
//           ></span>
//         </div>
//       ))}
//     </div>
//   );
// }