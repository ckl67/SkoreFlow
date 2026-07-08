import { createContext, useEffect, useState } from 'react';
import type { UserPublicResponse } from '../../../shared/types/user';
import type { ProfileUserResponse } from '../../../shared/types/user';
import { apiRequest } from '../api/client';

// Context handle 3 thinks
// * Global State : user - token - isAuthenticated
// * Actions: login - logout - refreshMe
// * Persistence : localStorage
type AuthContextType = {
  user: UserPublicResponse | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string, user: UserPublicResponse) => void;
  logout: () => void;
  refreshMe: () => Promise<void>;
};

// Creates the React Context object.
// It is initialized to null because, on start-up, the application has not yet loaded the system.
export const AuthContext = createContext<AuthContextType | null>(null);

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
  // Within the AuthProvider component, the code retrieves the login details:
  // The use of an arrow function () => localStorage.getItem(...) is known as the ‘Lazy Initial State’.
  // React will read localStorage (which is a slow operation) just once when the application starts,
  // and not every time the component is re-rendered.
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('token');
  });
  const [user, setUser] = useState<UserPublicResponse | null>(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });

  // --------------------------------------------------
  // LOGIN
  // --------------------------------------------------
  // When the user successfully logs in
  // We store the token and the user in the browser’s local storage so that they are remembered the next time the app is launched.
  // We update the React states (setToken, setUser) so that the entire application refreshes instantly
  // (for example, displaying the ‘My Profile’ button).
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
  // This is the exact opposite of the login process.
  // We clear localStorage and reset the React state to null to log the user out.
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
      localStorage.setItem('user', JSON.stringify(res.data.user));
    } else {
      logout();
    }
  }

  // --------------------------------------------------
  // AUTO LOAD
  // --------------------------------------------------
  // As soon as the application starts, this hook runs.
  // If it finds a token in localStorage (retrieved in step 2),
  //      const [token, setToken] = useState<string | null>(() => {
  //        return localStorage.getItem('token');
  //      });
  // it immediately calls refreshMe() to validate the session with the server.
  // Specifying only [token] as a dependency prevents the application
  // from entering an infinite loop when the user changes.
  // Automatically validates the session on startup or when the token changes.
  // By depending only on '[token]', we ensure 'refreshMe()' runs safely
  // and prevent infinite re-render loops when 'user' state is updated
  // --------------------------------------------------

  useEffect(() => {
    if (token) {
      refreshMe();
    }
  }, [token]);

  // The component returns a special component: <AuthContext.Provider>.
  //  value={{ ... }}: This is where we inject all our variables and functions.
  //    They become accessible to any child component, no matter how deeply nested it is within the application.
  //  isAuthenticated: !!token:
  //    The !! operator converts the token (which is a string or null) into a Boolean value (true or false).
  //  {children}: Represents the rest of your application.
  //    By wrapping your app in <AuthProvider>, your entire app has access to this context.
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
