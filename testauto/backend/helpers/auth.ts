// --------------------------------------------------------------------------------
// HELPERS
// Even file is api.ts
// 👉 TypeScript compile in .js, Node needs final extension

// --------------------------------------------------------------------------------

import { request } from './api.js';
import { API_URL } from '../config.js';
import { RegisterRequest, RegisterResponse } from '../../../shared/types/auth.js';
import { LoginRequest, LoginResponse } from '../../../shared/types/auth.js';

import {
  ConfirmRegistrationRequest,
  ConfirmRegistrationResponse,
} from '../../../shared/types/auth.js';

// --------------------------------------------------------------------------------
// TYPES
// --------------------------------------------------------------------------------

// -------------------

interface ResendRegistrationRequest {
  email: string;
}

interface ResendRegistrationResponse {
  message: string;
  token: string; // Only for test
}

// -------------------

// -------------------

interface LogoutResponse {
  message: string;
}
// -------------------

interface ForgotPasswordRequest {
  email: string;
}

interface ForgotPasswordResponse {
  message: string;
  token: string; // Only for test
}

// -------------------

interface ResetPasswordRequest {
  token: string;
  password: string;
}

interface ResetPasswordResponse {
  message: string;
  id: number;
}

// -------------------

interface ConfirmUpdateMailRequest {
  token: string;
}

interface ConfirmUpdateMailResponse {
  message: string;
  id: number;
}

// --------------------------------------------------------------------------------
// login(email, password)
// --------------------------------------------------------------------------------
//
// → Sends a POST request to the /login endpoint using the request helper
// → Expects a JSON response containing a token
//
// Behavior:
// → If the HTTP status is not 200, throws an Error
//   → this stops the function execution immediately
//   → and returns a rejected Promise
//
// → If successful, returns the authentication token
//
// Error handling:
// → The caller must handle the error using try/catch or .catch()
// → Otherwise, the error will propagate and may crash the process
// --------------------------------------------------------------------------------

// --------------------------------------------------------------------------------
// login
// Normally written
// data: { "email": email, "password": password },
// But equivalent in javascript as
// data: { email: email, password: password },
// Can be simplified :
// in JavaScript moderne (ES6) Property Shorthand.
// data: { email, password },
// --------------------------------------------------------------------------------

async function login({ email, password }: LoginRequest) {
  const res = await request<LoginResponse>('POST', `${API_URL}/login`, {
    data: {
      email: email,
      password: password,
    },
  });

  console.log('\n Login User response:', res.status, res.data);
  return res;
}

// --------------------------------------------------------------------------------
// Logout
// Real Logout will be done on the frontend via : localStorage.removeItem("token");
// Login time will expire after x hours, meaning user has to be login again : Time is configured in file token.go
// --------------------------------------------------------------------------------
async function logout() {
  const res = await request<LogoutResponse>('POST', `${API_URL}/logout`, {});

  return res;
}

// --------------------------------------------------------------------------------
// Register
// --------------------------------------------------------------------------------
async function register(data: RegisterRequest) {
  // TypeScript exists only on compilation, it is a security to keep this check
  if (!data.username || !data.email || !data.password) {
    throw new Error('Missing required fields: username, email, password');
  }

  const res = await request<RegisterResponse>('POST', `${API_URL}/auth/register`, {
    data,
  });

  console.log('\n Register User response:', res.status, res.data);

  return res;
}

// --------------------------------------------------------------------------------
// Confirm Registration
// --------------------------------------------------------------------------------
async function confirmRegistration(data: ConfirmRegistrationRequest) {
  const res = await request<ConfirmRegistrationResponse>(
    'POST',
    `${API_URL}/auth/register/confirm`,
    {
      data,
    },
  );

  console.log('\n Confirm Registration response:', res.status, res.data);

  return res;
}

// --------------------------------------------------------------------------------
// Resend Registration
// --------------------------------------------------------------------------------
async function ResendRegistration(data: ResendRegistrationRequest) {
  const res = await request<ResendRegistrationResponse>('POST', `${API_URL}/auth/register/resend`, {
    data,
  });

  console.log('\n Resend a Confirm Registration mail :', res.status, res.data);

  return res;
}

// --------------------------------------------------------------------------------
// Set Expire token time
// --------------------------------------------------------------------------------
async function expireToken(email: string, token: string) {
  const res = await request('POST', `${API_URL}/test/expire-token`, {
    token,
    data: { email },
  });

  console.log('\n Set Expire Time Token :', res.status, res.data);

  return res;
}

// --------------------------------------------------------------------------------
// Forgot Password
// --------------------------------------------------------------------------------
async function ForgotPassword(data: ForgotPasswordRequest) {
  const res = await request<ForgotPasswordResponse>('POST', `${API_URL}/password/forgot`, {
    data,
  });

  console.log('\n Forgot Password for mail :', res.status, res.data);

  return res;
}

// --------------------------------------------------------------------------------
// Forgot Password
// --------------------------------------------------------------------------------
async function ResetPassword(data: ResetPasswordRequest) {
  const res = await request<ResetPasswordResponse>('POST', `${API_URL}/password/reset`, {
    data,
  });

  console.log('\n ResetPassword Password :', res.status, res.data);

  return res;
}

// --------------------------------------------------------------------------------
// Confirm UpdateMail
// --------------------------------------------------------------------------------
async function confirmUpdateMail(data: ConfirmUpdateMailRequest) {
  console.log('CONFIRM UPDATE MAIL', {
    data,
  });

  const res = await request<ConfirmUpdateMailResponse>('POST', `${API_URL}/me/mail/confirm`, {
    data,
  });

  console.log('\n Confirm UpdateMail response:', res.status, res.data);

  return res;
}

export {
  register,
  confirmRegistration,
  ResendRegistration,
  expireToken,
  login,
  ForgotPassword,
  ResetPassword,
  logout,
  confirmUpdateMail,
};
