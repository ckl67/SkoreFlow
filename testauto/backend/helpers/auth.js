const { request } = require("./api");
const { API_URL } = require("../config");

// login(email, password)
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
async function login(email, password) {
  const res = await request("POST", `${API_URL}/login`, {
    data: { email, password },
  });

  if (res.status !== 200) {
    throw new Error(`Login failed (${res.status})`);
  }

  return res.data.token;
}

module.exports = { login };
