import { createContext, useContext, useEffect, useState } from 'react';
import type { UserPublicResponse } from '../../../shared/types/auth';
import type { ProfileUserResponse } from '../../../shared/types/user';

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

// --------------------------------------------------------------------------------
// Note for SkoreFlow Architecture:
// Even though this is declared as a standard JavaScript function, the Capital letter 'A'
// turns it into a React Component.
// When used as a JSX tag (<AuthProvider>...</AuthProvider>),
// React automatically takes everything nested inside it and passes
// it as the 'children' argument.
// --------------------------------------------------------------------------------
// The left-hand side { children }:
//  This is pure JavaScript.
//  We’re telling the function: “You’ll receive an object (the React properties/props),
//  and I want you to extract the children variable from it”.
//
// The right-hand side: { children: React.ReactNode }:
//  This is TypeScript.
//  We add a safety check by saying:
//  “Please note, I’m specifying that this `children` must be of type `React.ReactNode`”.
//
// React don't need that we clarify the output, it is deduced via the return
//
// --------------------------------------------------------------------------------
export function AuthProvider({ children }: { children: React.ReactNode }) {
  //Init value : Lazy Initial State : through () => : only once during initialization
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
  // Sends the current token to the Go backend via the '/me' endpoint.
  // This serves two purposes:
  // 1. Verifies if the session/token is still valid on the server.
  // 2. Fetches the latest user profile data to sync the frontend state.
  // If the server rejects the token, it automatically triggers a logout.
  // --------------------------------------------------
  async function refreshMe() {
    if (!token) return;

    const res = await apiRequest<ProfileUserResponse>('GET', '/me');

    console.log('refreshMe :', res);

    if (!res.success || !res.data) {
      throw new Error(res.error?.message ?? 'Login failed');
    }

    if (res.data) {
      setUser(res.data.user);
      localStorage.setItem('user', JSON.stringify(res.data));
    } else {
      logout();
    }
  }

  // --------------------------------------------------
  // AUTO LOAD
  // --------------------------------------------------
  // Automatically validates the session on startup or when the token changes.
  // By depending only on '[token]', we ensure 'refreshMe()' runs safely
  // and prevent infinite re-render loops when 'user' state is updated
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
// A secure shortcut for components to access authentication states and actions.
// Instead of manually calling 'useContext(AuthContext)' everywhere, components just call 'useAuth()'.
// The 'if (!ctx)' check acts as a developer safety net, crashing early with a clear message
// if a component tries to access auth data outside the <AuthProvider> tree.
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside provider');
  return ctx;
}
