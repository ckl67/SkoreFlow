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
// Axios wrapper response (internal)
// --------------------------------------------------------------------------------
interface HttpResponse<T = unknown> {
  status: number;
  data: APIResponse<T>;
}

// --------------------------------------------------------------------------------
// request
// --------------------------------------------------------------------------------
export async function apiRequest<TResponse = unknown, TRequest = unknown>(
  method: Method,
  url: string,
  options: RequestOptions<TRequest> = {},
): Promise<HttpResponse<TResponse>> {
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

    return {
      status: res.status,
      data: res.data,
    };
  } catch (err) {
    if (axios.isAxiosError(err)) {
      return {
        status: err.response?.status ?? 500,
        data: (err.response?.data as APIResponse<TResponse>) ?? {
          success: false,
          error: {
            message: err.message || 'Unknown network error',
          },
        },
      };
    }

    throw err;
  }
}

axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

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

function get<T>(url: string) {
  return apiRequest<T>('GET', url);
}

function post<T, B>(url: string, data: B) {
  return apiRequest<T, B>('POST', url, { data });
}
