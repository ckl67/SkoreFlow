import axios, { Method } from 'axios';
import { config } from './../config/config';

// --------------------------------------------------------------------------------
// Request options
// --------------------------------------------------------------------------------
type RequestOptions<TRequest = unknown> = {
  data?: TRequest;
  headers?: Record<string, string>;
};

// --------------------------------------------------------------------------------
// Backend response shape (Go)
// --------------------------------------------------------------------------------
type APIResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: {
    message: string;
  };
};

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
  options: RequestOptions<TRequest> = {}
): Promise<APIResponse<TResponse>> {
  const token = localStorage.getItem('token');

  try {
    const res = await axios<APIResponse<TResponse>>({
      method,
      url: config.apiUrl + url,
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
  }
);

export async function apiBinaryRequest(method: Method, url: string): Promise<Blob> {
  const token = localStorage.getItem('token');

  console.log('(apiBinaryRequest) gotten url:', url);
  console.log('(apiBinaryRequest) API URL =', config.apiUrl);
  console.log('(apiBinaryRequest) url =', config.apiUrl + url);
  const res = await axios({
    method,
    url: config.apiUrl + url,
    responseType: 'blob',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  console.log('(apiBinaryRequest) status =', res.status);
  console.log('(apiBinaryRequest) content-type =', res.headers['content-type']);
  console.log('(apiBinaryRequest) blob =', res.data);

  return res.data;
}

//export async function apiDownloadRequest(method: Method, url: string): Promise<Blob> {
//
//
//  return nil;
//}
