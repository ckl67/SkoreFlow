import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';

import type { ReactNode } from 'react';

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();

  console.log('ProtectedRoute:', {
    isAuthenticated,
  });
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
