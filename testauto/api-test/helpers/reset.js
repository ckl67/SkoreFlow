const { request } = require("./api");
const { API_URL } = require("../config");

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
