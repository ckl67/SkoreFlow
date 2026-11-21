import axios, { Method } from 'axios';

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

// -----------------------------------------------------------------------------
// NOTES ON GENERICS AND ASYNC BEHAVIOR
// -----------------------------------------------------------------------------
// <T> is a generic type parameter representing the expected shape of the data.
// It allows each API call to define its own response type in a type-safe way.
//
// RequestOptions<T>:
// - 'data' must match the type T when sending a request body.
// - Using <T = unknown> avoids unsafe 'any' usage by default.
//
// HttpResponse<T>:
// - Standardized response wrapper for all API calls.
// - 'status' is the HTTP status code.
// - 'data' contains the server response, typed as T.
//
// IMPORTANT:
// - 'await' does NOT change or format the response structure.
// - It only resolves the Promise returned by 'request()'.
// - The shape { status, data } comes from the implementation of 'request()', not from 'await' itself.
//
// Example:
// const res = await request<LoginResponse>('POST', '/login', { data: {...} });
//
// Result:
// res.status → number
// res.data   → LoginResponse
//
// Example:
// const res = request(...)
// res = Promise<...>
// res.status = ❌
//
// const res = await request(...)
// res = HttpResponse<T>
// res.status = ✔
// -----------------------------------------------------------------------------

// --------------------------------------------------------------------------------
// TYPES
// --------------------------------------------------------------------------------

// 1. THE CONTRACT
// <T = unknown> is a generic placeholder.
// It says: "This object will handle some data of type T."
// By defaulting to 'unknown', we prevent accidental use of 'any'.
type RequestOptions<T = unknown> = {
  token?: string;
  data?: T; // If you send data, it should match the type T
  headers?: Record<string, string>;
};

// THE WRAPPER (Response structure)
// This ensures every API call returns a consistent object shape.
// The 'data' property will hold the actual server response, typed as T.
// Example :
// res = await request<LoginResponse>('POST', `${API_URL}/login`, { data: {email,password }

// Return of GO backend API
type APIResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: {
    message: string;
  };
};

// Return of function request
export type HttpResponse<T = unknown> = {
  status: number;
  data: APIResponse<T>;
};
// --------------------------------------------------------------------------------
// request
// --------------------------------------------------------------------------------

/**
 * The <T = unknown> here is the "bridge" between the API and your logic.
 * @param method - HTTP Verb (GET, POST, etc.)
 * @param url - API Endpoint
 * @param options - Includes the payload (data) and auth (token)
 *
 * FLOW EXPLANATION:
 * When you call request<LoginResponse>(...), T becomes 'LoginResponse'.
 * Consequently:
 * - RequestOptions uses T for the 'data' sent (input)
 * - Promise<HttpResponse<T>> ensures the returned 'data' is LoginResponse (output)
 */
// Last and not the least, for test facilities, we have decided to return
//  Promise<HttpResponse<T>> rather then  Promise<T>
export async function request<T = unknown>(
  method: Method,
  url: string,
  { token, data, headers }: RequestOptions = {}
): Promise<HttpResponse<T>> {
  try {
    // Axios returns <APIResponse<T>>
    const res = await axios<APIResponse<T>>({
      method,
      url,
      data,
      headers: {
        // Conditional spread: adds Authorization header only if token exists
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(headers || {}),
      },
    });

    // Here, res.data is returned and automatically cast to type T
    return {
      status: res.status,
      data: res.data, // Success : { success: true, data: T }
    };
  } catch (err) {
    if (axios.isAxiosError(err)) {
      // We build an answer in respect of the error structure APIResponse
      const errorData: APIResponse<T> = err.response?.data ?? {
        success: false,
        error: { message: err.message || 'Unknown network error' },
      };

      return {
        status: err.response?.status ?? 500,
        data: errorData,
      };
    }
    throw err;
  }
}

// In JavaScript, a Blob (which stands for Binary Large Object) represents a block of raw, immutable data.
// Setting `responseType: 'blob'` tells Axios not to attempt to parse the API response as text or JSON
// (which it does by default), but to retrieve the data directly in its original binary form.
// Not working in Nodes.js
export async function apiBinaryRequestBlob(
  method: Method,
  url: string,
  token?: string
): Promise<Blob> {
  const res = await axios({
    method,
    url,
    responseType: 'blob',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  return res.data;
}

// In Node.js (Vitest), Axios uses the HTTP adapter rather than the browser's
// XMLHttpRequest adapter. Unlike in the browser, responseType: 'blob' does not
// reliably return a Blob in this environment.
//
// We therefore use responseType: 'arraybuffer', which returns binary data as a
// Buffer in Node.js. Buffer is the native Node.js representation for handling
// binary data and allows direct comparison of file contents.
//
// Note: The frontend uses responseType: 'blob', which is the appropriate
// binary representation in the browser environment.
export async function apiBinaryRequest(
  method: Method,
  url: string,
  token?: string
): Promise<Buffer> {
  const res = await axios({
    method,
    url,
    responseType: 'arraybuffer',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  return Buffer.from(res.data);
}
