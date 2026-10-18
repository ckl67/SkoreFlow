import { createContext, useState, ReactNode } from 'react';
import { logger } from '../../logger/logger';

type Props = {
  children: ReactNode;
};

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
export function DevProvider({ children }: Props) {
  // The use of an arrow function () is known as the ‘Lazy Initial State’.
  // React will read localStorage (which is a slow operation) just once when the application starts,
  // and not every time the component is re-rendered.

  logger.debug('dev', 'DevProvider Start');

  const [lastRegisteredUser, setLastRegisteredUserState] =
    useState<DevUser | null>(() => {
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

  // "value" is a generic react terminology used by Provider to pass the variable value to the children
  // value={{ ... }}: This is where we inject all variables and functions.
  // Value become accessible to any child component, no matter how deeply nested it is within the application.
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
