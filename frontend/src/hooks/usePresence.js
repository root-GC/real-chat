// import { useCallback } from 'react';
// import usePresenceStore from '../store/presence.store';

// export default function usePresence() {
//   const { onlineUsers } = usePresenceStore();
//   const isOnline = useCallback(
//     (username) => onlineUsers.some((u) => u.username === username),
//     [onlineUsers]
//   );
//   return { onlineUsers, isOnline };
// }