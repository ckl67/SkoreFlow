const axios = require("axios");
// -----------------------------------------------------------------------------
// CURL vs AXIOS (multipart upload)
// -----------------------------------------------------------------------------
//
// curl version:
// curl -X POST http://localhost:8080/api/me/avatar \
//   -H "Authorization: Bearer $TOKEN_USER" \
//   -F "avatar=@$AVATAR_FILE"
//
// Breakdown:
//
// -X POST
// → HTTP method
// → axios: method: "POST"
//
// URL
// → http://localhost:8080/api/me/avatar
// → axios: `${API_URL}/me/avatar`
//
// -H "Authorization: Bearer $TOKEN_USER"
// → HTTP header for authentication
// → axios:
//    headers: {
//      Authorization: `Bearer ${TOKEN_USER1}`
//    }
//
// -F "avatar=@file.png"
// → multipart/form-data upload
// → curl automatically:
//    - builds multipart body
//    - generates boundary
//    - sets Content-Type: multipart/form-data; boundary=...
//
// → axios / Node equivalent:
//    const form = new FormData();
//    form.append("avatar", fs.createReadStream("./resources/avatars/user.png"));
//
// → form-data handles:
//    - multipart encoding
//    - file streaming
//    - boundary generation
//
// → headers:
//    ...form.getHeaders()
//    adds:
//    Content-Type: multipart/form-data; boundary=...
//
// -----------------------------------------------------------------------------
// AXIOS equivalent implementation
// -----------------------------------------------------------------------------
//  const form = new FormData();
//  form.append("avatar", fs.createReadStream("./resources/avatars/user.png"));
//
//  res = await request("POST", `${API_URL}/me/avatar`, {
//    token: TOKEN_USER1,
//    data: form,
//    headers: form.getHeaders(),
//  });
//
// -----------------------------------------------------------------------------
// JAVASCRIPT Syntax
// -----------------------------------------------------------------------------
// async → the function returns a Promise
//
// { token, data, headers } = {} --> if the object are not present then replace by {} (nothing)
// → object destructuring with a default value
// → prevents: Cannot destructure property 'token' of 'undefined'
//   when calling request("GET", "/users") without options
//
// token ? { Authorization: `Bearer ${token}` } : {}
// → if token exists: { Authorization: "Bearer <token>" }
// → otherwise: {}
//
// ...object (spread operator)
// → injects properties of an object into another object
//
// Example:
// headers: {
//   "Content-Type": "application/json",
//   ...{ Authorization: "Bearer abc" }
// }
//
// becomes:
// headers: {
//   "Content-Type": "application/json",
//   Authorization: "Bearer abc"
// }
//
// ...(headers || {})
// → merges custom headers if provided
//
// body: data ? JSON.stringify(data) : undefined
// → if data exists: serialize it to JSON
// → otherwise: no body is sent (important for GET requests)
//
// response parsing:

async function request(method, url, { token, data, headers } = {}) {
  try {
    const res = await axios({
      method,
      url,
      data,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(headers || {}),
      },
    });

    return {
      status: res.status,
      data: res.data,
    };
  } catch (err) {
    if (err.response) {
      return {
        status: err.response.status,
        data: err.response.data,
      };
    }

    throw err; // Real Network issue
  }
}
module.exports = { request };
