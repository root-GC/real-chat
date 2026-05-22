import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChatContext } from '../../store/chatContext';

export default function HomePage() {
  const navigate = useNavigate();
  const { users, unread, toasts } = useChatContext();
  const [pulseContacts, setPulseContacts] = useState(false);

  const allUsers = Object.values(users);
  const onlineUsers = allUsers.filter(u => u.online);
  const offlineUsers = allUsers.filter(u => !u.online);
  const privateUnread = Object.values(unread).reduce((a, b) => a + b, 0);

  const scrollToContacts = () => {
    setPulseContacts(true);
    setTimeout(() => setPulseContacts(false), 1000);
    document.getElementById('contacts-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="home">
      <h1>Bem-vindo</h1>
      <p className="subtitle">Escolha como deseja conversar</p>
      <div className="cards">
        <div className="card" onClick={() => navigate('/chat/group')}>
          <span className="material-icons card-icon">groups</span>
          <h3>Chat em Grupo</h3>
          <p>Todos os utilizadores juntos</p>
        </div>
        <div className="card" onClick={scrollToContacts}>
          <span className="material-icons card-icon">lock</span>
          <h3>Chat Privado</h3>
          <p>Conversa individual</p>
          {privateUnread > 0 && <span className="badge">{privateUnread}</span>}
        </div>
        <div className="card" onClick={() => navigate('/groups')}>
          <span className="material-icons card-icon">workspaces</span>
          <h3>Grupos</h3>
          <p>Criar e gerir grupos</p>
        </div>
        <div className="card" onClick={() => navigate('/profile')}>
          <span className="material-icons card-icon">person</span>
          <h3>Perfil</h3>
          <p>Definições e tema</p>
        </div>
      </div>

      <div id="contacts-section" className={`contacts-section ${pulseContacts ? 'pulse' : ''}`}>
        <div className="contacts-header">
          <h3><span className="material-icons">people</span> Contactos</h3>
        </div>
        <div className="contacts-tabs">
          <div className="contact-group">
            <h4><span className="online-dot">●</span> Online ({onlineUsers.length})</h4>
            {onlineUsers.map(u => (
              <div key={u.id} className="contact-item" onClick={() => navigate(`/chat/private/${u.username}`)}>
                <span className="avatar">👤</span>
                <span className="name">{u.username}</span>
                {unread[u.username] > 0 && (
                  <span className="unread-badge">{unread[u.username]}</span>
                )}
                <span className="online-indicator"></span>
              </div>
            ))}
            {onlineUsers.length === 0 && <p className="empty">Nenhum online</p>}
            <h4 style={{ marginTop: '1rem' }}>
              <span className="offline-dot">●</span> Offline ({offlineUsers.length})
            </h4>
            {offlineUsers.map(u => (
              <div key={u.id} className="contact-item offline" onClick={() => navigate(`/chat/private/${u.username}`)}>
                <span className="avatar">👤</span>
                <span className="name">{u.username}</span>
                {unread[u.username] > 0 && (
                  <span className="unread-badge">{unread[u.username]}</span>
                )}
                <span className="offline-indicator"></span>
              </div>
            ))}
            {offlineUsers.length === 0 && <p className="empty">Nenhum offline</p>}
          </div>
        </div>
      </div>

      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className="toast" onClick={() => {}}>{t.message}</div>
        ))}
      </div>
    </div>
  );
}