import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { apiRequest } from '../api/client';

import type {
  ConfirmRegistrationRequest,
  ConfirmRegistrationResponse,
} from '../../../shared/types/auth';

export default function RegisterConfirmPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  // When the user arrives on the page, `status` is immediately set to 'loading'.
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  const token = params.get('token');

  const hasConfirmed = useRef(false);

  // ----------------

  useEffect(() => {
    console.log('Calling confirmRegistration');

    if (!token) {
      setStatus('error');
      return;
    }
    // Standard protection for effects that should only run once per session.
    // Even if React runs the effect twice during development, only one POST request will be sent.
    if (hasConfirmed.current) {
      return;
    }
    hasConfirmed.current = true;
    confirmAccount(token);
  }, [token]);

  // ----------------

  async function confirmAccount(token: string) {
    try {
      const payload: ConfirmRegistrationRequest = {
        token,
      };

      const res = await apiRequest<ConfirmRegistrationResponse, ConfirmRegistrationRequest>(
        'POST',
        '/auth/register/confirm',
        {
          data: payload,
        }
      );

      if (!res.success || !res.data) {
        throw new Error(res.error?.message);
      }

      setStatus('success');
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  }

  if (status === 'loading') {
    return <div>Confirming your account...</div>;
  }

  if (status === 'error') {
    return (
      <div>
        This confirmation link is invalid, has expired, or has already been used.
        <br>
          If you haven't activated your account yet, you can request a new confirmation email..
        </br>
      </div>
    );
  }

  return (
    <div>
      <h1>Account verified</h1>

      <p>Your account has been successfully verified.</p>

      <button onClick={() => navigate('/login')}>Go to Login</button>
    </div>
  );
}
