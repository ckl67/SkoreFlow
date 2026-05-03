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

interface User {
  id: number;
  username: string;
  email: string;
  avatar: string;
  role: number;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
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
  if (!res.data?.token) {
    throw new Error('Login response missing token');
  }

  return res.data.token;
}

export { login };
