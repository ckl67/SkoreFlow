import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/auth/useAuth';

// We use the second main approach to managing protected routes specific to React Router.
// Instead of using React’s native mechanism (children), we are using React Router’s own nested routes mechanism.
// <Outlet/> acts like a dynamic window.
// This component tells React Router: "If the user is logged in, display the current child route right here."
// ProtectedRoute
//       |
//    Outlet
//       |
//       +--- MePage
//       +--- ComposersPage

export default function ProtectedRoute() {
  const { isAuthenticated } = useAuth();

  console.log('ProtectedRoute:', {
    isAuthenticated,
  });

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
