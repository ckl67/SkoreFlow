import { useContext } from 'react';
import { DevContext } from '../../dev/DevProvider';

export function useDev() {
  const context = useContext(DevContext);

  // Based on the declaration
  //    const DevContext = createContext<DevContextType | null>(null);
  //  The default value is null;
  // TypeScript knows that `context` could potentially be null.
  // If you try to write `context.lastRegisteredUser` without checking, TypeScript will throw a warning:
  // The `if (!context)` acts as a gatekeeper for TypeScript.
  // Once the code passes this line, TypeScript magically realizes that `context` is no longer null
  // (this is known as type narrowing), and you no longer get any compilation errors.
  if (!context) {
    throw new Error('useDev must be used inside DevProvider');
  }

  return context;
}
