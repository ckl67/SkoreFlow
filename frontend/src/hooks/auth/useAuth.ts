import { useContext } from 'react';
import { AuthContext } from '../../auth/AuthProvider';

// --------------------------------------------------
// Hook
// --------------------------------------------------
// A secure shortcut for components to access authentication states and actions.
// Instead of manually calling 'useContext(AuthContext)' everywhere, components just call 'useAuth()'.
// The 'if (!ctx)' check acts as a developer safety net, crashing early with a clear message
// if a component tries to access auth data outside the <AuthProvider> tree.
// 1. Safety
//  In React, if you try to use a context in a component that isn’t nested within its <AuthProvider>,
//  useContext won’t throw an error: By using useContext(AuthContext) directly it will simply
//  return the default value of the context, which in this case is null.
//  --> With the hook, the app crashes immediately when `useAuth()` is called, but with a clear error message:
//    "useAuth must be used inside provider".
// 2. Convenience in TypeScript
//  Since your context is initialized to null (createContext<AuthContextType null |>(null)),
//  TypeScript will require you to check that it is not null every time you use it in a component.
//      const auth = useContext(AuthContext);
//      // TypeScript will complain here if you don’t carry out a check:
//      if (auth) {
//          console.log(auth.user);
//      }
//  With the Hook, we can use
//   const { login } = useAuth();
// 3. Code cleanliness
//  const auth = useAuth(); // Shorter, more expressive

export function useAuth() {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error('useAuth must be used inside provider');
  }

  return ctx;
}
