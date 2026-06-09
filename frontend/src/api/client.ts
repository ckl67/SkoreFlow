import axios from 'axios';
import type { APIResponse } from './types';

const API_URL = 'http://localhost:8080/api';

export async function apiRequest<TResponse, TRequest = unknown>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  url: string,
  data?: TRequest,
): Promise<APIResponse<TResponse>> {
  const token = localStorage.getItem('token');

  const res = await axios({
    method,
    url: API_URL + url,
    data,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  console.log('\n apiRequest', res.status, res.data);

  return res.data;
}
