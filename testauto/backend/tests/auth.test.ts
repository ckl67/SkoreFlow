import { describe, it, expect, beforeAll } from 'vitest';

import {
  register,
  confirmRegistration,
  ResendRegistration,
  expireToken,
  login,
  ForgotPassword,
  logout,
  ResetPassword,
} from '../helpers/auth.js';

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

describe('👤 Authentication  API - From the User Point of view', () => {
  let TOKEN_ADMIN: string;

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
  // REGISTER USER
  // CONFIRM REGISTRATION + LOGIN
  // ----------------------------------------------------------------------------
  it('should confirm registration of user and login', async () => {
    const user = makeUser();

    const resReg = await register(user);
    expect(resReg.status).toBe(201);
    const token = resReg.data.data!.token;

    const res = await confirmRegistration({
      token,
    });
    expect(res.status).toBe(200);
    expect(res.data.data!.isVerified).toBe(true);

    const resLogin = await login({ email: user.email, password: user.password });
    expect(resLogin.status).toBe(200);
  });

  // ----------------------------------------------------------------------------
  // FAIL WITH INVALID EMAIL
  // ----------------------------------------------------------------------------
  it('should fail with invalid email', async () => {
    const user = makeUser();

    const res = await register({
      username: user.username,
      email: 'wrong.email',
      password: user.password,
    });

    expect(res.status).toBe(400);
  });

  // ----------------------------------------------------------------------------
  // FAIL WITH DUPLICATE EMAIL
  // ----------------------------------------------------------------------------
  it('should fail with duplicate email', async () => {
    const user = makeUser();

    const res1 = await register(user);
    expect(res1.status).toBe(201);

    const res2 = await register(user);
    expect(res2.status).toBe(400);
  });

  // ----------------------------------------------------------------------------
  // FAIL WITH INVALID TOKEN
  // ----------------------------------------------------------------------------
  it('should reject invalid token', async () => {
    const user = makeUser();

    const res1 = await register(user);
    expect(res1.status).toBe(201);
    const token = res1.data.data!.token;

    // Wrong token
    const res2 = await confirmRegistration({
      token: 'abcde123',
    });
    expect(res2.status).toBe(400);

    // Good token
    const res3 = await confirmRegistration({
      token,
    });
    expect(res3.status).toBe(200);
  });

  // ----------------------------------------------------------------------------
  // FAIL WITH EXPIRED TOKEN
  // ----------------------------------------------------------------------------
  it('should reject expired token', async () => {
    const user = makeUser();

    const resRegister = await register(user);
    expect(resRegister.status).toBe(201);
    const token = resRegister.data.data!.token;
    expect(token).toBeDefined();
    expect(resRegister.data.data!.isVerified).toBe(false);

    // Force expiration
    const resExpire = await expireToken(user.email, TOKEN_ADMIN);
    expect(resExpire.status).toBe(200);

    // Try confirm
    const resConfirm = await confirmRegistration({ token });
    expect(resConfirm.status).toBe(400);

    // Resend
    const resResend = await ResendRegistration({ email: user.email });
    expect(resResend.status).toBe(200);
    const tokenResend = resResend.data.data!.token;
    expect(tokenResend).toBeDefined();

    // Confirm again
    const resConfirmResend = await confirmRegistration({ token: tokenResend });
    expect(resConfirmResend.status).toBe(200);
  });

  // ----------------------------------------------------------------------------
  // LOGIN WITHOUT CONFIRMATION
  // ----------------------------------------------------------------------------
  it('should fail login attempt before confirmation', async () => {
    const user = makeUser();

    // Register
    const resRegister = await register(user);
    expect(resRegister.status).toBe(201);
    const token = resRegister.data.data!.token;

    // Login before confirmation
    const res1 = await login({ email: user.email, password: user.password });
    expect(res1.status).toBe(401);

    // Confirm
    const res2 = await confirmRegistration({ token });
    expect(res2.status).toBe(200);

    // Login after confirmation
    const res3 = await login({ email: user.email, password: user.password });
    expect(res3.status).toBe(200);
  });

  // ----------------------------------------------------------------------------
  // PASSWORD FORGOT + RESEND
  // ----------------------------------------------------------------------------
  it('should succeed for password forgot', async () => {
    const user = makeUser();

    // Register
    const res1 = await register(user);
    expect(res1.status).toBe(201);
    const token = res1.data.data!.token;

    // Confirm
    const res2 = await confirmRegistration({ token });
    expect(res2.status).toBe(200);

    // Login
    const res3 = await login({ email: user.email, password: user.password });
    expect(res3.status).toBe(200);

    // Logout
    const res4 = await logout();
    expect(res4.status).toBe(200);

    // Request Password
    const res5 = await ForgotPassword({ email: user.email });
    expect(res5.status).toBe(200);
    const tokenFP = res5.data.data!.token;
    expect(tokenFP).toBeDefined();

    //New Password
    const res6 = await ResetPassword({ token: tokenFP, password: 'NewPassword123#' });
    expect(res6.status).toBe(200);

    // New Login
    const res7 = await login({ email: user.email, password: 'NewPassword123#' });
    expect(res7.status).toBe(200);
  });

  // ----------------------------------------------------------------------------
  // ----------------------------------------------------------------------------
});
