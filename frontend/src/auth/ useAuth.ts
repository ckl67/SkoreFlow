import { useContext } from 'react';
import { AuthContext } from './AuthProvider';

// --------------------------------------------------
// Hook
// --------------------------------------------------
// A secure shortcut for components to access authentication states and actions.
// Instead of manually calling 'useContext(AuthContext)' everywhere, components just call 'useAuth()'.
// The 'if (!ctx)' check acts as a developer safety net, crashing early with a clear message
// if a component tries to access auth data outside the <AuthProvider> tree.
export function useAuth() {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error('useAuth must be used inside provider');
  }

  return ctx;
}
