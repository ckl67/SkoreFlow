import { useEffect } from 'react';

import type { LoginRequest } from '../../../shared/types/auth';

type DevFillLoginEvent = CustomEvent<LoginRequest>;

export function useDevFillLogin(setEmail: (v: string) => void, setPassword: (v: string) => void) {
  useEffect(() => {
    function handler(event: Event) {
      const customEvent = event as DevFillLoginEvent;
      const { email, password } = customEvent.detail;

      setEmail(email);
      setPassword(password);
    }

    window.addEventListener('dev:fill-login', handler);

    return () => {
      window.removeEventListener('dev:fill-login', handler);
    };
  }, [setEmail, setPassword]);
}
