// --------------------------------------------------------------------------------
// HELPERS
// --------------------------------------------------------------------------------

import { request } from './api.js';
import { API_URL } from '../config.js';

// --------------------------------------------------------------------------------
// TYPES
// --------------------------------------------------------------------------------

interface ResetTokenResponse {
  token: string;
}

// --------------------------------------------------------------------------------
// getResetToken
// THIS SERVICE CAN ONLY BE USED FOR TEST PERSPECTIVE !!
// --------------------------------------------------------------------------------
// Fetch reset token from admin test endpoint
// → Throws an error if token is missing or invalid
// → Caller is responsible for handling the failure (try/catch or process exit)

// --------------------------------------------------------------------------------
async function getResetToken(email: string, adminToken: string) {
  const res = await request<ResetTokenResponse>('GET', `${API_URL}/test/reset-token/${email}`, {
    token: adminToken,
  });

  if (!res.data?.token) {
    throw new Error('Reset token not found');
  }

  return res.data.token;
}

// --------------------------------------------------------------------------------
// EXPORT (ESM)
// --------------------------------------------------------------------------------
export { getResetToken };
