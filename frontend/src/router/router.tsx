import { createBrowserRouter } from 'react-router-dom';

import MainLayout from '../layouts/MainLayout';

import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import MePage from '../pages/MePage';
import RegisterPendingPage from '../pages/RegisterPendingPage';

import ProtectedRoute from '../components/ProtectedRoute';
import RegisterConfirmPage from '../pages/RegisterConfirmPage';
import MainPage from '../pages/MainPage';

export const router = createBrowserRouter([
  {
    element: <MainLayout />,
    children: [
      {
        path: '/',
        element: <MainPage />,
      },
      {
        path: '/login',
        element: <LoginPage />,
      },
      {
        path: '/register',
        element: <RegisterPage />,
      },
      {
        path: 'register/confirm',
        element: <RegisterConfirmPage />,
      },
      {
        path: '/register/pending',
        element: <RegisterPendingPage />,
      },
      {
        path: '/me',
        element: (
          <ProtectedRoute>
            <MePage />
          </ProtectedRoute>
        ),
      },
    ],
  },

  {
    path: '*',
    element: <div>404</div>,
  },
]);
