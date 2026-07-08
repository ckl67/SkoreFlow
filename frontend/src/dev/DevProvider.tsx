import { createContext, useState } from 'react';

export type DevUser = {
  username: string;
  email: string;
  password: string;
};

// Context
type DevContextType = {
  lastRegisteredUser: DevUser | null;
  setLastRegisteredUser: (user: DevUser) => void;
};

// Creates the React Context object.
// It is initialized to null because, on start-up, the application has not yet loaded the system.
export const DevContext = createContext<DevContextType | null>(null);

// --------------------------------------------------------------------------------
// --------------------------------------------------------------------------------
export function DevProvider({ children }: { children: React.ReactNode }) {
  // The use of an arrow function () is known as the ‘Lazy Initial State’.
  // React will read localStorage (which is a slow operation) just once when the application starts,
  // and not every time the component is re-rendered.

  const [lastRegisteredUser, setLastRegisteredUserState] = useState<DevUser | null>(() => {
    const stored = localStorage.getItem('devUser');
    return stored ? JSON.parse(stored) : null;
  });

  // --------------------------------------------------
  // SET LAST REGISTER USER
  // --------------------------------------------------
  function setLastRegisteredUser(user: DevUser) {
    localStorage.setItem('devUser', JSON.stringify(user));
    setLastRegisteredUserState(user);
  }

  // The component returns a special component: <DevContext.Provider>.
  //  value={{ ... }}: This is where we inject all our variables and functions.
  //    They become accessible to any child component, no matter how deeply nested it is within the application.
  //  {children}: Represents the rest of your application.
  //    By wrapping your app in <DevProvider>, your entire app has access to this context.
  return (
    <DevContext.Provider
      value={{
        lastRegisteredUser,
        setLastRegisteredUser,
      }}
    >
      {children}
    </DevContext.Provider>
  );
}
