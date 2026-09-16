import { createBrowserRouter } from 'react-router-dom';

import MainLayout from '../layouts/MainLayout';

import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import MePage from '../pages/users/MePage';
import RegisterPendingPage from '../pages/auth/RegisterPendingPage';

import ProtectedRoute from '../components/protected/ProtectedRoute';
import RegisterConfirmPage from '../pages/auth/RegisterConfirmPage';
import MainPage from '../pages/main/MainPage';

import ComposersPage from '../pages/composers/ComposersPage';
import ScoresPage from '../pages/scores/ScoresPage';
import ScoreViewer from '../pages/scores/ScoreViewer';

// Public routes
// Accessible without authentication.

// Controlled routes
// Accessible to everyone.
// Services automatically use the public or authenticated API
// depending on whether a token is available.

// Protected routes
// Authentication required.

export const router = createBrowserRouter([
  {
    element: <MainLayout />,
    children: [
      // Public routes
      { path: '/', element: <MainPage /> },
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
      { path: 'register/confirm', element: <RegisterConfirmPage /> },
      { path: '/register/pending', element: <RegisterPendingPage /> },

      // Controlled routes
      // Accessible with or without a token
      { path: '/composers', element: <ComposersPage /> },
      { path: '/scores', element: <ScoresPage /> },
      { path: '/scores/:id', element: <ScoreViewer /> },
      {
        // Protected routes
        // Token mandatory
        element: <ProtectedRoute />,
        children: [{ path: '/me', element: <MePage /> }],
      },
    ],
  },

  {
    path: '*',
    element: <div>404</div>,
  },
]);
