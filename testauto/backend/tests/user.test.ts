import { describe, it, expect, beforeAll } from 'vitest';

import { login } from '../helpers/auth.js';
import { getProfile, updateProfile } from '../helpers/user.js';

// ----------------------------------------------------------------------------
// INTERFACE
// ----------------------------------------------------------------------------

// ----------------------------------------------------------------------------
// 🟢 Level 1 — Happy path (Mandatory)
//  register → confirm OK
// 🟡 Level 2 — Security edge cases (Important)
//  invalid token
//  expired token
//  no token
//  ...
//  already used token
// 🔴 Level 3 — Stress / fuzz (Optional)
// ----------------------------------------------------------------------------

describe('👤 User  API - From the User Point of view', () => {
  let TOKEN_ADMIN: string;
  let TOKEN_USER1: string;
  let TOKEN_USER2: string;
  // ----------------------------------------------------------------------------
  // SETUP
  // ----------------------------------------------------------------------------
  beforeAll(async () => {
    const res = await login({
      email: 'admin@admin.com',
      password: 'skoreflow',
    });

    TOKEN_ADMIN = res.data.data!.token;
  });

  // ----------------------------------------------------------------------------
  // REGISTER USER - Pre seeded
  // ----------------------------------------------------------------------------
  it('should confirm login of pre seeded user', async () => {
    const resLogin = await login({ email: 'user1@test.com', password: 'password123' });
    expect(resLogin.status).toBe(200);
    TOKEN_USER1 = resLogin.data.data!.token;
  });

  // ----------------------------------------------------------------------------
  // REGISTER USER - Pre seeded - FAIL
  // ----------------------------------------------------------------------------
  it('should fail login of pre seeded user', async () => {
    const resLogin = await login({ email: 'user1@test.com', password: 'password1234' });
    expect(resLogin.status).toBe(401);
    expect(resLogin.data.success).toBe(false);
  });

  // ----------------------------------------------------------------------------
  // GET PROFILE
  // ----------------------------------------------------------------------------
  it('should get profile of User1', async () => {
    const resLogin = await login({ email: 'user1@test.com', password: 'password123' });
    if (resLogin.status !== 200) {
      console.log('LOGIN FAILED RESPONSE:', resLogin.data);
    }

    expect(resLogin.status).toBe(200);
    expect(resLogin.data.success).toBe(true);

    TOKEN_USER1 = resLogin.data.data!.token;

    const res = await getProfile(TOKEN_USER1);
    expect(res.status).toBe(200);
  });

  // ----------------------------------------------------------------------------
  // UPDATE PROFILE
  // ----------------------------------------------------------------------------
  it('should update profile of User2', async () => {
    const resLogin = await login({ email: 'user1@test.com', password: 'password123' });
    if (resLogin.status !== 200) {
      console.log('LOGIN FAILED RESPONSE:', resLogin.data);
    }
    TOKEN_USER2 = resLogin.data.data!.token;

    const res = await updateProfile({ username: 'newNameUser2' }, TOKEN_USER2);
    expect(res.status).toBe(200);
  });

  // ----------------------------------------------------------------------------
  // ----------------------------------------------------------------------------
});
