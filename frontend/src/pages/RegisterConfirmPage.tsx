import { useEffect, useState } from 'react';
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

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  const token = params.get('token');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      return;
    }

    confirmAccount(token);
  }, [token]);

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
        },
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
    <Link to="/login">Login</Link>;
  }

  if (status === 'error') {
    return <div>Invalid or expired confirmation link.</div>;
  }

  return (
    <div>
      <h1>Account verified</h1>

      <p>Your account has been successfully verified.</p>

      <button onClick={() => navigate('/login')}>Go to Login</button>
    </div>
  );
}
