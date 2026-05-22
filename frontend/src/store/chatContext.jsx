import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import socket from '../services/socket';

const ChatContext = createContext();

export function useChatContext() {
  return useContext(ChatContext);
}

export function ChatProvider({ children }) {
  const [users, setUsers] = useState(() => {
    try { return JSON.parse(localStorage.getItem('chat_users') || '{}'); } catch { return {}; }
  });
  const [unread, setUnread] = useState(() => {
    try { return JSON.parse(localStorage.getItem('chat_unread') || '{}'); } catch { return {}; }
  });
  const [privateMessages, setPrivateMessages] = useState(() => {
    try { return JSON.parse(localStorage.getItem('chat_privateMessages') || '{}'); } catch { return {}; }
  });
  const [groupMessages, setGroupMessages] = useState(() => {
    try { return JSON.parse(localStorage.getItem('chat_groupMessages') || '[]'); } catch { return []; }
  });
  const [toasts, setToasts] = useState([]);

  const tokenRef = useRef(localStorage.getItem('token'));
  const userRef = useRef(JSON.parse(localStorage.getItem('user') || 'null'));

  // Persist to localStorage whenever state changes
  useEffect(() => { localStorage.setItem('chat_users', JSON.stringify(users)); }, [users]);
  useEffect(() => { localStorage.setItem('chat_unread', JSON.stringify(unread)); }, [unread]);
  useEffect(() => { localStorage.setItem('chat_privateMessages', JSON.stringify(privateMessages)); }, [privateMessages]);
  useEffect(() => { localStorage.setItem('chat_groupMessages', JSON.stringify(groupMessages)); }, [groupMessages]);

  // ---- Socket listeners (once) ----
  useEffect(() => {
    const token = tokenRef.current;
    const user = userRef.current;
    if (!token || !user) return;

    socket.auth.token = token;
    if (!socket.connected) socket.connect();

    const onConnect = () => socket.emit('join');

    const onInitialUsers = (list) => {
      const map = {};
      list.forEach(u => { map[u.id] = { id: u.id, username: u.username, online: u.online }; });
      setUsers(map);
    };

    const onUserOnline = (u) => {
      setUsers(prev => ({
        ...prev,
        [u.id]: { ...prev[u.id], id: u.id, username: u.username, online: true }
      }));
    };

    const onUserOffline = ({ id }) => {
      setUsers(prev => {
        if (!prev[id]) return prev;
        return { ...prev, [id]: { ...prev[id], online: false } };
      });
    };

    const onPrivateMessage = (msg) => {
      const currentUser = userRef.current;
      const partner = msg.sender_id === currentUser.id
        ? (msg.receiver_name || '').trim()
        : (msg.sender_name || '').trim();
      if (!partner) return;

      setPrivateMessages(prev => {
        const existing = (prev[partner] || []).some(m => m.id === msg.id);
        if (existing) return prev;
        return { ...prev, [partner]: [...(prev[partner] || []), msg] };
      });

      // Only increment unread if the message is from someone else
      if (msg.sender_id !== currentUser.id) {
        setUnread(prev => ({
          ...prev,
          [partner]: (prev[partner] || 0) + 1
        }));
      }

      window.dispatchEvent(new CustomEvent('toast', {
        detail: { message: `Nova mensagem de ${partner}`, type: 'info' }
      }));
    };

    const onGroupMessage = (msg) => {
      setGroupMessages(prev => {
        if (prev.some(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    };

    const onHistory = (msgs) => {
      setGroupMessages(prev => {
        const existingIds = new Set(prev.map(m => m.id));
        const newMsgs = msgs.map(m => ({
          ...m,
          content: m.text || m.content,
          sender_name: m.sender || m.sender_name,
        })).filter(m => !existingIds.has(m.id));
        return [...prev, ...newMsgs].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      });
    };

    const onPrivateHistory = (data) => {
      setPrivateMessages(prev => {
        const existingIds = new Set((prev[data.with] || []).map(m => m.id));
        const newMsgs = data.messages.map(m => ({
          ...m,
          content: m.text || m.content,
          sender_name: m.sender || m.sender_name,
        })).filter(m => !existingIds.has(m.id));
        return {
          ...prev,
          [data.with]: [...(prev[data.with] || []), ...newMsgs]
            .sort((a, b) => new Date(a.created_at) - new Date(b.created_at)),
        };
      });
      // Reset unread ONLY when the server confirms history has been seen
      setUnread(prev => ({ ...prev, [data.with]: 0 }));
    };

    const onMessageEdited = (updated) => {
      if (updated.group_id) {
        setGroupMessages(prev =>
          prev.map(m => (m.id === updated.id ? { ...m, content: updated.content, edited: true } : m))
        );
      } else {
        const currentUser = userRef.current;
        const partner = updated.sender_id === currentUser.id
          ? updated.receiver_name
          : updated.sender_name;
        if (partner) {
          setPrivateMessages(prev => ({
            ...prev,
            [partner]: prev[partner]?.map(m =>
              m.id === updated.id ? { ...m, content: updated.content, edited: true } : m
            ),
          }));
        }
      }
    };

    const onMessageDeleted = (deleted) => {
      if (deleted.group_id) {
        setGroupMessages(prev => prev.filter(m => m.id !== deleted.id));
      } else {
        const currentUser = userRef.current;
        const partner = deleted.sender_id === currentUser.id
          ? deleted.receiver_name
          : deleted.sender_name;
        if (partner) {
          setPrivateMessages(prev => ({
            ...prev,
            [partner]: prev[partner]?.filter(m => m.id !== deleted.id),
          }));
        }
      }
    };

    const onToast = (e) => {
      const { message, type } = e.detail;
      const id = Date.now() + Math.random();
      setToasts(prev => [...prev, { id, message, type }]);
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
    };

    socket.on('connect', onConnect);
    socket.on('initial_users', onInitialUsers);
    socket.on('user:online', onUserOnline);
    socket.on('user:offline', onUserOffline);
    socket.on('private:message', onPrivateMessage);
    socket.on('group:message', onGroupMessage);
    socket.on('history', onHistory);
    socket.on('privateHistory', onPrivateHistory);
    socket.on('message:edited', onMessageEdited);
    socket.on('message:deleted', onMessageDeleted);
    window.addEventListener('toast', onToast);

    if (socket.connected) socket.emit('join');

    return () => {
      socket.off('connect', onConnect);
      socket.off('initial_users', onInitialUsers);
      socket.off('user:online', onUserOnline);
      socket.off('user:offline', onUserOffline);
      socket.off('private:message', onPrivateMessage);
      socket.off('group:message', onGroupMessage);
      socket.off('history', onHistory);
      socket.off('privateHistory', onPrivateHistory);
      socket.off('message:edited', onMessageEdited);
      socket.off('message:deleted', onMessageDeleted);
      window.removeEventListener('toast', onToast);
    };
  }, []);

  const resetUnread = useCallback((username) => {
    setUnread(prev => ({ ...prev, [username]: 0 }));
  }, []);

  const incrementUnread = useCallback((username) => {
    setUnread(prev => ({ ...prev, [username]: (prev[username] || 0) + 1 }));
  }, []);

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  const value = {
    users,
    unread,
    privateMessages,
    groupMessages,
    toasts,
    resetUnread,
    incrementUnread,
    addToast,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}