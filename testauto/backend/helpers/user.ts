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

interface UpdateProfilerRequest {
  username: string;
}

// -------------------

interface UpdateMailRequest {
  email: string;
}

interface UpdateMailResponse {
  message: string;
  email: string;
  pending_email: string;
  token_email: string;
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

async function updateProfile(data: UpdateProfilerRequest, token: string) {
  console.log('UpdateProfilerRequest: Input Data', {
    data,
    token,
  });

  const res = await request<ProfileUserResponse>('PUT', `${API_URL}/me/profile`, {
    token: token,
    data: data,
  });

  console.log('\n Update :', res.status, res.data);

  return res;
}

// --------------------------------------------------------------------------------
// Update User's email
// --------------------------------------------------------------------------------

async function updateMail(data: UpdateMailRequest, token: string) {
  console.log('REQUEST UPDATE MAIL:', {
    data,
    token,
  });

  const res = await request<UpdateMailResponse>('PUT', `${API_URL}/me/mail`, {
    token: token,
    data: data,
  });

  console.log('\n RESPONSE UPDATE MAIL', res.status, res.data);

  return res;
}

// --------------------------------------------------------------------------------
// EXPORT (ESM)
// --------------------------------------------------------------------------------

export { getProfile, updateProfile, updateMail };
