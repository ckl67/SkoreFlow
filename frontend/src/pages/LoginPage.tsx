import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { apiRequest } from '../api/client';
import { useAuth } from '../auth/AuthProvider';

import FormInput from '../components/FormInput';
import SubmitButton from '../components/SubmitButton';

import { useDevFillLogin } from '../hooks/useDevFillLogin';

import type { LoginRequest, LoginResponse } from '../../../shared/types/auth';

export default function LoginPage() {
  // STATE
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // FOR DEBUG
  useDevFillLogin(setEmail, setPassword);

  // SERVICES
  const navigate = useNavigate();
  const { login } = useAuth();

  // HANDLER
  async function handleLogin() {
    const payload: LoginRequest = {
      email,
      password,
    };

    try {
      const res = await apiRequest<LoginResponse, LoginRequest>('POST', '/login', {
        data: payload,
      });

      if (!res.success || !res.data) {
        throw new Error(res.error?.message ?? 'Login failed');
      }

      // auth context
      login(res.data.token, res.data.user);

      // redirect
      navigate('/me');
    } catch (err) {
      console.error(err);
      alert('Login failed');
    }
  }

  // RENDER
  // Option 1
  //      <input type="text" onChange={(e) => onChange(e.target.value)} />
  // Option 2
  //      function onChangefct(e) {
  //          onChange(e.target.value);
  //        }
  //  <input type="text" onChange={onChangefct} />;
  //  function onChangefct(e) {
  //    onChange(e.target.value);
  //  }

  return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <div className="w-full max-w-md bg-white border rounded-xl shadow-sm p-6 space-y-6">
        {/* HEADER */}
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-semibold">Login</h1>
          <p className="text-sm text-gray-500">Sign in to your SkoreFlow account</p>
        </div>

        {/* FORM */}
        <div className="space-y-4">
          <FormInput
            label="Email"
            value={email}
            onChange={setEmail}
            placeholder="you@example.com"
          />

          <FormInput
            label="Password"
            type="password"
            value={password}
            onChange={setPassword}
            placeholder="••••••••"
          />
        </div>

        {/* ACTION */}
        <SubmitButton label="Login" onClick={handleLogin} />
      </div>
    </div>
  );
}
