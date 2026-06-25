import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/ useAuth';
import { loginService } from '../services/authService';
import type { LoginRequest } from '../../../shared/types/auth';

// Role
// - call the backend
// - check the response
// - update the AuthProvider
// - redirect

export function useLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();

  async function loginUser(payload: LoginRequest) {
    const res = await loginService(payload);

    if (!res.success || !res.data) {
      throw new Error(res.error?.message ?? 'Login failed');
    }

    login(res.data.token, res.data.user);

    navigate('/');
  }

  return {
    loginUser,
  };
}
