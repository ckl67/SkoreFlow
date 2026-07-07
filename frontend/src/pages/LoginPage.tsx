import { useState } from 'react';
import { Link } from 'react-router-dom';
import FormInput from '../components/FormInput';
import SubmitButton from '../components/SubmitButton';
import { useDevFillLogin } from '../hooks/useDevFillLogin';
import type { LoginRequest } from '../../../shared/types/auth';
import { useLogin } from '../hooks/useLogin';

export default function LoginPage() {
  // STATE
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // FOR DEBUG
  useDevFillLogin(setEmail, setPassword);

  // SERVICES
  const { loginUser } = useLogin();

  // HANDLER
  async function handleLogin() {
    const payload: LoginRequest = {
      email,
      password,
    };

    try {
      await loginUser(payload);
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

        {/* 2. On ajoute le lien vers l'inscription ici */}
        <p className="text-sm text-center text-gray-600">
          Don't have an account?{' '}
          <Link to="/register" className="font-medium text-blue-600 hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
