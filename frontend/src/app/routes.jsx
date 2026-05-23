import { Navigate } from 'react-router-dom';
import LoginPage from '../pages/Login';
import HomePage from '../pages/Home';
import ChatPage from '../pages/Chat';
import GroupsPage from '../pages/Groups';
import ProfilePage from '../pages/Profile';

// FIX: removed the conflicting /chat/:mode?/:userId? generic route.
// Private chat → /chat/private/:partnerId (ChatPage)
// Group chat   → /chat/group             (GroupsPage)
const routes = [
  { path: '/login',                   element: <LoginPage />,   protected: false },
  { path: '/home',                    element: <HomePage />,    protected: true  },
  { path: '/chat/private/:partnerId', element: <ChatPage />,    protected: true  },
  { path: '/chat/group',              element: <GroupsPage />,  protected: true  },
  { path: '/groups',                  element: <GroupsPage />,  protected: true  },
  { path: '/profile',                 element: <ProfilePage />, protected: true  },
  { path: '/',                        element: <Navigate to="/home" replace />, protected: true },
];

export default routes;