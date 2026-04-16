const { request } = require("./api");
const { API_URL } = require("../config");

async function login(email, password) {
  const res = await request("POST", `${API_URL}/login`, {
    data: { email, password },
  });

  if (res.status !== 200) {
    throw new Error("Login failed");
  }

  return res.data.token;
}

module.exports = { login };
