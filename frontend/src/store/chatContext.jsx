import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from 'react';
import socket from '../services/socket';

const ChatContext = createContext();

export function useChatContext() {
  return useContext(ChatContext);
}

export function ChatProvider({ children }) {
  const [users,           setUsers]           = useState({});
  const [unread,          setUnread]          = useState({});
  const [privateMessages, setPrivateMessages] = useState({});
  const [groupMessages,   setGroupMessages]   = useState({});
  const [groupUnread,     setGroupUnread]     = useState({});
  const [groups,          setGroups]          = useState([]);
  const [toasts,          setToasts]          = useState([]);
  const [typing,          setTyping]          = useState({});

  const typingTimers   = useRef({});
  const currentUser    = JSON.parse(localStorage.getItem('user') || 'null');
  const currentUserRef = useRef(currentUser);

  // ─── toasts ────────────────────────────────────────────────────────────────
  const addToast = useCallback((message, opts = {}) => {
    const id  = Date.now() + Math.random();
    const ttl = opts.ttl ?? 3500;
    setToasts((prev) => [...prev, { id, message, onClick: opts.onClick }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), ttl);
  }, []);

  // ─── typing helpers ────────────────────────────────────────────────────────
  const setTypingActive = useCallback((key, userId, username) => {
    const timerKey = `${key}:${userId}`;
    clearTimeout(typingTimers.current[timerKey]);

    setTyping((prev) => ({
      ...prev,
      [key]: { ...(prev[key] || {}), [userId]: username },
    }));

    typingTimers.current[timerKey] = setTimeout(() => {
      setTyping((prev) => {
        const group = { ...(prev[key] || {}) };
        delete group[userId];
        return { ...prev, [key]: group };
      });
    }, 3000);
  }, []);

  const clearTyping = useCallback((key, userId) => {
    clearTimeout(typingTimers.current[`${key}:${userId}`]);
    setTyping((prev) => {
      const group = { ...(prev[key] || {}) };
      delete group[userId];
      return { ...prev, [key]: group };
    });
  }, []);

  const getTypingText = useCallback(
    (type, id) => {
      const key   = `${type}:${id}`;
      const names = Object.values(typing[key] || {});
      if (names.length === 0) return null;
      if (names.length === 1) return `${names[0]} está a escrever...`;
      if (names.length === 2) return `${names[0]} e ${names[1]} estão a escrever...`;
      return 'Vários utilizadores estão a escrever...';
    },
    [typing]
  );

  // ─── socket setup ──────────────────────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token || !currentUserRef.current) return;

    socket.auth = { token };
    socket.connect();

    socket.on('connect', () => socket.emit('join'));

    // ── presence ──────────────────────────────────────────────────────────
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
      // FIX: guard against missing username — use what's in users state as fallback
      const name = u.username || `utilizador ${u.id}`;
      setUsers((prev) => ({
        ...prev,
        [u.id]: { ...prev[u.id], ...u, username: name, online: true },
      }));
      if (u.id !== currentUserRef.current?.id) {
        addToast(`🟢 ${name} entrou`);
      }
    });

    socket.on('user:offline', ({ id, username }) => {
      // FIX: fallback to state username if payload is missing it
      setUsers((prev) => {
        const name = username || prev[id]?.username || `utilizador ${id}`;
        addToast(`⚫ ${name} saiu`);
        return { ...prev, [id]: { ...prev[id], online: false } };
      });
    });

    // ── groups ─────────────────────────────────────────────────────────────
    socket.on('user:groups', (list) => setGroups(list));

    // FIX: was socket.off'd immediately after socket.on in previous version
    // — listeners are now only removed in the return cleanup below

    socket.on('user:groups:new', (group) => {
      addGroup(group);
      socket.emit('join:group', { groupId: group.id });
    });

    socket.on('group:created:notify', ({ groupName, createdBy }) => {
      addToast(`➕ ${createdBy} adicionou-te ao grupo "${groupName}"`);
    });

    // user was removed from a group or group was deleted
    socket.on('group:deleted', ({ groupId }) => {
      setGroups((prev) => prev.filter((g) => g.id !== groupId));
      setGroupMessages((prev) => {
        const next = { ...prev };
        delete next[groupId];
        return next;
      });
      setGroupUnread((prev) => {
        const next = { ...prev };
        delete next[groupId];
        return next;
      });
    });

    // ── group history ──────────────────────────────────────────────────────
    socket.on('group:history', ({ groupId, messages, unreadCount, unreadSince }) => {
      setGroupMessages((prev) => ({ ...prev, [groupId]: messages }));
      if (unreadCount > 0) {
        setGroupUnread((prev) => ({
          ...prev,
          [groupId]: { count: unreadCount, since: unreadSince },
        }));
      }
    });

    // ── live group messages ────────────────────────────────────────────────
    socket.on('group:message', (msg) => {
      setGroupMessages((prev) => {
        const existing = prev[msg.group_id] || [];
        const filtered = existing.filter((m) => m.clientId !== msg.clientId);
        if (filtered.some((m) => m.id === msg.id)) return prev;
        return { ...prev, [msg.group_id]: [...filtered, msg] };
      });

      clearTyping(`group:${msg.group_id}`, msg.sender_id);

      if (msg.sender_id !== currentUserRef.current?.id) {
        setGroupUnread((prev) => {
          const cur = prev[msg.group_id] || { count: 0, since: null };
          return { ...prev, [msg.group_id]: { ...cur, count: cur.count + 1 } };
        });

        const onGroup =
          window.location.pathname === `/chat/group/${msg.group_id}` ||
          (msg.group_id === 1 && window.location.pathname === '/chat/group');

        if (!onGroup) {
          addToast(`💬 ${msg.sender_name}: ${msg.content.slice(0, 40)}`, {
            onClick: () => window.location.assign(`/chat/group/${msg.group_id}`),
          });
        }
      }
    });

    // ── private messages ───────────────────────────────────────────────────
    socket.on('private:message', (msg) => {
      const partnerId =
        msg.sender_id === currentUserRef.current?.id
          ? msg.receiver_id
          : msg.sender_id;

      setPrivateMessages((prev) => {
        const existing = prev[partnerId] || [];
        const filtered = existing.filter((m) => m.clientId !== msg.clientId);
        if (filtered.some((m) => m.id === msg.id)) return prev;
        return { ...prev, [partnerId]: [...filtered, msg] };
      });

      clearTyping(`private:${msg.sender_id}`, msg.sender_id);

      const viewing =
        window.location.pathname === `/chat/private/${msg.sender_id}`;

      if (msg.sender_id !== currentUserRef.current?.id && !viewing) {
        setUnread((prev) => ({
          ...prev,
          [partnerId]: (prev[partnerId] || 0) + 1,
        }));
        addToast(`🔒 ${msg.sender_name}: ${msg.content.slice(0, 40)}`, {
          onClick: () => window.location.assign(`/chat/private/${msg.sender_id}`),
        });
      }
    });

    socket.on('privateHistory', ({ with: partnerId, messages }) => {
      setPrivateMessages((prev) => ({ ...prev, [partnerId]: messages }));
      setUnread((prev) => ({ ...prev, [partnerId]: 0 }));
    });

    // ── typing ─────────────────────────────────────────────────────────────
    socket.on('typing:update', ({ type, id, userId, username, active }) => {
      if (userId === currentUserRef.current?.id) return;
      const key = `${type}:${id}`;
      if (active) setTypingActive(key, userId, username);
      else        clearTyping(key, userId);
    });

    // ── edit / delete ──────────────────────────────────────────────────────
    socket.on('message:edited', (msg) => {
      const patch = (arr) =>
        arr.map((m) =>
          m.id === msg.id ? { ...m, content: msg.content, edited: true } : m
        );
      if (msg.group_id) {
        setGroupMessages((prev) => ({
          ...prev,
          [msg.group_id]: patch(prev[msg.group_id] || []),
        }));
      } else {
        const pid =
          msg.sender_id === currentUserRef.current?.id
            ? msg.receiver_id
            : msg.sender_id;
        setPrivateMessages((prev) => ({
          ...prev,
          [pid]: patch(prev[pid] || []),
        }));
      }
    });

    socket.on('message:deleted', (msg) => {
      const remove = (arr) => arr.filter((m) => m.id !== msg.id);
      if (msg.group_id) {
        setGroupMessages((prev) => ({
          ...prev,
          [msg.group_id]: remove(prev[msg.group_id] || []),
        }));
      } else {
        const pid =
          msg.sender_id === currentUserRef.current?.id
            ? msg.receiver_id
            : msg.sender_id;
        setPrivateMessages((prev) => ({
          ...prev,
          [pid]: remove(prev[pid] || []),
        }));
      }
    });

    // ── cleanup — ALL socket.off go here, never outside this return ────────
    return () => {
      socket.off('connect');
      socket.off('initial_users');
      socket.off('user:online');
      socket.off('user:offline');
      socket.off('user:groups');
      socket.off('user:groups:new');
      socket.off('group:created:notify');
      socket.off('group:deleted');
      socket.off('group:history');
      socket.off('group:message');
      socket.off('private:message');
      socket.off('privateHistory');
      socket.off('typing:update');
      socket.off('message:edited');
      socket.off('message:deleted');
    };
  }, [addToast, setTypingActive, clearTyping]);

  // ─── helpers ───────────────────────────────────────────────────────────────
  const resetUnread = useCallback((id) => {
    setUnread((prev) => ({ ...prev, [id]: 0 }));
  }, []);

  const resetGroupUnread = useCallback((groupId) => {
    setGroupUnread((prev) => ({
      ...prev,
      [groupId]: { count: 0, since: prev[groupId]?.since ?? null },
    }));
  }, []);

  const addGroup = useCallback((group) => {
    setGroups((prev) => {
      if (prev.some((g) => g.id === group.id)) return prev;
      return [...prev, group];
    });
  }, []);

  const removeGroup = useCallback((groupId) => {
    setGroups((prev) => prev.filter((g) => g.id !== groupId));
    setGroupMessages((prev) => { const n = { ...prev }; delete n[groupId]; return n; });
    setGroupUnread((prev)   => { const n = { ...prev }; delete n[groupId]; return n; });
  }, []);

  const addOptimisticMessage = useCallback((type, payload) => {
    if (type === 'private') {
      setPrivateMessages((prev) => ({
        ...prev,
        [payload.receiver_id]: [
          ...(prev[payload.receiver_id] || []),
          { ...payload, _optimistic: true },
        ],
      }));
    } else if (type === 'group') {
      setGroupMessages((prev) => ({
        ...prev,
        [payload.group_id]: [
          ...(prev[payload.group_id] || []),
          { ...payload, _optimistic: true },
        ],
      }));
    }
  }, []);

  return (
    <ChatContext.Provider
      value={{
        users,
        unread,
        privateMessages,
        groupMessages,
        groupUnread,
        groups,
        toasts,
        resetUnread,
        resetGroupUnread,
        addGroup,
        removeGroup,
        addToast,
        addOptimisticMessage,
        getTypingText,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}