import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ProfilePage() {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const navigate = useNavigate();
  const [theme, setTheme] = useState(
    document.documentElement.classList.contains('light-mode') ? 'light' : 'dark'
  );

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.documentElement.classList.toggle('light-mode', newTheme === 'light');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="profile-page">
      <div className="profile-card">
        <div className="profile-header">
          <button className="icon-btn" onClick={() => navigate('/')} title="Voltar">
            <span className="material-icons">arrow_back</span>
          </button>
        </div>
        <div className="profile-avatar">
          <span className="material-icons" style={{ fontSize: '4rem' }}>account_circle</span>
        </div>
        <h2>{user?.username || user?.email}</h2>
        <p>{user?.email}</p>
        <div className="profile-actions">
          <button onClick={toggleTheme} className="btn">
            {theme === 'dark' ? '☀️ Modo Claro' : '🌙 Modo Escuro'}
          </button>
          <button onClick={handleLogout} className="btn btn-logout">
            Terminar Sessão
          </button>
        </div>
      </div>
    </div>
  );
}