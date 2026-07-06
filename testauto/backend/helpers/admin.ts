// --------------------------------------------------------------------------------
// HELPERS
// --------------------------------------------------------------------------------

import { request } from './api.js';
import { API_URL } from '../config.js';

import { AdminCreateUserRequest, AdminCreateUserResponse } from '../../../shared/types/admin';
import { AdminGetUsersPageRequest, AdminGetUsersPageResponse } from '../../../shared/types/admin';
import { AdminGetUserResponse } from '../../../shared/types/admin';
import { AdminUpdateUserRequest, AdminUpdateUserResponse } from '../../../shared/types/admin';
import { AdminDeleteUserResponse } from '../../../shared/types/admin';

// --------------------------------------------------------------------------------
// Create User
// Usage in Vitest
// const res = await AdminCreateUser(...)
// --------------------------------------------------------------------------------
async function adminCreateUser(
  { username, email, password }: AdminCreateUserRequest,
  token: string
) {
  if (!username || !email || !password) {
    throw new Error('email and password are required');
  }

  const res = await request<AdminCreateUserResponse>('POST', `${API_URL}/admin/users`, {
    token,
    data: {
      username: username,
      email: email,
      password: password,
    },
  });

  console.log('\n Admin User response:', res.status, res.data);

  return res;
}

// --------------------------------------------------------------------------------
// AdminGetUsersPage
// --------------------------------------------------------------------------------
//  {}, parameter optional --> Must be placed at the second rang
// const res = await adminGetUsersPage(TOKEN_ADMIN);
// Or {}, parameter optional --> first rang
//
async function adminGetUsersPage(
  { page = 1, limit = 10, sort = 'id asc' }: AdminGetUsersPageRequest = {},
  token: string
) {
  const params = new URLSearchParams();

  if (page !== undefined) params.append('page', String(page));
  if (limit !== undefined) params.append('limit', String(limit));
  if (sort) params.append('sort', sort);

  const url =
    params.toString().length > 0
      ? `${API_URL}/admin/users?${params.toString()}`
      : `${API_URL}/admin/users`;

  const res = await request<AdminGetUsersPageResponse>('GET', url, {
    token,
  });

  console.log('\n Admin Get Users Page response:', res.status);
  console.log(JSON.stringify(res.data, null, 2));

  return res;
}

// --------------------------------------------------------------------------------

async function adminGetUser(userId: number, token: string) {
  const res = await request<AdminGetUserResponse>('GET', `${API_URL}/admin/users/${userId}`, {
    token,
  });

  console.log('\n Admin User response:', res.status, res.data);
  return res;
}

// --------------------------------------------------------------------------------
// Admin Update User
// --------------------------------------------------------------------------------

async function adminUpdateUser(data: AdminUpdateUserRequest, userId: number, token: string) {
  if (!userId) {
    throw new Error('userId is required');
  }

  console.log('AdminUpdateUserRequest: Input Data', {
    data,
    token,
  });

  const res = await request<AdminUpdateUserResponse>('PUT', `${API_URL}/admin/users/${userId}`, {
    token: token,
    data: data,
  });

  console.log('\n Update :', res.status, res.data);

  return res;
}

// --------------------------------------------------------------------------------
// Admin Delete User
// --------------------------------------------------------------------------------

async function adminDeleteUser(userId: number, token: string) {
  if (!userId) {
    throw new Error('userId is required');
  }

  const res = await request<AdminDeleteUserResponse>('DELETE', `${API_URL}/admin/users/${userId}`, {
    token: token,
  });

  console.log('\n Update :', res.status, res.data);

  return res;
}

// --------------------------------------------------------------------------------
// EXPORT (ESM)
// --------------------------------------------------------------------------------

export { adminCreateUser, adminGetUsersPage, adminGetUser, adminUpdateUser, adminDeleteUser };
