// --------------------------------------------------------------------------------
// HELPERS
// --------------------------------------------------------------------------------

import { request } from "./api.js";
import { assertStatus } from "./assert.js";

const { API_URL } = require("../config");

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
  email: string;
  username?: string;
  password?: string;
  role?: number;
  isVerified?: boolean;
}

// Sent back from the api
interface User {
  id: number;
  email: string;
  username: string;
  role?: number;
  isVerified?: boolean;
}

async function createUser(
  { email, password }: RequestOptions,
  token: string,
  expected = 201,
) {
  const username = email.split("@")[0];

  console.log(`\n Creating User: ${username} (${email})`);

  const res = await request("POST", `${API_URL}/admin/createuser`, {
    token,
    data: {
      username: username,
      email: email,
      password: password,
    },
  });

  assertStatus(`Create User: ${username}`, res, expected);

  return res.data;
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
  expected = 200,
) {
  console.log(`\n updateUser User: ${username} `);

  const res = await request("PUT", `${API_URL}/admin/users/${userId}`, {
    token,
    data: {
      username: username,
      role: role,
      isVerified: isVerified,
    },
  });

  assertStatus(`Update Role (ID: ${userId})`, res, 200);
}

// --------------------------------------------------------------------------------
// getUserIdByEmail
// --------------------------------------------------------------------------------
// Internal helper
// --------------------------------------------------------------------------------

async function getUserIdByEmail(email: string, token: string) {
  const res = await request("GET", `${API_URL}/admin/users`, {
    token,
  });

  const users: User[] = res.data;
  const user = users.find((u) => u.email === email);

  if (!user) {
    console.error(`❌ User not found: ${email}`);
    process.exit(1);
  }

  return user.id;
}

// --------------------------------------------------------------------------------
// EXPORT (ESM)
// --------------------------------------------------------------------------------

module.exports = { createUser, updateUser, getUserIdByEmail };
