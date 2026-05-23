import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChatContext } from '../../store/chatContext';
import socket from '../../services/socket';

export default function GroupsListPage() {
  const navigate = useNavigate();
  const { users, groups, groupUnread, addGroup, toasts } = useChatContext();

  const currentUser = JSON.parse(localStorage.getItem('user') || 'null');

  const [showModal, setShowModal]       = useState(false);
  const [groupName, setGroupName]       = useState('');
  const [search,    setSearch]          = useState('');
  const [selected,  setSelected]        = useState(new Set());
  const [creating,  setCreating]        = useState(false);
  const [error,     setError]           = useState('');

  // All users except self, filtered by search
  const allUsers     = Object.values(users || {}).filter((u) => u.id !== currentUser?.id);
  const filteredUsers = useMemo(() => {
    const q = search.toLowerCase();
    return q ? allUsers.filter((u) => u.username.toLowerCase().includes(q)) : allUsers;
  }, [allUsers, search]);

  const toggleSelect = (userId) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(userId) ? next.delete(userId) : next.add(userId);
      return next;
    });
  };

  const openModal = () => {
    setGroupName('');
    setSearch('');
    setSelected(new Set());
    setError('');
    setShowModal(true);
  };

  const handleCreate = async () => {
    if (!groupName.trim()) {
      setError('O nome do grupo é obrigatório.');
      return;
    }
    setCreating(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const res   = await fetch('/api/groups', {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization:  `Bearer ${token}`,
        },
        body: JSON.stringify({
          name:      groupName.trim(),
          memberIds: [...selected],
        }),
      });

      if (!res.ok) throw new Error('Erro ao criar grupo');

      const group = await res.json();

      // add to context immediately
      addGroup(group);

      // ask socket to join the room + get history
      socket.emit('join:group', { groupId: group.id });

      setShowModal(false);
      navigate(`/chat/group/${group.id}`);
    } catch (e) {
      setError(e.message);
    } finally {
      setCreating(false);
    }
  };

  // Sort: global group first, then by name
  const sortedGroups = useMemo(() => {
    return [...groups].sort((a, b) => {
      if (a.is_global && !b.is_global) return -1;
      if (!a.is_global && b.is_global) return  1;
      return a.name.localeCompare(b.name);
    });
  }, [groups]);

  return (
    <div className="home">

      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <button className="icon-btn" onClick={() => navigate('/home')}>
          <span className="material-icons">arrow_back</span>
        </button>
        <h1 style={{ margin: 0 }}>Grupos</h1>
      </div>

      <p className="subtitle">Os teus grupos e salas de conversa</p>

      {/* CREATE BUTTON */}
      <button className="btn-primary" onClick={openModal} style={{ marginBottom: 20 }}>
        <span className="material-icons" style={{ verticalAlign: 'middle', marginRight: 6 }}>
          add
        </span>
        Criar novo grupo
      </button>

      {/* GROUPS LIST */}
      <div className="groups-list">
        {sortedGroups.length === 0 && (
          <p className="empty">Ainda não pertences a nenhum grupo.</p>
        )}

        {sortedGroups.map((g) => {
          const unreadInfo = groupUnread?.[g.id];
          const count      = unreadInfo?.count || 0;

          return (
            <div
              key={g.id}
              className="group-item card"
              onClick={() =>
                navigate(g.id === 1 ? '/chat/group' : `/chat/group/${g.id}`)
              }
            >
              <span className="material-icons card-icon" style={{ fontSize: 28 }}>
                {g.is_global ? 'groups' : 'group'}
              </span>

              <div style={{ flex: 1 }}>
                <strong>{g.name}</strong>
                {g.is_global && (
                  <span className="tag-global"> ✦ geral</span>
                )}
              </div>

              {count > 0 && (
                <span className="unread-badge">{count}</span>
              )}

              <span className="material-icons" style={{ color: 'var(--c-muted)' }}>
                chevron_right
              </span>
            </div>
          );
        })}
      </div>

      {/* ── CREATE GROUP MODAL ── */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>

            <div className="modal-header">
              <h3>Novo grupo</h3>
              <button className="icon-btn" onClick={() => setShowModal(false)}>
                <span className="material-icons">close</span>
              </button>
            </div>

            {/* Group name */}
            <label className="modal-label">Nome do grupo</label>
            <input
              className="modal-input"
              type="text"
              placeholder="Ex: Equipa de Projeto"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              maxLength={80}
              autoFocus
            />

            {/* Member search */}
            <label className="modal-label" style={{ marginTop: 14 }}>
              Adicionar membros
            </label>
            <input
              className="modal-input"
              type="text"
              placeholder="Pesquisar utilizador..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            {/* User list */}
            <div className="modal-user-list">
              {filteredUsers.length === 0 && (
                <p className="empty" style={{ padding: '8px 0' }}>
                  Nenhum utilizador encontrado.
                </p>
              )}

              {filteredUsers.map((u) => (
                <div
                  key={u.id}
                  className={`modal-user-item ${selected.has(u.id) ? 'selected' : ''}`}
                  onClick={() => toggleSelect(u.id)}
                >
                  <span className="material-icons" style={{ fontSize: 20 }}>
                    {selected.has(u.id) ? 'check_circle' : 'radio_button_unchecked'}
                  </span>
                  <span style={{ marginLeft: 8 }}>{u.username}</span>
                  <span
                    className={u.online ? 'online-indicator' : 'offline-indicator'}
                    style={{ marginLeft: 'auto' }}
                  />
                </div>
              ))}
            </div>

            {selected.size > 0 && (
              <p className="modal-selected-count">
                {selected.size} membro{selected.size > 1 ? 's' : ''} selecionado{selected.size > 1 ? 's' : ''}
              </p>
            )}

            {error && <p className="modal-error">{error}</p>}

            <button
              className="btn-primary"
              style={{ width: '100%', marginTop: 16 }}
              onClick={handleCreate}
              disabled={creating}
            >
              {creating ? 'A criar...' : 'Criar grupo'}
            </button>

          </div>
        </div>
      )}

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