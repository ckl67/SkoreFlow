// --------------------------------------------------------------------------------
// HELPERS
// Even file is api.ts
// 👉 TypeScript compile in .js, Node needs final extension

// --------------------------------------------------------------------------------

import { request } from './api.js';
import { API_URL } from '../config.js';

// --------------------------------------------------------------------------------
// TYPES
// --------------------------------------------------------------------------------

interface RegisterRequestOptions {
  username: string;
  email: string;
  password: string;
}

// token should never be returned !!
// Here only for test
// we could have let optional with
//   token?: string;
// Nevertheless this would force to test !
//    const payload = resRegister.data.data;
//    if (!payload?.token) {
//      throw new Error('Login response missing token');
//    }
//    const token = payload.token;

interface RegisterResponse {
  message: string;
  user_id: number; // Not really necessary
  isVerified: boolean;
  token: string; // Only for test
}

// -------------------

interface ConfirmRegistrationRequest {
  token: string;
}

interface ConfirmRegistrationResponse {
  message: string;
  user_id: number;
  isVerified: boolean;
}

// -------------------

interface ResendConfirmRegistrationRequest {
  email: string;
}

interface ResendConfirmRegistrationResponse {
  message: string;
  token: string; // Only for test
}

// -------------------

interface User {
  id: number;
  username: string;
  email: string;
  avatar: string;
  role: number;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  token: string;
}

interface LoginResponse {
  token: string;
  user: User;
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

async function login(email: string, password: string) {
  const res = await request<LoginResponse>('POST', `${API_URL}/login`, {
    data: {
      email: email,
      password: password,
    },
  });

  // This version accept all 2xx and not only 200
  if (res.status < 200 || res.status >= 300) {
    throw new Error(`Login failed (${res.status}) - ${JSON.stringify(res.data)}`);
  }

  // const data = res.data as LoginResponse not necessary because already typed with request<LoginResponse>
  if (!res.data.data?.token) {
    throw new Error('Login response missing token');
  }

  return res.data.data.token;
}

// --------------------------------------------------------------------------------
// Register User
// --------------------------------------------------------------------------------
async function registerUser(data: RegisterRequestOptions) {
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
// Resend Confirm Registration
// --------------------------------------------------------------------------------
async function ResendConfirmRegistration(data: ResendConfirmRegistrationRequest) {
  const res = await request<ResendConfirmRegistrationResponse>(
    'POST',
    `${API_URL}/auth/register/resend`,
    {
      data,
    },
  );

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

export { registerUser, confirmRegistration, ResendConfirmRegistration, expireToken, login };
