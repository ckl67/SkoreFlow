import { useEffect } from 'react';

import type { RegisterRequest } from '../../../shared/types/auth';

// Hook
type DevFillRegisterEvent = CustomEvent<RegisterRequest>;

export function useDevFillRegister(
  setUsername: (v: string) => void,
  setEmail: (v: string) => void,
  setPassword: (v: string) => void,
) {
  useEffect(() => {
    function handler(event: Event) {
      console.log('Register event received');

      const customEvent = event as DevFillRegisterEvent;
      const { username, email, password } = customEvent.detail;

      setUsername(username);
      setEmail(email);
      setPassword(password);
    }

    window.addEventListener('dev:fill-register', handler);

    return () => {
      window.removeEventListener('dev:fill-register', handler);
    };
  }, [setEmail, setPassword]);
}
