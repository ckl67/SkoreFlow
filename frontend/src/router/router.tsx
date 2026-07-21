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

export const router = createBrowserRouter([
  {
    element: <MainLayout />,
    children: [
      { path: '/', element: <MainPage /> },
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
      { path: 'register/confirm', element: <RegisterConfirmPage /> },
      { path: '/register/pending', element: <RegisterPendingPage /> },
      {
        element: <ProtectedRoute />, // The goalkeeper
        children: [
          { path: '/me', element: <MePage /> },
          { path: '/composers', element: <ComposersPage /> },
        ],
      },
    ],
  },

  {
    path: '*',
    element: <div>404</div>,
  },
]);
