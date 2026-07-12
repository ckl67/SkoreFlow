import { describe, it, expect, beforeAll } from 'vitest';

import { login, register, confirmRegistration, confirmUpdateMail } from '../helpers/auth.js';
import {
  getProfile,
  updateProfile,
  updateMail,
  uploadAvatar,
  uploadEmptyAvatarFile,
  DeleteAvatar,
} from '../helpers/user.js';

import path from 'path';
import { fileURLToPath } from 'url';

// ----------------------------------------------------------------------------
// CONSTANTS
// ----------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Need some clarifications
// With  "type": "module" we are using ESM (ECMAScript Modules) and not CommonJS --> So __filename and __dirname are not existing
// we have to use : import.meta.url

// console.log('file', import.meta.url);
// console.log('__filename', __filename);
// console.log('__dirname', __dirname);

const VALID_AVATAR = path.join(__dirname, '../resources/users/avatar-man2.png');
const INVALID_AVATAR = path.join(__dirname, '../resources/users/invalid.txt');
const LARGE_AVATAR = path.join(__dirname, '../resources/users/avatar-too-large.jpg');

// ----------------------------------------------------------------------------
// TYPE
// ----------------------------------------------------------------------------
type TestUser = {
  username: string;
  email: string;
  password: string;
};
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
// ----------------------------------------------------------------------------

describe('👤 User  API - From the User Point of view', () => {
  let TOKEN_USER1: string;
  let TOKEN_USER2: string;
  // ----------------------------------------------------------------------------
  // SETUP
  // ----------------------------------------------------------------------------
  beforeAll(async () => {});

  // ----------------------------------------------------------------------------
  // REGISTER USER
  // ----------------------------------------------------------------------------
  it('should confirm login of pre seeded user', async () => {
    const resLogin = await login({ email: 'user1@test.com', password: 'password123' });
    expect(resLogin.status).toBe(200);
    TOKEN_USER1 = resLogin.data.data!.token;
  });

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
  // PROFILE
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
  // AVATAR
  // ----------------------------------------------------------------------------

  it('should upload avatar', async () => {
    const resLogin = await login({ email: 'user1@test.com', password: 'password123' });
    if (resLogin.status !== 200) {
      console.log('LOGIN FAILED RESPONSE:', resLogin.data);
    }

    expect(resLogin.status).toBe(200);
    expect(resLogin.data.success).toBe(true);

    TOKEN_USER1 = resLogin.data.data!.token;

    const res = await getProfile(TOKEN_USER1);
    expect(res.status).toBe(200);

    const uploadRes = await uploadAvatar(VALID_AVATAR, TOKEN_USER1);

    expect(uploadRes.status).toBe(200);
    expect(uploadRes.data.success).toBe(true);
    expect(uploadRes.data.data!.user.avatar).not.toBe('');

    console.log('avatar:', uploadRes.data.data!.user.avatar);
    expect(uploadRes.data.data!.user.avatar).toContain('users/user-2.png');
  });

  // ----------------------------------------------------------------------------

  it('for random user should upload avatar', async () => {
    const user = makeUser();

    // Register + Validate
    const resReg = await register(user);
    expect(resReg.status).toBe(201);
    const token = resReg.data.data!.token;
    const res = await confirmRegistration({ token });
    expect(res.data.data!.isVerified).toBe(true);

    // Login
    const resLogin = await login({ email: user.email, password: 'password123' });
    expect(resLogin.status).toBe(200);
    const TokenLogin = resLogin.data.data!.token;

    const uploadRes = await uploadAvatar(VALID_AVATAR, TokenLogin);
    expect(uploadRes.status).toBe(200);
    expect(uploadRes.data.success).toBe(true);
    expect(uploadRes.data.data!.user.avatar).not.toBe('');

    const profileRes = await getProfile(TokenLogin);
    const Id = profileRes.data.data!.user.id;

    console.log('avatar:', uploadRes.data.data!.user.avatar);
    expect(uploadRes.data.data!.user.avatar).toContain(`users/user-${Id}.png`);
  });

  // ----------------------------------------------------------------------------

  it('should reject upload without file', async () => {
    const resLogin = await login({
      email: 'user1@test.com',
      password: 'password123',
    });

    const token = resLogin.data.data!.token;
    const uploadRes = await uploadEmptyAvatarFile(token);
    expect(uploadRes.status).toBe(400);
    expect(uploadRes.data.success).toBe(false);
  });

  // ----------------------------------------------------------------------------

  it('should reject invalid avatar extension', async () => {
    const resLogin = await login({
      email: 'user1@test.com',
      password: 'password123',
    });

    const token = resLogin.data.data!.token;

    const uploadRes = await uploadAvatar(INVALID_AVATAR, token);

    expect(uploadRes.status).toBe(400);
    expect(uploadRes.data.success).toBe(false);
  });

  // ----------------------------------------------------------------------------

  it('should reject avatar larger than allowed size', async () => {
    const resLogin = await login({
      email: 'user1@test.com',
      password: 'password123',
    });

    const token = resLogin.data.data!.token;

    const uploadRes = await uploadAvatar(LARGE_AVATAR, token);

    expect(uploadRes.status).toBe(400);
    expect(uploadRes.data.success).toBe(false);
  });

  // ----------------------------------------------------------------------------
  // DELETE AVATAR
  // ----------------------------------------------------------------------------

  it('should delete avatar', async () => {
    const resLogin = await login({
      email: 'user2@test.com',
      password: 'password123',
    });
    expect(resLogin.status).toBe(200);

    TOKEN_USER2 = resLogin.data.data!.token;
    // Upload Avatar
    const uploadRes = await uploadAvatar(
      path.join(__dirname, '../resources/users/avatar-man1.png'),
      TOKEN_USER2
    );
    expect(uploadRes.status).toBe(200);

    const profileRes1 = await getProfile(TOKEN_USER2);
    expect(profileRes1.status).toBe(200);
    expect(profileRes1.data.data!.user.avatar).toBe('users/user-3.png');

    // Delete Avatar
    const delRes = await DeleteAvatar(TOKEN_USER2);
    expect(delRes.status).toBe(200);

    const profileRes = await getProfile(TOKEN_USER2);
    expect(profileRes.status).toBe(200);
    expect(profileRes.data.data!.user.avatar).toBe('users/default.png');
  });

  // ----------------------------------------------------------------------------

  it('should delete avatar twice without error', async () => {
    const loginRes = await login({
      email: 'user2@test.com',
      password: 'password123',
    });

    const token = loginRes.data.data!.token;

    await uploadAvatar(path.join(__dirname, '../resources/users/avatar-man2.png'), token);

    let res = await DeleteAvatar(token);
    expect(res.status).toBe(200);

    res = await DeleteAvatar(token);
    expect(res.status).toBe(200);
  });

  // ----------------------------------------------------------------------------

  it('should reject avatar deletion without authentication', async () => {
    const res = await DeleteAvatar('');

    expect(res.status).toBe(401);
  });

  // ----------------------------------------------------------------------------
  // ----------------------------------------------------------------------------
});
