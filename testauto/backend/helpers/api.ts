import axios, { AxiosError } from 'axios';

// --------------------------------------------------------------------------------
// MAIN HELPERS
// --------------------------------------------------------------------------------

// -----------------------------------------------------------------------------
// CURL vs AXIOS (Concept differences)
// -----------------------------------------------------------------------------
//
// 1. ESCAPING & STRINGS (cURL)
//    In cURL/Shell, JSON is a STRING. You must manually escape double quotes:
//    -d "{\"email\":\"${EMAIL}\"}"  <-- Backslashes are mandatory here.
//
// 2. AUTOMATIC SERIALIZATION (Axios)
//    In JS, you pass an OBJECT. Axios handles the string conversion for you:
//    data: { email, password }
//
// -----------------------------------------------------------------------------
// OBJECT HANDLING: PACKING vs UNPACKING
// -----------------------------------------------------------------------------
//
// A. UNPACKING (Destructuring in Function Signature)
//    { token, data, headers } = {}
//    → The {} in the parameters EXTRACTS properties from the incoming object.
//    → It makes variables (token, data...) local to the function.
//    → No need for 'this.token' .
//
// B. PACKING (Shorthand Property in Axios)
//    data, (inside axios({ ... }))
//    → This is shorthand for 'data: data'.
//    → It PACKS the local variable 'data' back into a new object for the request.
//
// -----------------------------------------------------------------------------
// MULTIPART UPLOAD (Special Case)
// -----------------------------------------------------------------------------
// curl -F "avatar=@file.png"
// → multipart/form-data upload.
//
// axios equivalent:
// const form = new FormData();
// form.append("avatar", fs.createReadStream("./file.png"));
// headers: form.getHeaders() <-- Generates the dynamic boundary.
//
// -----------------------------------------------------------------------------

// --------------------------------------------------------------------------------
// TYPES
// --------------------------------------------------------------------------------
interface RequestOptions {
  token?: string;
  data?: any;
  headers?: Record<string, string>;
}

// --------------------------------------------------------------------------------
// request
// --------------------------------------------------------------------------------

async function request(method: string, url: string, { token, data, headers }: RequestOptions = {}) {
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
    if (axios.isAxiosError(err)) {
      // axios error
      return {
        status: err.response?.status ?? 500,
        data: err.response?.data ?? null,
      };
    }

    throw err; // real issue (network, config, etc.)
  }
}

// --------------------------------------------------------------------------------
// EXPORT (ESM)
// --------------------------------------------------------------------------------

export { request };
