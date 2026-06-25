import axios, { Method } from 'axios';

// The browser will make a request to the vite dev server (localhost:5173/api)
// And vite will forward it to the VM via the vite.config.js file !!
// The other solution, is to fix IP address const API_URL = 'http://localhost:8080/api';
const API_URL = '/api';

// --------------------------------------------------------------------------------
// Request options
// --------------------------------------------------------------------------------
interface RequestOptions<TRequest = unknown> {
  data?: TRequest;
  headers?: Record<string, string>;
}

// --------------------------------------------------------------------------------
// Backend response shape (Go)
// --------------------------------------------------------------------------------
interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
  };
}

// --------------------------------------------------------------------------------
// apiRequest
//    Promise<APIResponse<TResponse>>
//      guarantee that `apiRequest` will immediately return a Promise. You cannot use its result directly --> pending
//      However, I can promise that once it has been resolved (Fulfilled), you will find an object that will always have
//      the `APIResponse` structure, and inside it, the data will be exactly of the `<TResponse>` type that you requested."
//
// --------------------------------------------------------------------------------
// Putting ‘async’ in front of your function forces it to return a promise, no matter what happens.
//    axios(...) is executed and immediately returns a promise in the Pending state.
//    The `await` keyword ‘pauses’ the execution of your `apiRequest` function whilst
//      the Axios promise is in the Pending state.
//    If the server responds successfully, the promise changes to Fulfilled.
//      `await` then ‘unwraps’ this promise and assigns the final response to the variable `res`.
//      The code moves on to the next line.
//    If the server responds with an error (e.g. 400, 500) or the network connection is lost,
//      the promise changes to ‘Rejected’.
//      `await` then throws an exception, which stops the normal flow and
//      sends the code directly to the `catch` block (`err`).
// --------------------------------------------------------------------------------

export async function apiRequest<TResponse = unknown, TRequest = unknown>(
  method: Method,
  url: string,
  options: RequestOptions<TRequest> = {},
): Promise<APIResponse<TResponse>> {
  const token = localStorage.getItem('token');

  try {
    const res = await axios<APIResponse<TResponse>>({
      method,
      url: API_URL + url,
      data: options.data,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    });

    return res.data;
  } catch (err) {
    if (axios.isAxiosError(err)) {
      return (
        (err.response?.data as APIResponse<TResponse>) ?? {
          success: false,
          error: {
            message: err.message || 'Unknown network error',
          },
        }
      );
    }

    return {
      success: false,
      error: {
        message: 'Unexpected error',
      },
    };
  }
}

// An Axios interceptor is like a link in a chain.
// When a request fails, Axios passes the error to your interceptor.
//  If you simply wrote `return error;`, you would turn the failure into a success for the next
//      link in the chain (the promise would become `Fulfilled` with the error as its result).
//  By writing `return Promise.reject(error);`,
//      you are explicitly telling Axios: “I am deliberately creating a new Promise that is `Rejected` with this error”.
//  This is what allows the error to continue on its way to the `catch (err)` block in your `apiRequest` function.
//  Without this `Promise.reject(error)`, your `try { await axios(...) }` would think that everything went smoothly!

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      window.location.href = '/login';
    }

    return Promise.reject(error);
  },
);
