import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChatContext } from '../../store/chatContext';
import socket from '../../services/socket';

export default function GroupsPage() {
  const navigate = useNavigate();
  const {
    users,
    unread,
    groupMessages,
    resetUnread,
    addOptimisticMessage,
    addToast,
  } = useChatContext();

  const currentUser = JSON.parse(localStorage.getItem('user') || 'null');

  const [activeGroup] = useState(1);
  const [showSidebar, setShowSidebar] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    socket.emit('join:group', { groupId: activeGroup });
    socket.emit('history', { groupId: activeGroup });
  }, [activeGroup]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [groupMessages]);

  const handleSend = useCallback(
    (text) => {
      if (!text.trim()) return;
      const clientId = 'c_' + Date.now();

      addOptimisticMessage('group', {
        clientId,
        content: text,
        sender_id: currentUser.id,
        sender_name: currentUser.username,
        group_id: activeGroup,
        created_at: new Date().toISOString(),
      });

      socket.emit('group:send', {
        groupId: activeGroup,
        content: text,
        clientId,
      });
    },
    [activeGroup, currentUser.id, currentUser.username, addOptimisticMessage]
  );

  const handleEditMessage = (msg) => {
    const newContent = prompt('Editar mensagem:', msg.content);
    if (!newContent || newContent === msg.content) return;
    socket.emit('message:edit', { messageId: msg.id, content: newContent });
  };

  const handleDeleteMessage = (msg) => {
    if (!confirm('Apagar mensagem?')) return;
    socket.emit('message:delete', { messageId: msg.id });
  };

  return (
    <div className="chat-container">
      <header className="chat-header">
        <div className="header-left">
          <button className="icon-btn" onClick={() => navigate('/home')}>←</button>
          <h2>Grupo {activeGroup}</h2>
        </div>
        <div className="header-right">
          <button className="icon-btn hamburger" onClick={() => setShowSidebar(!showSidebar)}>☰</button>
        </div>
        <span className="status online">online</span>
      </header>

      <div className="chat-main">
        <div className="messages" style={{ flex: 1 }}>
          {groupMessages.map((msg) => (
            <div
              key={msg.id || msg.clientId}
              className={`msg ${msg.sender_id === currentUser.id ? 'mine' : 'other'}`}
            >
              <div className="msg-header">
                {msg.sender_name}
                {msg.sender_id === currentUser.id && (
                  <span className="msg-actions">
                    <button onClick={() => handleEditMessage(msg)}>✏️</button>
                    <button onClick={() => handleDeleteMessage(msg)}>🗑️</button>
                  </span>
                )}
              </div>
              <div className="msg-body">
                {msg.content}
                {msg._optimistic && <span className="edited-tag"> (a enviar...)</span>}
                {msg.edited && !msg._optimistic && <span className="edited-tag"> (editado)</span>}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className={`user-list-sidebar ${showSidebar ? 'open' : ''}`}>
          <h3>Contactos</h3>
          {Object.values(users).map((u) => (
            <div
              key={u.id}
              className={`user-item ${u.online ? 'online' : 'offline'}`}
              onClick={() => {
                navigate(`/chat/private/${u.id}`);
                setShowSidebar(false);
                resetUnread(u.id);
              }}
            >
              <span>{u.username}</span>
              {unread[u.id] > 0 && <span className="unread-badge">{unread[u.id]}</span>}
              <span className={u.online ? 'online-indicator' : 'offline-indicator'}></span>
            </div>
          ))}
        </div>
      </div>

      <form
        className="chat-input"
        onSubmit={(e) => {
          e.preventDefault();
          handleSend(e.target.elements.message.value);
          e.target.reset();
        }}
      >
        <input type="text" name="message" placeholder="Escreve..." />
        <button type="submit">Enviar</button>
      </form>
    </div>
  );
}