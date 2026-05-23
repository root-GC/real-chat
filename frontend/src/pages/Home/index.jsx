import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChatContext } from '../../store/chatContext';

export default function HomePage() {
  const navigate = useNavigate();
  const { users, unread, toasts } = useChatContext();
  const [pulseContacts, setPulseContacts] = useState(false);

  // SAFE STATE (evita crashes)
  const allUsers = Object.values(users || {});

  const onlineUsers = allUsers.filter(u => u?.online);
  const offlineUsers = allUsers.filter(u => !u?.online);

  const privateUnread = Object.values(unread || {}).reduce(
    (a, b) => a + (b || 0),
    0
  );

  const scrollToContacts = () => {
    setPulseContacts(true);
    setTimeout(() => setPulseContacts(false), 900);

    document
      .getElementById('contacts-section')
      ?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="home">
      <h1>Bem-vindo</h1>
      <p className="subtitle">Escolhe o teu modo de conversa</p>

      {/* CARDS */}
      <div className="cards">

        <div className="card" onClick={() => navigate('/chat/group')}>
          <span className="material-icons card-icon">groups</span>
          <h3>Chat em Grupo</h3>
          <p>Sala geral de conversa</p>
        </div>

        <div className="card" onClick={scrollToContacts}>
          <span className="material-icons card-icon">lock</span>
          <h3>Chat Privado</h3>
          <p>Escolhe com quem falar</p>

          {privateUnread > 0 && (
            <span className="badge">{privateUnread}</span>
          )}
        </div>

        <div className="card" onClick={() => navigate('/groups')}>
          <span className="material-icons card-icon">workspaces</span>
          <h3>Grupos</h3>
          <p>Criar e gerir salas</p>
        </div>

        <div className="card" onClick={() => navigate('/profile')}>
          <span className="material-icons card-icon">person</span>
          <h3>Perfil</h3>
          <p>Conta e definições</p>
        </div>

      </div>

      {/* CONTACTS */}
      <div
        id="contacts-section"
        className={`contacts-section ${pulseContacts ? 'pulse' : ''}`}
      >
        <div className="contacts-header">
          <h3>Contactos</h3>
        </div>

        <div className="contacts-tabs">

          <div className="contact-group">

            <h4>Online ({onlineUsers.length})</h4>

            {onlineUsers.map(u => (
              <div
                key={u.id}
                className="contact-item"
                onClick={() => navigate(`/chat/private/${u.id}`)}
              >
                <span>👤</span>
                <span>{u.username}</span>

                {(unread?.[u.id] || 0) > 0 && (
                  <span className="unread-badge">
                    {unread[u.id]}
                  </span>
                )}

                <span className="online-indicator" />
              </div>
            ))}

            <h4 style={{ marginTop: 15 }}>
              Offline ({offlineUsers.length})
            </h4>

            {offlineUsers.map(u => (
              <div
                key={u.id}
                className="contact-item offline"
                onClick={() => navigate(`/chat/private/${u.id}`)}
              >
                <span>👤</span>
                <span>{u.username}</span>
                <span className="offline-indicator" />
              </div>
            ))}

          </div>
        </div>
      </div>

      {/* TOASTS */}
      <div className="toast-container">
        {(toasts || []).map(t => (
          <div key={t.id} className="toast">
            {t.message}
          </div>
        ))}
      </div>
    </div>
  );
}