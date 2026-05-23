import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';

import socket from '../services/socket';

const ChatContext = createContext();

export function useChatContext() {
  return useContext(ChatContext);
}

export function ChatProvider({ children }) {
  const [users, setUsers]               = useState({});
  const [unread, setUnread]             = useState({});
  const [privateMessages, setPrivateMessages] = useState({});
  const [groupMessages, setGroupMessages]     = useState([]);   // FIX: was never populated
  const [toasts, setToasts]             = useState([]);

  const currentUser = JSON.parse(localStorage.getItem('user') || 'null');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token || !currentUser) return;

    socket.auth = { token };
    socket.connect();

    // ─── connection ───────────────────────────────────────────────
    socket.on('connect', () => {
      socket.emit('join');
    });

    // ─── presence ─────────────────────────────────────────────────
    socket.on('initial_users', (list) => {
      setUsers((prev) => {
        const updated = { ...prev };
        list.forEach((u) => {
          updated[u.id] = { id: u.id, username: u.username, online: u.online };
        });
        return updated;
      });
    });

    socket.on('user:online', (u) => {
      setUsers((prev) => ({
        ...prev,
        [u.id]: { ...prev[u.id], ...u, online: true },
      }));
    });

    socket.on('user:offline', ({ id }) => {
      setUsers((prev) => ({
        ...prev,
        [id]: { ...prev[id], online: false },
      }));
    });

    // ─── private messages ─────────────────────────────────────────
    socket.on('private:message', (msg) => {
      const partnerId =
        msg.sender_id === currentUser.id ? msg.receiver_id : msg.sender_id;

      setPrivateMessages((prev) => {
        const existing = prev[partnerId] || [];
        // replace optimistic by clientId, then guard against duplicate id
        const filtered = existing.filter((m) => m.clientId !== msg.clientId);
        if (filtered.some((m) => m.id === msg.id)) return prev;
        return { ...prev, [partnerId]: [...filtered, msg] };
      });

      const viewing =
        window.location.pathname === `/chat/private/${msg.sender_id}`;

      if (msg.sender_id !== currentUser.id && !viewing) {
        setUnread((prev) => ({
          ...prev,
          [partnerId]: (prev[partnerId] || 0) + 1,
        }));
      }
    });

    socket.on('privateHistory', (data) => {
      setPrivateMessages((prev) => ({ ...prev, [data.with]: data.messages }));
      setUnread((prev) => ({ ...prev, [data.with]: 0 }));
    });

    // ─── group messages ───────────────────────────────────────────
    // FIX: was never wired up — context never received group:message or group:history

    // initial group history sent by presence.socket.js on JOIN
    socket.on('group:history', (msgs) => {
      setGroupMessages(msgs);
    });

    // live group messages
    socket.on('group:message', (msg) => {
      setGroupMessages((prev) => {
        // replace optimistic by clientId
        const filtered = prev.filter((m) => m.clientId !== msg.clientId);
        // guard duplicate
        if (filtered.some((m) => m.id === msg.id)) return prev;
        return [...filtered, msg];
      });
    });

    // ─── edit / delete ────────────────────────────────────────────
    // FIX: these events were emitted by the backend but never handled in context

    socket.on('message:edited', (msg) => {
      const patch = (arr) =>
        arr.map((m) =>
          m.id === msg.id ? { ...m, content: msg.content, edited: true } : m
        );

      if (msg.group_id) {
        setGroupMessages((prev) => patch(prev));
      } else {
        const pid =
          msg.sender_id === currentUser.id ? msg.receiver_id : msg.sender_id;
        setPrivateMessages((prev) => ({
          ...prev,
          [pid]: patch(prev[pid] || []),
        }));
      }
    });

    socket.on('message:deleted', (msg) => {
      const remove = (arr) => arr.filter((m) => m.id !== msg.id);

      if (msg.group_id) {
        setGroupMessages((prev) => remove(prev));
      } else {
        const pid =
          msg.sender_id === currentUser.id ? msg.receiver_id : msg.sender_id;
        setPrivateMessages((prev) => ({
          ...prev,
          [pid]: remove(prev[pid] || []),
        }));
      }
    });

    // ─── cleanup ──────────────────────────────────────────────────
    return () => {
      socket.off('connect');
      socket.off('initial_users');
      socket.off('user:online');
      socket.off('user:offline');
      socket.off('private:message');
      socket.off('privateHistory');
      socket.off('group:history');
      socket.off('group:message');
      socket.off('message:edited');
      socket.off('message:deleted');
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── helpers ──────────────────────────────────────────────────────
  const resetUnread = useCallback((id) => {
    setUnread((prev) => ({ ...prev, [id]: 0 }));
  }, []);

  // FIX: addOptimisticMessage now handles both 'private' and 'group' types
  const addOptimisticMessage = useCallback((type, payload) => {
    if (type === 'private') {
      const partnerId = payload.receiver_id;
      setPrivateMessages((prev) => ({
        ...prev,
        [partnerId]: [
          ...(prev[partnerId] || []),
          { ...payload, _optimistic: true },
        ],
      }));
    } else if (type === 'group') {
      setGroupMessages((prev) => [...prev, { ...payload, _optimistic: true }]);
    }
  }, []);

  const addToast = useCallback((message) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  return (
    <ChatContext.Provider
      value={{
        users,
        unread,
        privateMessages,
        groupMessages,
        toasts,
        resetUnread,
        addToast,
        addOptimisticMessage,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}