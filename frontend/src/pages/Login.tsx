import { useState } from 'react';
import { apiRequest } from '../api/client';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import type { LoginRequest, LoginResponse } from '../types/user';

export default function Login() {
  const [email, setEmail] = useState('user1@test.com');
  const [password, setPassword] = useState('password123');

  const navigate = useNavigate();
  const { login } = useAuth();

  async function handleLogin() {
    try {
      const res = await apiRequest<LoginResponse, LoginRequest>('POST', '/login', {
        data: {
          email,
          password,
        },
      });

      const payload = res.data.data;

      if (!payload) {
        throw new Error('Login failed');
      }

      login(payload.token, payload.user);

      navigate('/me');
    } catch (err) {
      console.error(err);
      alert('Login failed');
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Login</h1>

      <input value={email} onChange={(e) => setEmail(e.target.value)} />
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />

      <button onClick={handleLogin}>Login</button>
    </div>
  );
}
