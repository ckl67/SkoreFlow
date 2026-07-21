import { apiRequest } from '../../api/client';

import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
} from '../../../../shared/types/auth';

import type {
  ConfirmRegistrationRequest,
  ConfirmRegistrationResponse,
} from '../../../../shared/types/auth';

// LOGIN
export async function loginService(payload: LoginRequest) {
  return apiRequest<LoginResponse, LoginRequest>('POST', '/login', {
    data: payload,
  });
}

// REGISTER
export async function registerService(payload: RegisterRequest) {
  return apiRequest<RegisterResponse, RegisterRequest>('POST', '/auth/register', {
    data: payload,
  });
}

export async function confirmRegistrationService(payload: ConfirmRegistrationRequest) {
  return apiRequest<ConfirmRegistrationResponse, ConfirmRegistrationRequest>(
    'POST',
    '/auth/register/confirm',
    {
      data: payload,
    }
  );
}
