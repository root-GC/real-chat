import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useChatContext } from '../../store/chatContext';
import socket from '../../services/socket';

export default function ChatPage() {
  const { mode, userId: paramUserId } = useParams();
  const navigate = useNavigate();
  const { users, unread, privateMessages, groupMessages, resetUnread, addToast } = useChatContext();
  const currentUserRef = useRef(JSON.parse(localStorage.getItem('user') || 'null'));
  const messagesEndRef = useRef(null);
  const [showSidebar, setShowSidebar] = useState(false);

  const isGroup = mode === 'group';
  const partnerUsername = paramUserId;

  const currentMessages = isGroup
    ? groupMessages
    : privateMessages[partnerUsername] || [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages]);

  // Request history when conversation changes – NO unread reset here
  useEffect(() => {
    const user = currentUserRef.current;
    if (!socket.connected || !user) return;
    if (isGroup) {
      socket.emit('history');
    } else if (partnerUsername) {
      socket.emit('privateHistory', { myId: user.id, otherUsername: partnerUsername });
      // unread is reset ONLY in the 'privateHistory' event handler (context)
    }
  }, [mode, partnerUsername]);

  const handleSend = useCallback(
    (text) => {
      if (!text.trim()) return;
      if (isGroup) {
        socket.emit('group:send', { groupId: 1, content: text });
      } else if (partnerUsername) {
        const partner = Object.values(users).find(u => u.username === partnerUsername);
        if (partner) {
          socket.emit('private:send', { toId: partner.id, content: text });
        } else {
          addToast('Utilizador não encontrado', 'error');
        }
      }
    },
    [isGroup, partnerUsername, users, addToast]
  );

  const handleEditMessage = (msg) => {
    const newContent = prompt('Editar mensagem:', msg.content);
    if (newContent && newContent !== msg.content) {
      socket.emit('message:edit', { messageId: msg.id, content: newContent });
    }
  };

  const handleDeleteMessage = (msg) => {
    if (confirm('Apagar mensagem?')) {
      socket.emit('message:delete', { messageId: msg.id });
    }
  };

  const partner = Object.values(users).find(u => u.username === partnerUsername);

  return (
    <div className="chat-container">
      <header className="chat-header">
        <div className="header-left">
          <button className="icon-btn" onClick={() => navigate('/home')} title="Voltar">
            <span className="material-icons">arrow_back</span>
          </button>
          <h2>{isGroup ? 'Grupo' : partnerUsername}</h2>
        </div>
        <div className="header-right">
          <button className="icon-btn hamburger" onClick={() => setShowSidebar(!showSidebar)}>
            <span className="material-icons">menu</span>
          </button>
        </div>
      </header>

      <div className="chat-main">
        <div className="messages">
          {currentMessages.map(msg => (
            <div key={msg.id}
              className={`msg ${msg.sender_id === currentUserRef.current?.id || msg.sender_name === currentUserRef.current?.username ? 'mine' : 'other'}`}>
              <div className="msg-header">
                {msg.sender_name}
                {msg.sender_id === currentUserRef.current?.id && (
                  <span className="msg-actions">
                    <button onClick={() => handleEditMessage(msg)} title="Editar">
                      <span className="material-icons">edit</span>
                    </button>
                    <button onClick={() => handleDeleteMessage(msg)} title="Apagar">
                      <span className="material-icons">delete</span>
                    </button>
                  </span>
                )}
              </div>
              <div className="msg-body">
                {msg.content}
                {msg.edited && <span className="edited-tag"> (editado)</span>}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className={`user-list-sidebar ${showSidebar ? 'open' : ''}`}>
          <h3>Contactos</h3>
          {Object.values(users).map(u => (
            <div key={u.id} className={`user-item ${u.online ? 'online' : 'offline'}`}
              onClick={() => {
                navigate(`/chat/private/${u.username}`);
                setShowSidebar(false);
                resetUnread(u.username);
              }}>
              <span>{u.username}</span>
              {unread[u.username] > 0 && (
                <span className="unread-badge">{unread[u.username]}</span>
              )}
              <span className={u.online ? 'online-indicator' : 'offline-indicator'}></span>
            </div>
          ))}
        </div>
      </div>

      <form className="chat-input" onSubmit={e => {
        e.preventDefault();
        handleSend(e.target.elements.message.value);
        e.target.elements.message.value = '';
      }}>
        <input type="text" name="message" placeholder="Escreva uma mensagem..." />
        <button type="submit">Enviar</button>
      </form>

      <div className="toast-container">
        {/* toasts from context are already displayed globally, but you can add local ones if needed */}
      </div>
    </div>
  );
}