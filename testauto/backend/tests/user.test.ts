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
  it('should update users', async () => {
    for (const u of users) {
      const id = await getUserIdByEmail(u.email, TOKEN_ADMIN);
      const uname = u.email.split('@')[0] ?? 'default_user';

      const res = await updateUser(
        id,
        {
          username: uname,
          password: 'password123',
          role: u.role,
          isVerified: u.verified,
        },
        TOKEN_ADMIN,
      );

      expect(res.status).toBe(200);
    }
  });
});
