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
// - The shape { status, data } comes from the implementation of 'request()',
//   not from 'await' itself.
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

// 1. THE CONTRACT (Interface)
// <T = unknown> is a generic placeholder.
// It says: "This object will handle some data of type T."
// By defaulting to 'unknown', we prevent accidental use of 'any'.
interface RequestOptions<T = unknown> {
  token?: string;
  data?: T; // If you send data, it should match the type T
  headers?: Record<string, string>;
}

// THE WRAPPER (Response structure)
// This ensures every API call returns a consistent object shape.
// The 'data' property will hold the actual server response, typed as T.
// Example :
// res = await request<LoginResponse>('POST', `${API_URL}/login`, { data: {email,password }
interface HttpResponse<T = unknown> {
  status: number;
  data: T;
}

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
async function request<T = unknown>(
  method: Method,
  url: string,
  { token, data, headers }: RequestOptions = {},
): Promise<HttpResponse<T>> {
  try {
    const res = await axios({
      method,
      url,
      data,
      headers: {
        // Conditional spread: adds Authorization header only if token exists
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(headers || {}),
      },
    });

    // 4. THE DELIVERY
    // Here, res.data is returned and automatically cast to type T
    return {
      status: res.status,
      data: res.data,
    };
  } catch (err) {
    if (axios.isAxiosError(err)) {
      return {
        // Returns the error status or defaults to 500 (Internal Server Error)
        status: err.response?.status ?? 500,
        // Using 'as T' here is a common pattern to handle error bodies
        // But it is not always T ! { "message": "invalid credentials" }
        //data: (err.response?.data ?? null) as T,
        // error network  → data = null
        // backend down → data = null
        // timeout → data = null
        //
        // Consider that the re turn value is type T, even it is not true
        //    error: 'unknown error'  is not a T Type !!
        // This is to avoid : 'res.data' is possibly 'null'.
        data: err.response?.data ?? ({ error: 'unknown error' } as T),
      };
    }

    // Rethrow if it's a programming error or a total network failure
    throw err;
  }
}

// --------------------------------------------------------------------------------
// EXPORT (ESM)
// --------------------------------------------------------------------------------

export { request };
export type { HttpResponse };
