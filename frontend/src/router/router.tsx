import { createBrowserRouter } from 'react-router-dom';

import MainLayout from '../layouts/MainLayout';

import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import MePage from '../pages/MePage';

import ProtectedRoute from '../components/ProtectedRoute';
import RegisterConfirmPage from '../pages/RegisterConfirmPage';

export const router = createBrowserRouter([
  {
    element: <MainLayout />,
    children: [
      {
        path: '/',
        element: <LoginPage />,
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
