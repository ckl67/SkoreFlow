import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { apiRequest } from '../api/client';

import FormInput from '../components/FormInput';
import SubmitButton from '../components/SubmitButton';
import { useDevFillRegister } from '../dev/useDevFillRegister';

import type { RegisterRequest, RegisterResponse } from '../../../shared/types/auth';

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
      const res = await apiRequest<RegisterResponse, RegisterRequest>('POST', '/auth/register', {
        data: payload,
      });

      console.log('Register :', res);

      navigate('/register/pending', {
        state: { email },
      });

      if (!res.success || !res.data) {
        alert(res.error!.message);
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

  // 4. RENDER
  return (
    <div style={{ maxWidth: 400 }}>
      <h1>Register</h1>

      <SubmitButton label="Register" onClick={handleRegister} />
    </div>
  );
}
