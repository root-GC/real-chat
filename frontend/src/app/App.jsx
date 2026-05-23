import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ChatProvider } from '../store/chatContext';
import LoginPage      from '../pages/Login';
import HomePage       from '../pages/Home';
import ChatPage       from '../pages/Chat';
import GroupChatPage  from '../pages/GroupChatPage';
import GroupsListPage from '../pages/GroupsListPage';
import ProfilePage    from '../pages/Profile';

function App() {
  const [user,  setUser]  = useState(() => JSON.parse(localStorage.getItem('user')  || 'null'));
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
  const guard = (el) => (isAuthenticated ? el : <Navigate to="/login" replace />);

  return (
    <ChatProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login"                    element={<LoginPage />} />
          <Route path="/home"                     element={guard(<HomePage />)} />

          {/* Private 1-to-1 */}
          <Route path="/chat/private/:partnerId"  element={guard(<ChatPage />)} />

          {/* Global group (id=1) */}
          <Route path="/chat/group"               element={guard(<GroupChatPage />)} />

          {/* Custom group by id */}
          <Route path="/chat/group/:groupId"      element={guard(<GroupChatPage />)} />

          {/* Groups management (list + create) */}
          <Route path="/groups"                   element={guard(<GroupsListPage />)} />

          <Route path="/profile"                  element={guard(<ProfilePage />)} />
          <Route path="/"                         element={<Navigate to="/home" replace />} />
        </Routes>
      </BrowserRouter>
    </ChatProvider>
  );
}

export default App;