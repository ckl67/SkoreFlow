import { createBrowserRouter } from 'react-router-dom';
import Login from '../pages/Login';
import Me from '../pages/Me';
import Register from '../pages/Register';
import RegisterConfirm from '../pages/RegisterConfirm';
import RegisterResend from '../pages/RegisterResend';
import PasswordForgot from '../pages/PasswordForgot';
import PasswordReset from '../pages/PasswordReset';
import Logout from '../pages/Logout';
import ProtectedRoute from '../pages/ProtectedRoute';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Login />,
  },
  {
    path: '/login',
    element: <Login />,
  },

  {
    path: '/register',
    element: <Register />,
  },

  {
    path: '/register/confirm',
    element: <RegisterConfirm />,
  },

  {
    path: '/register/resend',
    element: <RegisterResend />,
  },

  {
    path: '/password/forgot',
    element: <PasswordForgot />,
  },

  {
    path: '/password/reset',
    element: <PasswordReset />,
  },

  {
    path: '/logout',
    element: <Logout />,
  },
  {
    path: '/me',
    element: (
      <ProtectedRoute>
        <Me />
      </ProtectedRoute>
    ),
  },
  {
    path: '*',
    element: <div>404 - Page not found</div>,
  },
]);
