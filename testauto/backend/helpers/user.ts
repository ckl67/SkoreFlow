// --------------------------------------------------------------------------------
// HELPERS
// --------------------------------------------------------------------------------

import { request } from './api.js';
import { createReadStream } from 'node:fs';
import FormData from 'form-data';

import { API_URL } from '../config.js';
import { PaginatedResponse } from './paginate.js';
// --------------------------------------------------------------------------------
// createUser
// --------------------------------------------------------------------------------
// Function: createUser
//  → Sends a POST request to the /admin/createuser endpoint using the request helper
//  → Expects a 201 Created response on success
//
//  Go Form
// 	  Username string `json:"username" binding:"omitempty,min=3,max=100"`
//	  Email    string `json:"email" form:"email" binding:"required,email"`
//	  Password string `json:"password" binding:"required,min=8,max=100"`

//  Example call:
//    await createUser({
//      email: "newuser@example.com",
//      password: "password123"}
//      TOKEN_ADMIN
//    );
// --------------------------------------------------------------------------------

// --------------------------------------------------------------------------------
// TYPES
// --------------------------------------------------------------------------------
interface RequestOptions {
  email?: string;
  username?: string;
  password?: string;
  role?: number;
  isVerified?: boolean;
}

// Sent back from the api
interface User {
  id: number;
  username: string;
  email: string;
  avatar?: string;
  role?: number;
  isVerified: boolean;
}

interface GetUsersPageOptions {
  page?: number;
  limit?: number;
  sort?: string;
}

// --------------------------------------------------------------------------------
// Create User
// Usage in Vitest
// const res = await createUser(...)
//      expect(res.status).toBe(201)
//      expect(res.data.email).toBe(...)
// --------------------------------------------------------------------------------
async function createUser({ email, password }: RequestOptions, token: string) {
  if (!email || !password) {
    throw new Error('email and password are required');
  }

  const username = email.split('@')[0];

  //console.log(`\n Creating User: ${username} (${email})`);

  const res = await request<User>('POST', `${API_URL}/admin/createuser`, {
    token,
    data: {
      username: username,
      email: email,
      password: password,
    },
  });

  return res;
}

// --------------------------------------------------------------------------------
// updateUser
// --------------------------------------------------------------------------------
//  → Sends a PUT request to the /admin/users/:id endpoint using the request helper
//  → Expects a 200 OK response on success
//
//  Go Form
//	  Username   *string `json:"username" binding:"omitempty,min=3,max=100"`
//		Password   *string `json:"password" binding:"omitempty,min=8,max=100"`
//		Role       *int    `json:"role"`
//		IsVerified *bool   `json:"isVerified"`
//
// --------------------------------------------------------------------------------

async function updateUser(
  userId: number,
  { username, password, role, isVerified }: RequestOptions,
  token: string,
) {
  console.log(`\n updateUser User: ${username} `);

  const res = await request<User>('PUT', `${API_URL}/admin/users/${userId}`, {
    token,
    data: {
      username: username,
      password: password,
      role: role,
      isVerified: isVerified,
    },
  });

  return res;
}

// --------------------------------------------------------------------------------
// getUserIdByEmail
// --------------------------------------------------------------------------------
// Internal helper
// --------------------------------------------------------------------------------

async function getUserIdByEmail(email: string, token: string) {
  const res = await request<User[]>('GET', `${API_URL}/admin/users`, {
    token,
  });

  if (!res.data) {
    throw new Error('Failed to fetch users');
  }

  const user = res.data.find((u) => u.email === email);

  if (!user) {
    throw new Error(`User not found: ${email}`);
  }

  return user.id;
}

// --------------------------------------------------------------------------------
// createComposer
// --------------------------------------------------------------------------------

async function userLoadAvatar(uploadFile: string, token: string) {
  const form = new FormData();

  if (uploadFile) {
    form.append('uploadFile', createReadStream(uploadFile));
  }

  const res = await request('POST', `${API_URL}/me/avatar`, {
    token,
    data: form,
    headers: form.getHeaders(),
  });

  return res;
}

// --------------------------------------------------------------------------------
// createComposer
// --------------------------------------------------------------------------------

async function getUsersPage({ page = 1, limit = 10, sort }: GetUsersPageOptions, token: string) {
  const params = new URLSearchParams();

  params.append('page', String(page));
  params.append('limit', String(limit));
  if (sort) params.append('sort', sort);

  const res = await request<PaginatedResponse<User>>(
    'GET',
    `${API_URL}/admin/userspage?${params.toString()}`,
    { token },
  );

  return res;
}
// --------------------------------------------------------------------------------
// EXPORT (ESM)
// --------------------------------------------------------------------------------

export { createUser, updateUser, getUserIdByEmail, userLoadAvatar, getUsersPage };
