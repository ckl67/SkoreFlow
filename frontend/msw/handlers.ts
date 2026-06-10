import { http, HttpResponse } from 'msw';
import type { LoginRequest, LoginResponse } from '../../shared/types/auth';

export const handlers = [
  http.post('/api/login', async ({ request }) => {
    const body = (await request.json()) as LoginRequest;

    if (body.email === 'test@test.com' && body.password === 'password123') {
      const response: LoginResponse = {
        message: 'Login success',
        token: 'fake-jwt-token',
        user: {
          id: 1,
          username: 'testUser',
          email: body.email,
          avatar: '',
          role: 1,
          isVerified: true,
        },
      };

      return HttpResponse.json(response);
    }

    return HttpResponse.json({ message: 'Invalid credentials' }, { status: 401 });
  }),
];
