import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChatContext } from '../../store/chatContext';

export default function HomePage() {
  const navigate = useNavigate();
  const { users, unread, toasts } = useChatContext();
  const [pulseContacts, setPulseContacts] = useState(false);

  // ================= SAFE FALLBACKS =================
  const allUsers = Object.values(users || {});

  const onlineUsers = allUsers.filter(u => u?.online);
  const offlineUsers = allUsers.filter(u => !u?.online);

  const privateUnread = Object.values(unread || {}).reduce(
    (a, b) => a + (b || 0),
    0
  );

  // ================= SCROLL =================
  const scrollToContacts = () => {
    setPulseContacts(true);

    setTimeout(() => setPulseContacts(false), 1000);

    document
      .getElementById('contacts-section')
      ?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="home">
      <h1>Bem-vindo</h1>
      <p className="subtitle">
        Escolha como deseja conversar
      </p>

      {/* ================= CARDS ================= */}
      <div className="cards">

        {/* GRUPO */}
        <div
          className="card"
          onClick={() => navigate('/chat/group')}
        >
          <span className="material-icons card-icon">
            groups
          </span>
          <h3>Chat em Grupo</h3>
          <p>Todos os utilizadores juntos</p>
        </div>

        {/* PRIVADO (GATEWAY CONTACTOS) */}
        <div
          className="card"
          onClick={scrollToContacts}
        >
          <span className="material-icons card-icon">
            lock
          </span>
          <h3>Chat Privado</h3>
          <p>Escolhe um utilizador para conversar</p>

          {privateUnread > 0 && (
            <span className="badge">
              {privateUnread}
            </span>
          )}
        </div>

        {/* GRUPOS */}
        <div
          className="card"
          onClick={() => navigate('/groups')}
        >
          <span className="material-icons card-icon">
            workspaces
          </span>
          <h3>Grupos</h3>
          <p>Criar e gerir salas</p>
        </div>

        {/* PERFIL */}
        <div
          className="card"
          onClick={() => navigate('/profile')}
        >
          <span className="material-icons card-icon">
            person
          </span>
          <h3>Perfil</h3>
          <p>Definições da conta</p>
        </div>

      </div>

      {/* ================= CONTACTS ================= */}
      <div
        id="contacts-section"
        className={`contacts-section ${
          pulseContacts ? 'pulse' : ''
        }`}
      >
        <div className="contacts-header">
          <h3>
            <span className="material-icons">
              people
            </span>
            Contactos
          </h3>
        </div>

        <div className="contacts-tabs">

          {/* ONLINE */}
          <div className="contact-group">
            <h4>
              <span className="online-dot">●</span>
              Online ({onlineUsers.length})
            </h4>

            {onlineUsers.map(u => (
              <div
                key={u.id}
                className="contact-item"
                onClick={() =>
                  navigate(`/chat/private/${u.id}`)
                }
              >
                <span className="avatar">👤</span>
                <span className="name">
                  {u.username}
                </span>

                {(unread?.[u.id] || 0) > 0 && (
                  <span className="unread-badge">
                    {unread[u.id]}
                  </span>
                )}

                <span className="online-indicator" />
              </div>
            ))}

            {onlineUsers.length === 0 && (
              <p className="empty">
                Nenhum utilizador online
              </p>
            )}

            {/* OFFLINE */}
            <h4 style={{ marginTop: '1rem' }}>
              <span className="offline-dot">●</span>
              Offline ({offlineUsers.length})
            </h4>

            {offlineUsers.map(u => (
              <div
                key={u.id}
                className="contact-item offline"
                onClick={() =>
                  navigate(`/chat/private/${u.id}`)
                }
              >
                <span className="avatar">👤</span>
                <span className="name">
                  {u.username}
                </span>

                {(unread?.[u.id] || 0) > 0 && (
                  <span className="unread-badge">
                    {unread[u.id]}
                  </span>
                )}

                <span className="offline-indicator" />
              </div>
            ))}

            {offlineUsers.length === 0 && (
              <p className="empty">
                Nenhum utilizador offline
              </p>
            )}

          </div>
        </div>
      </div>

      {/* ================= TOASTS ================= */}
      <div className="toast-container">
        {(toasts || []).map(t => (
          <div
            key={t.id}
            className="toast"
          >
            {t.message}
          </div>
        ))}
      </div>

    </div>
  );
}