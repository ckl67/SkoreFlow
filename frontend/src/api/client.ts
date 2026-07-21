import axios, { Method } from 'axios';
import { config } from './../config/config';
import { logger } from './../core/logger/logger';

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
//
//  `await` cannot be used directly within a React component
//      Example
//        const res1 = await GetComposersPage();
//      A React component is not asynchronous.
//      We must use `useEffect()`.
// --------------------------------------------------------------------------------

export async function apiRequest<TResponse = unknown, TRequest = unknown>(
  method: Method,
  url: string,
  options: RequestOptions<TRequest> = {}
): Promise<TResponse> {
  const token = localStorage.getItem('token');

  try {
    // Axios returns <APIResponse<TResponse>>
    const res = await axios<APIResponse<TResponse>>({
      method,
      url: config.apiUrl + url,
      data: options.data,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    });

    logger.debug('api', '(apiRequest) status =', res.status);
    logger.debug('api', '(apiRequest) content-type =', res.headers['content-type']);
    logger.debug('api', '(apiRequest) data =', res.data);

    // If the server returns a 200 status code but with `success: false` or no data
    // the server returns a failure (success: false),
    // ?? (null coalescing operator):
    //    It checks whether the left-hand side is null or undefined.

    // new Error() instantiates a standard JavaScript error object.
    //    --> but also the stack trace (the call stack that specifies exactly on which line and in which file the error occurred).
    // `throw` immediately stops the execution of the current function.
    //    --> Control is then passed to the nearest `try...catch` block that encloses this call.

    if (!res.data.success) {
      throw new Error(res.data.error?.message ?? 'API request failed');
    }

    // The server responds with `success: true` but without any data, even though there should be some.
    if (res.data.data === undefined) {
      throw new Error('Missing response data');
    }

    // Here, TypeScript knows that `res.data.data` exists and is of type `TResponse`
    return res.data.data;
  } catch (err) {
    // -- Ensure that the code calling this function always receives a standard Error instance, with the most explicit message possible --

    // Axios HTTP/Network Error Handling
    //  If the HTTP request fails (server 500, no network connection, 404, etc.), Axios throws a specific error.
    //    Debug log: It writes the basic Axios error message to your logs (e.g. "Request failed with status code 404").
    //    Extracting the API response: It attempts to cast (as) the body of the server’s JSON response to TypeScript `APIResponse`
    //      Re-raising the error with cascading fallbacks (??):
    //        Priority 1: The custom message returned by your backend API (apiError?.error?.message, e.g. “Email already in use”).
    //        Priority 2: If the backend has not provided any JSON or message, it uses the standard Axios message (err.message, e.g. "Network Error").
    //        Priority 3: If even that does not exist, it uses 'Unknown network error'.
    if (axios.isAxiosError(err)) {
      logger.debug('api', '(apiRequest) err =', err.message);
      const apiError = err.response?.data as APIResponse<unknown> | undefined;

      throw new Error(apiError?.error?.message ?? err.message ?? 'Unknown network error');
    }

    // If it is not an Axios error, but a standard JavaScript error (e.g. a TypeError, invalid syntax, or a manual `throw new Error(...)`
    // thrown within the `try` block), it passes it through as it is without modifying it.
    if (err instanceof Error) {
      throw err;
    }

    // If this very rare situation occurs, this final block catches the odd object and turns
    // it into a genuine error with the message ‘Unexpected error’.
    throw new Error('Unexpected error');
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
      logger.debug('api', '(interceptors called) err =', error.message);
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

// In JavaScript, a Blob (which stands for Binary Large Object) represents a block of raw, immutable data.
// Setting `responseType: 'blob'` tells Axios not to attempt to parse the API response as text or JSON
// (which it does by default), but to retrieve the data directly in its original binary form.
export async function apiBinaryRequest(method: Method, url: string): Promise<Blob> {
  const token = localStorage.getItem('token');

  logger.debug('api', '(apiBinaryRequest) method url =', config.apiUrl + url);
  const res = await axios({
    method,
    url: config.apiUrl + url,
    responseType: 'blob',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  logger.debug('api', '(apiBinaryRequest) status =', res.status);
  logger.debug('api', '(apiBinaryRequest) content-type =', res.headers['content-type']);
  logger.debug('api', '(apiBinaryRequest) blob =', res.data);

  return res.data;
}
