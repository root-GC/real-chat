import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useChatContext } from '../../store/chatContext';
import socket from '../../services/socket';

// Format timestamp as HH:MM
function fmtTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
}

// Format date divider label
function fmtDateLabel(iso) {
  if (!iso) return '';
  const d    = new Date(iso);
  const now  = new Date();
  const diff = now.setHours(0,0,0,0) - d.setHours(0,0,0,0);
  if (diff === 0)        return 'Hoje';
  if (diff === 86400000) return 'Ontem';
  return new Date(iso).toLocaleDateString('pt-PT', { day: '2-digit', month: 'long' });
}

export default function GroupChatPage() {
  // /chat/group       → groupId defaults to 1
  // /chat/group/:groupId → custom group
  const { groupId: paramId } = useParams();
  const groupId   = paramId ? Number(paramId) : 1;
  const navigate  = useNavigate();

  const {
    users,
    unread,
    groupMessages,
    groupUnread,
    groups,
    resetUnread,
    resetGroupUnread,
    addOptimisticMessage,
    getTypingText,
    toasts,
  } = useChatContext();

  const currentUser    = JSON.parse(localStorage.getItem('user') || 'null');
  const messagesEndRef = useRef(null);
  const inputRef       = useRef(null);
  const [showSidebar, setShowSidebar] = useState(false);

  const messages     = groupMessages?.[groupId] || [];
  const unreadInfo   = groupUnread?.[groupId];
  const typingText   = getTypingText('group', groupId);
  const groupInfo    = groups.find((g) => g.id === groupId);
  const groupName    = groupInfo?.name || (groupId === 1 ? 'Geral' : `Grupo ${groupId}`);

  // ── on mount: join room + mark read ────────────────────────────────────────
  useEffect(() => {
    if (!socket.connected) return;

    // ask server for latest history (catches messages that arrived while offline)
    socket.emit('join:group', { groupId });
    socket.emit('group:read',  { groupId });

    resetGroupUnread(groupId);
  }, [groupId, resetGroupUnread]);

  // also re-request history when socket reconnects
  useEffect(() => {
    const onConnect = () => {
      socket.emit('join:group', { groupId });
      socket.emit('group:read',  { groupId });
    };
    socket.on('connect', onConnect);
    return () => socket.off('connect', onConnect);
  }, [groupId]);

  // scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── typing indicator ───────────────────────────────────────────────────────
  const typingTimer = useRef(null);

  const handleInputChange = () => {
    socket.emit('typing:start', { type: 'group', id: groupId });
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      socket.emit('typing:stop', { type: 'group', id: groupId });
    }, 2000);
  };

  // ── send message ───────────────────────────────────────────────────────────
  const handleSend = useCallback(
    (text) => {
      if (!text.trim()) return;
      clearTimeout(typingTimer.current);
      socket.emit('typing:stop', { type: 'group', id: groupId });

      const clientId = 'c_' + Date.now();

      addOptimisticMessage('group', {
        clientId,
        content: text,
        sender_id:   currentUser.id,
        sender_name: currentUser.username,
        group_id:    groupId,
        created_at:  new Date().toISOString(),
      });

      socket.emit('group:send', { groupId, content: text, clientId });
    },
    [groupId, currentUser, addOptimisticMessage]
  );

  const handleEdit = (msg) => {
    const c = prompt('Editar mensagem:', msg.content);
    if (!c || c === msg.content) return;
    socket.emit('message:edit', { messageId: msg.id, content: c });
  };

  const handleDelete = (msg) => {
    if (!confirm('Apagar mensagem?')) return;
    socket.emit('message:delete', { messageId: msg.id });
  };

  // ── render helpers ─────────────────────────────────────────────────────────
  // Inject date dividers + unread divider into message list
  function buildRenderList(msgs) {
    const result = [];
    let lastDate = null;

    msgs.forEach((msg, i) => {
      const msgDate = fmtDateLabel(msg.created_at);

      // date separator
      if (msgDate !== lastDate) {
        result.push({ type: 'date-divider', label: msgDate, key: `date-${i}` });
        lastDate = msgDate;
      }

      // unread divider — insert before the first unread message
      if (
        unreadInfo?.count > 0 &&
        unreadInfo?.since &&
        new Date(msg.created_at) > new Date(unreadInfo.since) &&
        (i === 0 || new Date(msgs[i - 1].created_at) <= new Date(unreadInfo.since))
      ) {
        result.push({
          type:  'unread-divider',
          label: `${unreadInfo.count} mensagen${unreadInfo.count > 1 ? 's' : ''} não lida${unreadInfo.count > 1 ? 's' : ''}`,
          key:   'unread-divider',
        });
      }

      result.push({ type: 'message', msg, key: msg.id || msg.clientId });
    });

    return result;
  }

  const renderList = buildRenderList(messages);

  return (
    <div className="chat-container">

      {/* HEADER */}
      <header className="chat-header">
        <div className="header-left">
          <button className="icon-btn" onClick={() => navigate('/home')}>
            <span className="material-icons">arrow_back</span>
          </button>
          <h2>{groupName}</h2>
        </div>
        <div className="header-right">
          <button className="icon-btn" onClick={() => setShowSidebar(!showSidebar)}>
            <span className="material-icons">menu</span>
          </button>
        </div>
      </header>

      {/* MAIN */}
      <div className="chat-main">

        {/* MESSAGES */}
        <div className="messages">
          {renderList.map((item) => {
            if (item.type === 'date-divider') {
              return (
                <div key={item.key} className="divider date-divider">
                  <span>{item.label}</span>
                </div>
              );
            }

            if (item.type === 'unread-divider') {
              return (
                <div key={item.key} className="divider unread-divider">
                  <span>↓ {item.label}</span>
                </div>
              );
            }

            const { msg } = item;
            const isMine  = msg.sender_id === currentUser?.id;

            return (
              <div
                key={item.key}
                className={`msg ${isMine ? 'mine' : 'other'}`}
              >
                <div className="msg-header">
                  <span className="msg-sender">{msg.sender_name}</span>

                  {isMine && (
                    <span className="msg-actions">
                      <button onClick={() => handleEdit(msg)}>
                        <span className="material-icons">edit</span>
                      </button>
                      <button onClick={() => handleDelete(msg)}>
                        <span className="material-icons">delete</span>
                      </button>
                    </span>
                  )}
                </div>

                <div className="msg-body">
                  {msg.content}
                  {msg._optimistic && (
                    <span className="edited-tag"> ⏳</span>
                  )}
                  {msg.edited && !msg._optimistic && (
                    <span className="edited-tag"> (editado)</span>
                  )}
                </div>

                <div className="msg-time">{fmtTime(msg.created_at)}</div>
              </div>
            );
          })}

          {/* Typing indicator */}
          {typingText && (
            <div className="typing-indicator">
              <span className="typing-dots">
                <span /><span /><span />
              </span>
              {typingText}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* SIDEBAR — contacts + groups */}
        <div className={`user-list-sidebar ${showSidebar ? 'open' : ''}`}>
          <h3>Contactos</h3>
          {Object.values(users || {}).map((u) => (
            <div
              key={u.id}
              className={`user-item ${u.online ? 'online' : 'offline'}`}
              onClick={() => {
                navigate(`/chat/private/${u.id}`);
                setShowSidebar(false);
              }}
            >
              <span>{u.username}</span>
              {(unread?.[u.id] || 0) > 0 && (
                <span className="unread-badge">{unread[u.id]}</span>
              )}
              <span className={u.online ? 'online-indicator' : 'offline-indicator'} />
            </div>
          ))}
        </div>

      </div>

      {/* INPUT */}
      <form
        className="chat-input"
        onSubmit={(e) => {
          e.preventDefault();
          handleSend(e.target.elements.message.value);
          e.target.reset();
        }}
      >
        <input
          ref={inputRef}
          type="text"
          name="message"
          placeholder="Escreve uma mensagem..."
          autoComplete="off"
          onChange={handleInputChange}
        />
        <button type="submit">
          <span className="material-icons">send</span>
        </button>
      </form>

      {/* TOASTS */}
      <div className="toast-container">
        {(toasts || []).map((t) => (
          <div
            key={t.id}
            className={`toast ${t.onClick ? 'toast-clickable' : ''}`}
            onClick={t.onClick}
          >
            {t.message}
          </div>
        ))}
      </div>
    </div>
  );
}