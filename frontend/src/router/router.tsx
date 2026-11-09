import { createBrowserRouter, Navigate } from 'react-router-dom';

import MainLayout from '../layouts/MainLayout';

import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import MePage from '../pages/users/MePage';
import RegisterPendingPage from '../pages/auth/RegisterPendingPage';

import ProtectedRoute from '../components/protected/ProtectedRoute';
import RegisterConfirmPage from '../pages/auth/RegisterConfirmPage';
import MainPage from '../pages/main/MainPage';
import PendingPage from '../pages/PendingPage';
import ComposersPage from '../pages/composers/ComposersPage';
import ScoresPage from '../pages/scores/ScoresPage';
import ScoreSinglePage from '../pages/scores/ScoreSinglePage';
import { config } from './../config/config';

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
      // Pending
      { path: '/pending', element: <PendingPage /> },

      // Public routes
      { path: '/', element: <MainPage /> },
      { path: '/login', element: <LoginPage /> },

      // Preferable to use <Navigate to="/login" replace /> to avoid a false url
      {
        path: '/register',
        element: config.registerAllowed ? (
          <RegisterPage />
        ) : (
          <Navigate
            to="/login"
            replace
          />
        ),
      },
      {
        path: '/register/confirm',
        element: config.registerAllowed ? (
          <RegisterConfirmPage />
        ) : (
          <Navigate
            to="/login"
            replace
          />
        ),
      },
      {
        path: '/register/pending',
        element: config.registerAllowed ? (
          <RegisterPendingPage />
        ) : (
          <Navigate
            to="/login"
            replace
          />
        ),
      },

      // Controlled routes
      // Accessible with or without a token
      { path: '/composers', element: <ComposersPage /> },
      { path: '/scores', element: <ScoresPage /> },
      { path: '/scores/:id', element: <ScoreSinglePage /> },
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
