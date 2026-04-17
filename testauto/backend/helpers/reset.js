const { request } = require("./api");
const { API_URL } = require("../config");

// Fetch reset token from admin test endpoint
// → Throws an error if token is missing or invalid
// → Caller is responsible for handling the failure (try/catch or process exit)

// THIS SERVICE CAN ONLY BE USED FOR TEST PERSPECTIVE !!
async function getResetToken(email, adminToken) {
  const res = await request("GET", `${API_URL}/test/reset-token/${email}`, {
    token: adminToken,
  });

  if (!res.data?.token) {
    throw new Error("Reset token not found");
  }

  return res.data.token;
}

module.exports = { getResetToken };
