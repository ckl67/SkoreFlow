import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { apiRequest } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import type { LoginRequest, LoginResponse } from '../../../shared/types/auth';

export default function Login() {
  // 1. STATE
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // 2. SERVICES
  // useNavigate is a hook which returns the function for navigating
  const navigateTo = useNavigate();

  // Get login from useAuth - idem as const { login } = useAuth();
  const auth = useAuth();
  const login = auth.login;

  // 3. HANDLERS
  async function handleLogin() {
    try {
      const res = await apiRequest<LoginResponse, LoginRequest>('POST', '/login', {
        data: {
          email,
          password,
        },
      });

      if (!res.success || !res.data) {
        throw new Error(res.error?.message ?? 'Login failed');
      }

      login(res.data.token, res.data.user);

      navigateTo('/me');
    } catch (err) {
      console.error(err);
      alert('Login failed');
    }
  }

  // 4. RENDER
  return (
    <div style={{ padding: 20 }}>
      <h1>Login</h1>

      <input value={email} onChange={(e) => setEmail(e.target.value)} />
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />

      <button onClick={handleLogin}>Login</button>
    </div>
  );
}
