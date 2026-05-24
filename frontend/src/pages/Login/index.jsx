import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const navigate = useNavigate();
const API_BASE = import.meta.env.VITE_API_URL;


  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = `${API_BASE}/api/auth/${isRegister ? 'register' : 'login'}`;
    const body = isRegister
      ? { email, username: username || email, password }
      : { email, password };

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      window.dispatchEvent(new Event('auth-change'));
      navigate('/home');
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="login-container">
      <form onSubmit={handleSubmit} className="login-card">
        <h2>{isRegister ? 'Criar Conta' : 'Entrar'}</h2>
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        {isRegister && <input type="text" placeholder="Username (opcional)" value={username} onChange={(e) => setUsername(e.target.value)} />}
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <button type="submit">{isRegister ? 'Registar' : 'Login'}</button>
        <p onClick={() => setIsRegister(!isRegister)} style={{ cursor: 'pointer', marginTop: '0.5rem' }}>
          {isRegister ? 'Já tenho conta' : 'Criar conta'}
        </p>
      </form>
    </div>
  );
}