import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ChatProvider } from '../store/chatContext';
import LoginPage from '../pages/Login';
import HomePage from '../pages/Home';
import ChatPage from '../pages/Chat';
import GroupsPage from '../pages/Groups';
import ProfilePage from '../pages/Profile';

function App() {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('token'));

  useEffect(() => {
    const handleAuthChange = () => {
      setToken(localStorage.getItem('token'));
      setUser(JSON.parse(localStorage.getItem('user') || 'null'));
    };
    window.addEventListener('auth-change', handleAuthChange);
    return () => window.removeEventListener('auth-change', handleAuthChange);
  }, []);

  const isAuthenticated = !!user && !!token;

  // FIX: removed the conflicting /chat/:mode?/:userId? generic route.
  // Private chat lives exclusively at /chat/private/:partnerId.
  // Group chat lives at /chat/group (served by GroupsPage).
  return (
    <ChatProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route
            path="/home"
            element={isAuthenticated ? <HomePage /> : <Navigate to="/login" replace />}
          />

          {/* Private 1-to-1 chat */}
          <Route
            path="/chat/private/:partnerId"
            element={isAuthenticated ? <ChatPage /> : <Navigate to="/login" replace />}
          />

          {/* Group / global chat */}
          <Route
            path="/chat/group"
            element={isAuthenticated ? <GroupsPage /> : <Navigate to="/login" replace />}
          />

          <Route
            path="/groups"
            element={isAuthenticated ? <GroupsPage /> : <Navigate to="/login" replace />}
          />

          <Route
            path="/profile"
            element={isAuthenticated ? <ProfilePage /> : <Navigate to="/login" replace />}
          />

          <Route path="/" element={<Navigate to="/home" replace />} />
        </Routes>
      </BrowserRouter>
    </ChatProvider>
  );
}

export default App;