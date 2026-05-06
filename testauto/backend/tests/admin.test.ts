import { describe, it, expect, beforeAll } from 'vitest';

import { login } from '../helpers/auth.js';
import {
  createUser,
  updateUser,
  getUserIdByEmail,
  getUsersPage,
  userLoadAvatar,
} from '../helpers/user.js';
import { request } from '../helpers/api.js';
import { API_URL } from '../config.js';
import { getResetToken } from '../helpers/reset.js';

const ENABLE_PW_RESET = process.env.TEST_PASSWORD_RESET === 'true';

interface TestUser {
  email: string;
  role: number;
  verified: boolean;
}

describe('👤 User API', () => {
  let TOKEN_ADMIN: string;
  let TOKEN_USER1: string;

  const users: TestUser[] = [
    { email: 'user1@test.com', role: 0, verified: true },
    { email: 'user2@test.com', role: 1, verified: true },
    { email: 'user3@test.com', role: 0, verified: false },
  ];

  // ----------------------------------------------------------------------------
  // SETUP GLOBAL
  // ----------------------------------------------------------------------------
  beforeAll(async () => {
    TOKEN_ADMIN = await login('admin@admin.com', 'skoreflow');
  });

  // ----------------------------------------------------------------------------
  // CREATE USERS
  // ----------------------------------------------------------------------------
  it('should create users', async () => {
    for (const u of users) {
      const res = await createUser({ email: u.email, password: 'password123' }, TOKEN_ADMIN);

      expect(res.status).toBe(201);
    }
  });

  // ----------------------------------------------------------------------------
  // LIST USERS
  // ----------------------------------------------------------------------------

  it('should get paginated users', async () => {
    const res = await getUsersPage({ page: 2, limit: 2 }, TOKEN_ADMIN);

    expect(res.status).toBe(200);

    expect(res.data.page).toBe(2);
    expect(res.data.limit).toBe(2);
    expect(res.data.rows.length).toBeLessThanOrEqual(2);

    expect(res.data.total_pages).toBeGreaterThan(0);
  });

  // ----------------------------------------------------------------------------
  // UPDATE USERS
  // ----------------------------------------------------------------------------
  it('should update user N°3', async () => {
    const u = users[2];
    // ou
    // const u = users.find(u => u.email === 'user3@test.com');

    console.log('DEBUG users 3:', u);

    const id = await getUserIdByEmail(u.email, TOKEN_ADMIN);
    const uname = u.email.split('@')[0] + 'new';

    console.log('DEBUG uname:', uname);

    const res = await updateUser(
      id,
      {
        username: uname,
        password: 'password123',
        role: u.role,
        isVerified: true,
      },
      TOKEN_ADMIN,
    );

    console.log('DEBUG users:', res.data);

    expect(res.status).toBe(200);
  });

  // ----------------------------------------------------------------------------
  // LIST USERS
  // ----------------------------------------------------------------------------
  it('should list users', async () => {
    const res = await getUsersPage({ page: 1, limit: 100 }, 'WRONG_TOKEN_ADMIN');

    expect(res.status).toBe(401);
  });

  // ----------------------------------------------------------------------------
  // SECURITY
  // ----------------------------------------------------------------------------
  it('should block unauthorized access', async () => {
    let res = await getUsersPage({ page: 1, limit: 100 }, 'WRONG_TOKEN_ADMIN');
    expect(res.status).toBe(401);

    TOKEN_USER1 = await login('user1@test.com', 'password123');

    res = await getUsersPage({ page: 1, limit: 100 }, TOKEN_USER1);

    expect(res.status).toBe(403);
  });

  // ----------------------------------------------------------------------------
  // PROFILE
  // ----------------------------------------------------------------------------
  it('should manage profile', async () => {
    let res = await request('GET', `${API_URL}/me`, {
      token: TOKEN_USER1,
    });

    expect(res.status).toBe(200);

    res = await request('PUT', `${API_URL}/me`, {
      token: TOKEN_USER1,
      data: { username: 'UpdatedUser1' },
    });

    expect(res.status).toBe(200);
  });

  // ----------------------------------------------------------------------------
  // AVATAR
  // ----------------------------------------------------------------------------
  it('should upload avatar', async () => {
    const res = await userLoadAvatar('./resources/avatars/user.png', TOKEN_USER1);
    expect(res.status).toBe(200);
  });

  // ----------------------------------------------------------------------------
  // ADMIN OPERATIONS
  // ----------------------------------------------------------------------------
  it('should perform admin operations', async () => {
    const u = users[2];
    const firstUserId = await getUserIdByEmail(u.email, TOKEN_ADMIN);

    let res = await request('GET', `${API_URL}/admin/users/${firstUserId}`, {
      token: TOKEN_ADMIN,
    });
    expect(res.status).toBe(200);

    res = await request('PUT', `${API_URL}/admin/users/${firstUserId}`, {
      token: TOKEN_ADMIN,
      data: { username: 'AdminUpdated' },
    });
    expect(res.status).toBe(200);

    res = await request('DELETE', `${API_URL}/admin/users/${firstUserId}`, {
      token: TOKEN_ADMIN,
    });
    expect(res.status).toBe(400);
  });

  // ----------------------------------------------------------------------------
  // DELETE UNVERIFIED
  // ----------------------------------------------------------------------------
  it('should delete unverified user', async () => {
    const email = 'user4@test.com';

    await createUser({ email, password: 'password123' }, TOKEN_ADMIN);
    const id = await getUserIdByEmail(email, TOKEN_ADMIN);

    await updateUser(
      id,
      {
        username: 'user4',
        password: 'password123',
        role: 0,
        isVerified: false,
      },
      TOKEN_ADMIN,
    );

    const res = await request('DELETE', `${API_URL}/admin/users/${id}`, {
      token: TOKEN_ADMIN,
    });

    expect(res.status).toBe(200);
  });

  // ----------------------------------------------------------------------------
  // PASSWORD RESET
  // ----------------------------------------------------------------------------
  it.skipIf(!ENABLE_PW_RESET)('should reset password', async () => {
    const EMAIL = 'user2@test.com';

    let res = await request('POST', `${API_URL}/password/forgot`, {
      data: { email: EMAIL },
    });

    expect(res.status).toBe(200);

    const token = await getResetToken(EMAIL, TOKEN_ADMIN);

    res = await request('POST', `${API_URL}/password/reset`, {
      data: {
        token,
        password: 'NewPassword123!',
      },
    });

    expect(res.status).toBe(200);
  });

  // ----------------------------------------------------------------------------
  // REGISTER FLOW
  // ----------------------------------------------------------------------------
  it.skipIf(!ENABLE_PW_RESET)('should register user', async () => {
    const EMAIL = 'register@test.com';

    let res = await request('POST', `${API_URL}/register`, {
      data: {
        username: 'register',
        email: EMAIL,
        password: 'password123',
      },
    });

    expect(res.status).toBe(201);

    const token = await getResetToken(EMAIL, TOKEN_ADMIN);

    res = await request('POST', `${API_URL}/register/confirm`, {
      data: { token },
    });

    expect(res.status).toBe(200);
  });
});
