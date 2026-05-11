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

interface UserPublicResponse {
  id: number;
  username: string;
  email: string;
  avatar: string;
  role: number;
  isVerified: boolean;
}

// -------------------

interface ProfileUserResponse {
  message: string;
  user: UserPublicResponse;
}

// -------------------

interface UpdateUserRequest {
  username: string;
}

// --------------------------------------------------------------------------------
// Get Profile
// --------------------------------------------------------------------------------

async function getProfile(token: string) {
  const res = await request<ProfileUserResponse>('GET', `${API_URL}/me`, {
    token: token,
  });

  console.log('\n getProfile :', res.status, res.data);

  return res;
}

// --------------------------------------------------------------------------------
// Update Profile
// --------------------------------------------------------------------------------

async function updateProfile(data: UpdateUserRequest, token: string) {
  console.log('REQUEST UPDATE PROFILE:', {
    data,
    token,
  });

  const res = await request<ProfileUserResponse>('PUT', `${API_URL}/me`, {
    token: token,
    data: data,
  });

  console.log('\n Update :', res.status, res.data);

  return res;
}
// --------------------------------------------------------------------------------
// EXPORT (ESM)
// --------------------------------------------------------------------------------

export { getProfile, updateProfile };
