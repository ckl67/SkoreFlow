import { createBrowserRouter } from 'react-router-dom';
import Login from '../pages/Login';

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
    path: '*',
    element: <div>404 - Page not found</div>,
  },
]);
