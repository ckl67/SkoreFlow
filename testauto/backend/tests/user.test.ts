import { describe, it, expect, beforeAll } from 'vitest';

import { login, register, confirmRegistration, confirmUpdateMail } from '../helpers/auth.js';
import { getProfile, updateProfile, updateMail } from '../helpers/user.js';

// ----------------------------------------------------------------------------
// INTERFACE
// ----------------------------------------------------------------------------
interface TestUser {
  username: string;
  email: string;
  password: string;
}
// ----------------------------------------------------------------------------
// LOCAL HELPER
// ----------------------------------------------------------------------------

function makeUser(prefix = 'user'): TestUser {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  return {
    username: `${prefix}-${id}`,
    email: `${prefix}-${id}@test.com`,
    password: 'password123',
  };
}

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
  it('should fail register of pre seeded user because already seeded', async () => {
    const resReg = await register({
      username: 'user1',
      email: 'user1@test.com',
      password: 'password123',
    });
    expect(resReg.status).toBe(400);
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
    TOKEN_USER1 = resLogin.data.data!.token;

    const res = await updateProfile({ username: 'newNameUser2' }, TOKEN_USER1);
    expect(res.status).toBe(200);
  });

  // ----------------------------------------------------------------------------
  // UPDATE MAIL
  // ----------------------------------------------------------------------------
  it('should update mail for an User', async () => {
    const user = makeUser();
    const formerMail = user.email;
    const newMail = `New${formerMail}`;

    // Register + Validate
    const resReg = await register(user);
    expect(resReg.status).toBe(201);
    const token = resReg.data.data!.token;
    const res = await confirmRegistration({ token });
    expect(res.data.data!.isVerified).toBe(true);

    // Login
    const resLogin = await login({ email: formerMail, password: 'password123' });
    expect(resLogin.status).toBe(200);
    const TokenLogin = resLogin.data.data!.token;

    // Update mail
    const res1 = await updateMail({ email: newMail }, TokenLogin);
    expect(res1.status).toBe(200);
    const confirmTokenEmail = res1.data.data!.token_email;
    console.log('confirmTokenEmail = ', confirmTokenEmail);

    // Read profile
    const res2 = await getProfile(TokenLogin);
    expect(res2.status).toBe(200);

    // Confirm - We can logout to confirm the new mail with the email token password
    const res3 = await confirmUpdateMail({ token: confirmTokenEmail });
    expect(res3.status).toBe(200);

    // Login with New mail
    const resNew = await login({ email: newMail, password: 'password123' });
    expect(resNew.status).toBe(200);
  });

  // ----------------------------------------------------------------------------
  // UPDATE MAIL WITH EXISTING MAIL
  // ----------------------------------------------------------------------------
  it('should fail update mail for User2 ', async () => {
    const user = makeUser();
    const formerMail = user.email;
    const newMail = 'user1@test.com';

    // Register + Validate
    const resReg = await register(user);
    expect(resReg.status).toBe(201);
    const token = resReg.data.data!.token;
    const res = await confirmRegistration({ token });
    expect(res.data.data!.isVerified).toBe(true);

    // Login
    const resLogin = await login({ email: formerMail, password: 'password123' });
    expect(resLogin.status).toBe(200);
    const TokenLogin = resLogin.data.data!.token;

    // Update mail
    const res1 = await updateMail({ email: newMail }, TokenLogin);
    expect(res1.status).toBe(400);
  });

  // ----------------------------------------------------------------------------
  // ----------------------------------------------------------------------------
});
