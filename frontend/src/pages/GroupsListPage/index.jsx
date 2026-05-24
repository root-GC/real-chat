import { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChatContext } from '../../store/chatContext';
import socket from '../../services/socket';

export default function GroupsListPage() {
  const navigate = useNavigate();
  const { users, groups, groupUnread, addGroup, removeGroup, toasts } = useChatContext();

  const currentUser = JSON.parse(localStorage.getItem('user') || 'null');

  const [showModal, setShowModal] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [search,    setSearch]    = useState('');
  const [selected,  setSelected]  = useState(new Set());
  const [creating,  setCreating]  = useState(false);
  const [error,     setError]     = useState('');
  const [deleting,  setDeleting]  = useState(null);

  // Keep refs to pending once-listeners so we can clean them up on unmount
  const deleteAckRef   = useRef(null);
  const deleteErrRef   = useRef(null);
  const deleteTimerRef = useRef(null);

  // Clean up dangling socket listeners when the component unmounts
  useEffect(() => {
    return () => {
      if (deleteAckRef.current)   socket.off('group:deleted:ack',   deleteAckRef.current);
      if (deleteErrRef.current)   socket.off('group:delete:error',  deleteErrRef.current);
      if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current);
    };
  }, []);

  const allUsers      = Object.values(users || {}).filter((u) => u.id !== currentUser?.id);
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

  // ── create ─────────────────────────────────────────────────────────────────
  const handleCreate = () => {
    if (!groupName.trim()) { setError('O nome do grupo é obrigatório.'); return; }
    setCreating(true);
    setError('');

    socket.emit('group:create', { name: groupName.trim(), memberIds: [...selected] });

    socket.once('group:created', (group) => {
      setCreating(false);
      addGroup(group);
      setShowModal(false);
      navigate(group.id === 1 ? '/chat/group' : `/chat/group/${group.id}`);
    });

    socket.once('group:create:error', (msg) => {
      setCreating(false);
      setError(msg || 'Erro ao criar grupo.');
    });
  };

  // ── delete ─────────────────────────────────────────────────────────────────
  const handleDelete = (e, group) => {
    e.stopPropagation();
    if (!confirm(`Apagar o grupo "${group.name}"? Esta ação é irreversível.`)) return;

    // Remove any previous dangling listeners before registering new ones
    if (deleteAckRef.current)  socket.off('group:deleted:ack',  deleteAckRef.current);
    if (deleteErrRef.current)  socket.off('group:delete:error', deleteErrRef.current);
    if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current);

    setDeleting(group.id);
    setError('');

    const onAck = () => {
      clearTimeout(deleteTimerRef.current);
      deleteAckRef.current  = null;
      deleteErrRef.current  = null;
      setDeleting(null);
      removeGroup(group.id);
    };

    const onErr = (msg) => {
      clearTimeout(deleteTimerRef.current);
      deleteAckRef.current  = null;
      deleteErrRef.current  = null;
      setDeleting(null);
      setError(msg || 'Não foi possível apagar o grupo.');
    };

    // Safety timeout — if server never responds, reset after 8s
    deleteTimerRef.current = setTimeout(() => {
      socket.off('group:deleted:ack',  onAck);
      socket.off('group:delete:error', onErr);
      deleteAckRef.current = null;
      deleteErrRef.current = null;
      setDeleting(null);
      setError('O servidor não respondeu. Tenta novamente.');
    }, 8000);

    deleteAckRef.current = onAck;
    deleteErrRef.current = onErr;

    socket.once('group:deleted:ack',  onAck);
    socket.once('group:delete:error', onErr);

    socket.emit('group:delete', { groupId: group.id });
  };

  const sortedGroups = useMemo(() => {
    return [...groups].sort((a, b) => {
      if (a.is_global && !b.is_global) return -1;
      if (!a.is_global && b.is_global) return  1;
      return a.name.localeCompare(b.name);
    });
  }, [groups]);

  return (
    <div className="home">

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <button className="icon-btn" onClick={() => navigate('/home')}>
          <span className="material-icons">arrow_back</span>
        </button>
        <h1 style={{ margin: 0 }}>Grupos</h1>
      </div>

      <p className="subtitle">Os teus grupos e salas de conversa</p>

      <button className="btn-primary" onClick={openModal} style={{ marginBottom: 20 }}>
        <span className="material-icons" style={{ verticalAlign: 'middle', marginRight: 6 }}>add</span>
        Criar novo grupo
      </button>

      {error && <p className="modal-error" style={{ marginBottom: 12 }}>{error}</p>}

      {/* GROUPS LIST */}
      <div className="groups-list">
        {sortedGroups.length === 0 && (
          <p className="empty">Ainda não pertences a nenhum grupo.</p>
        )}

        {sortedGroups.map((g) => {
          const count      = groupUnread?.[g.id]?.count || 0;
          // FIX: cast both to Number — DB is number, currentUser.id may be string from localStorage
          const isOwner    = Number(g.created_by) === Number(currentUser?.id);
          const isDeletable = isOwner && !g.is_global;

          return (
            <div
              key={g.id}
              className="group-item card"
              onClick={() => navigate(g.id === 1 ? '/chat/group' : `/chat/group/${g.id}`)}
            >
              <span className="material-icons card-icon" style={{ fontSize: 28 }}>
                {g.is_global ? 'groups' : 'group'}
              </span>

              <div style={{ flex: 1 }}>
                <strong>{g.name}</strong>
                {g.is_global && <span className="tag-global"> ✦ geral</span>}
                {isOwner && !g.is_global && <span className="tag-owner"> · criado por ti</span>}
              </div>

              {count > 0 && <span className="unread-badge">{count}</span>}

              {isDeletable && (
                <button
                  className="icon-btn icon-btn-danger"
                  title="Apagar grupo"
                  disabled={deleting === g.id}
                  onClick={(e) => handleDelete(e, g)}
                >
                  <span className="material-icons" style={{ fontSize: 20 }}>
                    {deleting === g.id ? 'hourglass_empty' : 'delete'}
                  </span>
                </button>
              )}

              <span className="material-icons" style={{ color: 'var(--c-muted)' }}>
                chevron_right
              </span>
            </div>
          );
        })}
      </div>

      {/* CREATE GROUP MODAL */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>

            <div className="modal-header">
              <h3>Novo grupo</h3>
              <button className="icon-btn" onClick={() => setShowModal(false)}>
                <span className="material-icons">close</span>
              </button>
            </div>

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

            <div className="modal-user-list">
              {filteredUsers.length === 0 && (
                <p className="empty" style={{ padding: '8px 12px' }}>
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