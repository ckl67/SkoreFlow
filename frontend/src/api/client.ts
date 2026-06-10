import axios, { Method } from 'axios';

const API_URL = 'http://localhost:8080/api';

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
// request
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
