import { useNavigate } from 'react-router-dom';
import { useAuth } from './useAuth';
import { loginService } from '../../services/auth/authService';
import type { LoginRequest } from '../../../../shared/types/auth';
import { logger } from '../../core/logger/logger';
// Role
// - call the backend
// - check the response
// - update the AuthProvider
// - redirect

export function useLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();

  async function loginUser(payload: LoginRequest) {
    try {
      const res = await loginService(payload);
      login(res.token, res.user);
    } catch (error) {
      logger.error('auth', 'Failed loginUser', error);
    }

    navigate('/');
  }

  return {
    loginUser,
  };
}
