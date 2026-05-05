import { describe, it, expect, beforeAll } from 'vitest';

import { registerUser, confirmRegistration, expireToken } from '../helpers/auth.js';

interface RegUser {
  username: string;
  email: string;
}

// 🟢 Level 1 — Happy path (Mandatory)
//  register → confirm OK
// 🟡 Level 2 — Security edge cases (Important)
//  invalid token
//  expired token
//  no token
//  already used token
// 🔴 Level 3 — Stress / fuzz (Optional)

describe('👤 User API - From the User Point of view', () => {
  let tokens: string[] = [];

  const users: RegUser[] = [
    { username: 'RegUser1', email: 'reg.user1@test.com' },
    { username: 'RegUser2', email: 'reg.user2@test.com' },
    { username: 'RegUser3', email: 'reg.user3@test.com' },
  ];

  // ----------------------------------------------------------------------------
  // REGISTER USER
  // See document : architecture.dio
  // ----------------------------------------------------------------------------
  beforeAll(async () => {
    tokens = [];

    for (const u of users) {
      const res = await registerUser({
        username: u.username,
        email: u.email,
        password: 'password123',
      });

      expect(res.status).toBe(201);

      // Mandatory to avoid the error
      // Argument of type 'string | undefined' is not assignable to parameter of type 'string'.
      // because :   token?: string; // Optional without test
      if (!res.data.token) {
        throw new Error('Token should be defined in test env');
      }

      tokens.push(res.data.token);
    }
  });

  // ----------------------------------------------------------------------------
  // CONFIRM REGISTRATION
  // ----------------------------------------------------------------------------
  it('should confirm registration of all users', async () => {
    for (let i = 0; i < users.length; i++) {
      const token = tokens[i];

      const res = await confirmRegistration({
        token: token,
      });

      expect(res.status).toBe(200);
      // expect(res.data.message).toBe('Registration confirmed successfully.');
      // expect(res.data.user_id).toBeDefined();
    }
  });

  // ----------------------------------------------------------------------------
  // FAIL WITH INVALID EMAIL
  // ----------------------------------------------------------------------------
  it('should fail with invalid email', async () => {
    const res = await registerUser({
      username: 'toto',
      email: 'wrong.email',
      password: 'password123',
    });
    expect(res.status).toBe(400);
  });

  // ----------------------------------------------------------------------------
  // FAIL WITH DUPLICATE EMAIL
  // ----------------------------------------------------------------------------
  it('should fail with duplicate email', async () => {
    const res = await registerUser({
      username: 'reg.user1',
      email: 'reg.user1@test.com',
      password: 'password123',
    });
    expect(res.status).toBe(400);
  });

  // ----------------------------------------------------------------------------
  // FAIL WITH INVALID TOKEN
  // ----------------------------------------------------------------------------
  it('should reject invalid token, second set is passing', async () => {
    const res1 = await registerUser({
      username: 'RegUser4',
      email: 'reg.user4@test.com',
      password: 'password123',
    });
    expect(res1.status).toBe(200);

    const res2 = await confirmRegistration({
      token: 'abcde123',
    });
    expect(res2.status).toBe(400);

    if (!res1.data.token) {
      throw new Error('Token missing');
    }
    const token1 = res1.data.token;
    const res3 = await confirmRegistration({
      token: token1,
    });
    expect(res3.status).toBe(200);
  });

  // ----------------------------------------------------------------------------
  // FAIL WITH EXPIRED TOKEN
  // ----------------------------------------------------------------------------
  it('should reject expired token', async () => {
    // 1. Register user
    const email = 'expired.user@test.com';

    const resRegister = await registerUser({
      username: 'ExpiredUser',
      email,
      password: 'password123',
    });

    expect(resRegister.status).toBe(201);

    const token = resRegister.data.token!;
    expect(token).toBeDefined();

    // 2. Force expiration (TEST ONLY endpoint)
    const resExpire = await expireToken(email);
    expect(resExpire.status).toBe(200);

    // 3. Try confirm with expired token
    const resConfirm = await confirmRegistration({
      token,
    });

    expect(resConfirm.status).toBe(400);
    expect(resConfirm.data.errors).toBeDefined();
  });
});
