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

  // keyed by groupId: { [groupId]: Message[] }
  const [groupMessages, setGroupMessages] = useState({});

  // { [groupId]: { count: number, since: string|null } }
  const [groupUnread, setGroupUnread] = useState({});

  // list of groups user belongs to: [{ id, name, is_global }]
  const [groups, setGroups] = useState([]);

  const [toasts, setToasts] = useState([]);

  const currentUser = JSON.parse(localStorage.getItem('user') || 'null');
  // stable ref so socket handlers always have latest currentUser
  const currentUserRef = useRef(currentUser);

  // ─── toasts ───────────────────────────────────────────────────────────────
  const addToast = useCallback((message) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);

  // ─── socket setup ─────────────────────────────────────────────────────────
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
      setUsers((prev) => ({
        ...prev,
        [u.id]: { ...prev[u.id], ...u, online: true },
      }));
      if (u.id !== currentUserRef.current?.id) {
        addToast(`🟢 ${u.username} entrou`);
      }
    });

    socket.on('user:offline', ({ id, username }) => {
      setUsers((prev) => ({ ...prev, [id]: { ...prev[id], online: false } }));
      const name = username || `utilizador ${id}`;
      addToast(`⚫ ${name} saiu`);
    });

    // ── groups list ────────────────────────────────────────────────────────
    socket.on('user:groups', (list) => {
      setGroups(list);
    });

    // ── group history (initial load + after join:group) ───────────────────
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

      // only increment unread for messages from other people
      if (msg.sender_id !== currentUserRef.current?.id) {
        setGroupUnread((prev) => {
          const cur = prev[msg.group_id] || { count: 0, since: null };
          return { ...prev, [msg.group_id]: { ...cur, count: cur.count + 1 } };
        });
      }
    });

    // ── private messages ──────────────────────────────────────────────────
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

      const viewing =
        window.location.pathname === `/chat/private/${msg.sender_id}`;
      if (msg.sender_id !== currentUserRef.current?.id && !viewing) {
        setUnread((prev) => ({
          ...prev,
          [partnerId]: (prev[partnerId] || 0) + 1,
        }));
      }
    });

    socket.on('privateHistory', ({ with: partnerId, messages }) => {
      setPrivateMessages((prev) => ({ ...prev, [partnerId]: messages }));
      setUnread((prev) => ({ ...prev, [partnerId]: 0 }));
    });

    // ── edit / delete ─────────────────────────────────────────────────────
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

    // ── cleanup ───────────────────────────────────────────────────────────
    return () => {
      socket.off('connect');
      socket.off('initial_users');
      socket.off('user:online');
      socket.off('user:offline');
      socket.off('user:groups');
      socket.off('group:history');
      socket.off('group:message');
      socket.off('private:message');
      socket.off('privateHistory');
      socket.off('message:edited');
      socket.off('message:deleted');
    };
  // addToast is stable (useCallback([])), safe to include
  }, [addToast]);

  // ─── helpers ──────────────────────────────────────────────────────────────
  const resetUnread = useCallback((id) => {
    setUnread((prev) => ({ ...prev, [id]: 0 }));
  }, []);

  const resetGroupUnread = useCallback((groupId) => {
    setGroupUnread((prev) => ({
      ...prev,
      // zero the count but keep 'since' so the divider stays visible this session
      [groupId]: { count: 0, since: prev[groupId]?.since ?? null },
    }));
  }, []);

  const addGroup = useCallback((group) => {
    setGroups((prev) => {
      if (prev.some((g) => g.id === group.id)) return prev;
      return [...prev, group];
    });
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
        addToast,
        addOptimisticMessage,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}