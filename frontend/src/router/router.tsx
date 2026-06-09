import { createBrowserRouter } from 'react-router-dom';
import Login from '../pages/Login';
import Me from '../pages/Me';
import ProtectedRoute from './ProtectedRoute';

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
