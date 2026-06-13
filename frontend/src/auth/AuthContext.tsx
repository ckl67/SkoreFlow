import { createContext, useContext, useEffect, useState } from 'react';
import type { UserPublicResponse } from '../../../shared/types/auth';
import { apiRequest } from '../api/client';

// Context handle 3 thinks
// * Global State : user - token - isAuthenticated
// * Actions: login - logout - refreshMe
// * Persistence : localStorage
interface AuthContextType {
  user: UserPublicResponse | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string, user: UserPublicResponse) => void;
  logout: () => void;
  refreshMe: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [user, setUser] = useState<UserPublicResponse | null>(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });

  // --------------------------------------------------
  // LOGIN
  // --------------------------------------------------
  function login(token: string, user: UserPublicResponse) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));

    setToken(token);
    setUser(user);
  }

  // --------------------------------------------------
  // LOGOUT
  // --------------------------------------------------
  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    setToken(null);
    setUser(null);
  }

  // --------------------------------------------------
  // REFRESH /me
  // --------------------------------------------------
  async function refreshMe() {
    if (!token) return;

    const res = await apiRequest<UserPublicResponse>('GET', '/me');

    if (!res.success || !res.data) {
      throw new Error(res.error?.message ?? 'Login failed');
    }

    if (res.data) {
      setUser(res.data);
      localStorage.setItem('user', JSON.stringify(res.data));
    } else {
      logout();
    }
  }

  // --------------------------------------------------
  // AUTO LOAD
  // --------------------------------------------------
  useEffect(() => {
    if (token) {
      refreshMe();
    }
  }, [token]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        login,
        logout,
        refreshMe,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// --------------------------------------------------
// Hook
// --------------------------------------------------
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside provider');
  return ctx;
}
