import { useState } from 'react';
import { apiRequest } from '../api/client';
import { useNavigate } from 'react-router-dom';
import type { LoginRequest, LoginResponse } from '../api/types';

export default function Login() {
  const [email, setEmail] = useState('user1@test.com');
  const [password, setPassword] = useState('password123');
  const navigate = useNavigate();

  async function handleLogin() {
    try {
      const res = await apiRequest<LoginResponse, LoginRequest>('POST', '/login', {
        email,
        password,
      });

      const token = res.data!.token;
      const user = res.data!.user;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

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
