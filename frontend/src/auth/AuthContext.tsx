import { createContext, useContext, useEffect, useState } from 'react';
import { apiRequest } from '../api/client';
import type { UserPublicResponse } from '../types/user';

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
  const [user, setUser] = useState<UserPublicResponse | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));

  // --------------------------------------------------
  // LOGIN (after /login)
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
  // REFRESH /ME
  // --------------------------------------------------
  async function refreshMe() {
    if (!token) return;

    const res = await apiRequest<{ user: UserPublicResponse }>('GET', '/me');

    if (res.data.success && res.data.data) {
      setUser(res.data.data.user);
      localStorage.setItem('user', JSON.stringify(res.data.data.user));
    } else {
      logout();
    }
  }

  // --------------------------------------------------
  // AUTO LOAD at start
  // --------------------------------------------------
  useEffect(() => {
    const storedUser = localStorage.getItem('user');

    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    if (token) {
      refreshMe();
    }
  }, [token]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
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
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
}
