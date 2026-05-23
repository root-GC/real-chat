import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChatContext } from '../../store/chatContext';

export default function HomePage() {
  const navigate = useNavigate();
  const { users, unread, groupUnread, groups, toasts } = useChatContext();
  const [pulseContacts, setPulseContacts] = useState(false);

  const allUsers     = Object.values(users || {});
  const onlineUsers  = allUsers.filter((u) => u?.online);
  const offlineUsers = allUsers.filter((u) => !u?.online);

  const privateUnread = Object.values(unread || {}).reduce(
    (a, b) => a + (b || 0),
    0
  );

  // total unread across all groups
  const totalGroupUnread = Object.values(groupUnread || {}).reduce(
    (a, b) => a + (b?.count || 0),
    0
  );

  // global group (id=1) unread separately for the card
  const globalGroupUnread = groupUnread?.[1]?.count || 0;

  const scrollToContacts = () => {
    setPulseContacts(true);
    setTimeout(() => setPulseContacts(false), 900);
    document.getElementById('contacts-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="home">
      <h1>Bem-vindo</h1>
      <p className="subtitle">Escolhe o teu modo de conversa</p>

      {/* ── CARDS ── */}
      <div className="cards">

        {/* Chat em Grupo — global group */}
        <div className="card" onClick={() => navigate('/chat/group')}>
          <span className="material-icons card-icon">groups</span>
          <h3>Chat em Grupo</h3>
          <p>Sala geral de conversa</p>
          {globalGroupUnread > 0 && (
            <span className="badge">{globalGroupUnread}</span>
          )}
        </div>

        {/* Chat Privado — opens contact list */}
        <div className="card" onClick={scrollToContacts}>
          <span className="material-icons card-icon">lock</span>
          <h3>Chat Privado</h3>
          <p>Escolhe com quem falar</p>
          {privateUnread > 0 && (
            <span className="badge">{privateUnread}</span>
          )}
        </div>

        {/* Grupos — manage rooms */}
        <div className="card" onClick={() => navigate('/groups')}>
          <span className="material-icons card-icon">workspaces</span>
          <h3>Grupos</h3>
          <p>Criar e gerir salas</p>
          {totalGroupUnread > 0 && (
            <span className="badge">{totalGroupUnread}</span>
          )}
        </div>

        {/* Perfil */}
        <div className="card" onClick={() => navigate('/profile')}>
          <span className="material-icons card-icon">person</span>
          <h3>Perfil</h3>
          <p>Conta e definições</p>
        </div>

      </div>

      {/* ── CONTACTS ── */}
      <div
        id="contacts-section"
        className={`contacts-section ${pulseContacts ? 'pulse' : ''}`}
      >
        <div className="contacts-header">
          <h3>
            <span className="material-icons">people</span>
            Contactos
          </h3>
        </div>

        <div className="contact-group">

          <h4>
            <span className="online-dot">●</span>
            Online ({onlineUsers.length})
          </h4>

          {onlineUsers.map((u) => (
            <div
              key={u.id}
              className="contact-item"
              onClick={() => navigate(`/chat/private/${u.id}`)}
            >
              <span className="avatar">👤</span>
              <span className="name">{u.username}</span>
              {(unread?.[u.id] || 0) > 0 && (
                <span className="unread-badge">{unread[u.id]}</span>
              )}
              <span className="online-indicator" />
            </div>
          ))}

          {onlineUsers.length === 0 && (
            <p className="empty">Nenhum utilizador online</p>
          )}

          <h4 style={{ marginTop: '1rem' }}>
            <span className="offline-dot">●</span>
            Offline ({offlineUsers.length})
          </h4>

          {offlineUsers.map((u) => (
            <div
              key={u.id}
              className="contact-item offline"
              onClick={() => navigate(`/chat/private/${u.id}`)}
            >
              <span className="avatar">👤</span>
              <span className="name">{u.username}</span>
              {(unread?.[u.id] || 0) > 0 && (
                <span className="unread-badge">{unread[u.id]}</span>
              )}
              <span className="offline-indicator" />
            </div>
          ))}

          {offlineUsers.length === 0 && (
            <p className="empty">Nenhum utilizador offline</p>
          )}

        </div>
      </div>

      {/* ── TOASTS ── */}
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