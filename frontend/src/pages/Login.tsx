import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { apiRequest } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import type { LoginRequest, LoginResponse } from '../../../shared/types/auth';

export default function Login() {
  // State
  const [email, setEmail] = useState('user1@test.com');
  const [password, setPassword] = useState('password123');

  const navigate = useNavigate();

  // Get property  of login from useAuth --> Like
  // const auth = useAuth();
  // const login = auth.login;
  const { login } = useAuth();

  // Handler
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

      navigate('/me');
    } catch (err) {
      console.error(err);
      alert('Login failed');
    }
  }

  // Render
  return (
    <div style={{ padding: 20 }}>
      <h1>Login</h1>

      <input value={email} onChange={(e) => setEmail(e.target.value)} />
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />

      <button onClick={handleLogin}>Login</button>
    </div>
  );
}
