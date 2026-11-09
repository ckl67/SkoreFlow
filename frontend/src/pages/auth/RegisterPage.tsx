import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { registerService } from '../../services/auth/authService';
import FormInput from '../../components/forms/FormInput';
import SubmitButton from '../../components/forms/SubmitButton';
import { useDevFillRegister } from '../../hooks/dev/useDevFillRegister';

import type { RegisterRequest } from '../../../../shared/types/auth';

export default function Register() {
  // 1. STATE
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  useDevFillRegister(setUsername, setEmail, setPassword);

  // 2. SERVICES
  // useNavigate is a hook which returns the function for navigating
  const navigate = useNavigate();

  // 3. HANDLERS
  async function handleRegister() {
    const payload: RegisterRequest = {
      username,
      email,
      password,
    };

    try {
      const res = await registerService(payload);

      console.log('Register :', res);

      navigate('/register/pending', {
        state: { email },
      });

      alert(res.message);
    } catch (err) {
      if (err instanceof Error) {
        alert(err.message);
      } else {
        alert('Unknown error');
      }
    }
  }

  // 4. RENDER
  return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <div className="w-full max-w-md bg-white border rounded-xl shadow-sm p-6 space-y-6">
        {/* HEADER */}
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-semibold">Register</h1>
          <p className="text-sm text-gray-500">Register a SkoreFlow account</p>
        </div>

        <FormInput
          label="Username"
          value={username}
          onChange={setUsername}
          placeholder="your name"
        />
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
        />
        <SubmitButton
          label="Register"
          onClick={handleRegister}
        />
      </div>
    </div>
  );
}
