// --------------------------------------------------------------------------------
// HELPERS
// Even file is api.ts
// 👉 TypeScript compile in .js, Node needs final extension

// --------------------------------------------------------------------------------

import { request } from "./api.js";
import { API_URL } from "../config.js";

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
// --------------------------------------------------------------------------------

async function login(email: string, password: string) {
  const res = await request("POST", `${API_URL}/login`, {
    // Normaly written
    // data: { "email": email, "password": password },
    // But equivalent in javascrit as
    // data: { email: email, password: password },
    // Can be simplified :
    // in JavaScript moderne (ES6) Property Shorthand.
    // data: { email, password },
    data: {
      email: email,
      password: password,
    },
  });

  if (res.status !== 200) {
    throw new Error(`Login failed (${res.status})`);
  }

  return res.data.token;
}

export { login };
