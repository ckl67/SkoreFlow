import { useState } from 'react';
import { apiRequest } from '../api/client';
import type { RegisterRequest, RegisterResponse } from '../../../shared/types/auth';

export default function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  async function handleRegister() {
    const payload: RegisterRequest = {
      username,
      email,
      password,
    };

    try {
      const res = await apiRequest<RegisterResponse, RegisterRequest>('POST', '/auth/register', {
        data: payload,
      });

      console.log('Register :', res);
      if (!res.success || !res.data) {
        throw new Error(res.error?.message ?? 'Register failed');
      }

      alert(res.data.message);
    } catch (err) {
      if (err instanceof Error) {
        alert(err.message);
      } else {
        alert('Unknown error');
      }
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Register</h1>

      <input
        placeholder="username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />

      <input placeholder="email" value={email} onChange={(e) => setEmail(e.target.value)} />

      <input
        type="password"
        placeholder="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button onClick={handleRegister}>Register</button>
    </div>
  );
}
