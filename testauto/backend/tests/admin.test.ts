import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { login } from '../helpers/auth.js';
import {
  adminCreateUser,
  adminGetUsersPage,
  adminGetUser,
  adminUpdateUser,
  adminDeleteUser,
} from '../helpers/admin';

import { getProfile, uploadAvatar } from '../helpers/user.js';

// ----------------------------------------------------------------------------
// CONSTANTS
// ----------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Need some clarifications
// With  "type": "module" we are using ESM (ECMAScript Modules) and not CommonJS --> So __filename and __dirname are not existing
// we have to use : import.meta.url

console.log('file', import.meta.url);
console.log('__filename', __filename);
console.log('__dirname', __dirname);

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

describe('👤 User API from admin perspective ', () => {
  let TOKEN_ADMIN: string;

  // ----------------------------------------------------------------------------
  // SETUP GLOBAL
  // ----------------------------------------------------------------------------
  beforeAll(async () => {
    const res = await login({
      email: 'admin@admin.com',
      password: 'skoreflow',
    });

    TOKEN_ADMIN = res.data.data!.token;
  });

  // ----------------------------------------------------------------------------
  // CREATE USERS
  // ----------------------------------------------------------------------------
  it('should create users', async () => {
    const u = makeUser();
    const res = await adminCreateUser(
      { username: u.username, email: u.email, password: 'password123' },
      TOKEN_ADMIN
    );
    expect(res.status).toBe(201);
    expect(res.data.data!.user_id).toBeGreaterThan(0);
    console.log('userId', res.data.data!.user_id);
  });

  // ----------------------------------------------------------------------------
  // LIST USERS
  // ----------------------------------------------------------------------------

  it('should get default page of users', async () => {
    const res = await adminGetUsersPage({}, TOKEN_ADMIN);

    expect(res.status).toBe(200);
    expect(res.data.success).toBe(true);

    expect(res.data.data!.page).toBe(1);
    expect(res.data.data!.limit).toBe(10);

    expect(res.data.data!.users.length).toBeGreaterThan(0);

    expect(res.data.data!.total_rows).toBeGreaterThan(0);
    expect(res.data.data!.total_pages).toBeGreaterThan(0);
  });

  // ----------------------------------------------------------------------------

  it('should get first page of 50 users', async () => {
    const res = await adminGetUsersPage(
      {
        page: 1,
        limit: 50,
      },
      TOKEN_ADMIN
    );

    expect(res.status).toBe(200);
    expect(res.data.success).toBe(true);

    expect(res.data.data!.page).toBe(1);
    expect(res.data.data!.limit).toBe(50);

    expect(res.data.data!.users.length).toBeGreaterThan(0);

    expect(res.data.data!.total_rows).toBeGreaterThan(0);
    expect(res.data.data!.total_pages).toBeGreaterThan(0);
  });

  // ----------------------------------------------------------------------------

  it('should sort users by id asc', async () => {
    const res = await adminGetUsersPage(
      {
        page: 1,
        limit: 10,
        sort: 'id asc',
      },
      TOKEN_ADMIN
    );

    expect(res.status).toBe(200);

    const users = res.data.data!.users;

    expect(users.length).toBeGreaterThan(1);

    for (let i = 1; i < users.length; i++) {
      expect(users[i].id).toBeGreaterThan(users[i - 1].id);
    }
  });

  // ----------------------------------------------------------------------------

  it('should sort users by id desc', async () => {
    const res = await adminGetUsersPage(
      {
        page: 1,
        limit: 10,
        sort: 'id desc',
      },
      TOKEN_ADMIN
    );

    expect(res.status).toBe(200);

    const users = res.data.data!.users;

    expect(users.length).toBeGreaterThan(1);

    for (let i = 1; i < users.length; i++) {
      expect(users[i].id).toBeLessThan(users[i - 1].id);
    }
  });

  // ----------------------------------------------------------------------------

  it('should fallback on invalid sort', async () => {
    const res = await adminGetUsersPage(
      {
        page: 1,
        limit: 10,
        sort: 'drop table users',
      },
      TOKEN_ADMIN
    );

    expect(res.status).toBe(200);
    expect(res.data.success).toBe(true);
    expect(res.data.data!.users.length).toBeGreaterThan(0);
  });

  // ----------------------------------------------------------------------------

  it('should paginate users', async () => {
    const page1 = await adminGetUsersPage(
      {
        page: 1,
        limit: 5,
        sort: 'id asc',
      },
      TOKEN_ADMIN
    );

    const page2 = await adminGetUsersPage(
      {
        page: 2,
        limit: 5,
        sort: 'id asc',
      },
      TOKEN_ADMIN
    );

    expect(page1.status).toBe(200);
    expect(page2.status).toBe(200);

    expect(page1.data.data!.users[0].id).not.toBe(page2.data.data!.users[0].id);
  });

  // ----------------------------------------------------------------------------

  it('should reject users page without token', async () => {
    const res = await adminGetUsersPage({}, '');

    expect(res.status).toBe(401);
  });

  // ----------------------------------------------------------------------------

  it('should reject users page for standard user', async () => {
    const loginRes = await login({
      email: 'user1@test.com',
      password: 'password123',
    });

    const token = loginRes.data.data!.token;

    const res = await adminGetUsersPage({}, token);

    expect(res.status).toBe(403);
  });

  // ----------------------------------------------------------------------------
  // LIST USER
  // ----------------------------------------------------------------------------

  it('should get one user by id', async () => {
    const u = makeUser();
    const createRes = await adminCreateUser(
      { username: u.username, email: u.email, password: 'password123' },
      TOKEN_ADMIN
    );

    expect(createRes.status).toBe(201);

    const userId = createRes.data.data!.user_id;

    const res = await adminGetUser(userId, TOKEN_ADMIN);

    expect(res.status).toBe(200);
    expect(res.data.success).toBe(true);

    console.log(res.data.data!.user.id);
    expect(res.data.data!.user.id).toBe(userId);
  });

  // ----------------------------------------------------------------------------

  it('should return 404 for unknown user', async () => {
    const res = await adminGetUser(999999, TOKEN_ADMIN);

    expect(res.status).toBe(404);
  });

  // ----------------------------------------------------------------------------
  // UPDATED USER
  // ----------------------------------------------------------------------------

  it('should update user', async () => {
    const u = makeUser();

    const createRes = await adminCreateUser(
      {
        username: u.username,
        email: u.email,
        password: u.password,
      },
      TOKEN_ADMIN
    );

    const userId = createRes.data.data!.user_id;

    const updated = makeUser('updated');

    const updateRes = await adminUpdateUser(
      {
        username: updated.username,
        email: updated.email,
        password: 'new_password123',
        isVerified: true,
      },
      userId,
      TOKEN_ADMIN
    );

    expect(updateRes.status).toBe(200);
    expect(updateRes.data.success).toBe(true);

    expect(updateRes.data.data!.user.username).toBe(updated.username);
    expect(updateRes.data.data!.user.email).toBe(updated.email);
    expect(updateRes.data.data!.user.isVerified).toBe(true);
  });

  // ----------------------------------------------------------------------------
  it('should reject duplicate username', async () => {
    const u = makeUser();

    const createRes = await adminCreateUser(
      {
        username: u.username,
        email: u.email,
        password: u.password,
      },
      TOKEN_ADMIN
    );

    const userId = createRes.data.data!.user_id;

    const updateRes = await adminUpdateUser(
      {
        username: 'user1',
        email: u.email,
        password: u.password,
        isVerified: true,
      },
      userId,
      TOKEN_ADMIN
    );

    expect(updateRes.status).toBe(409);
    expect(updateRes.data.success).toBe(false);
    expect(updateRes.data.error?.message).toContain('Username');
  });

  // ----------------------------------------------------------------------------

  it('should reject duplicate user mail', async () => {
    const u = makeUser();

    const createRes = await adminCreateUser(
      {
        username: u.username,
        email: u.email,
        password: u.password,
      },
      TOKEN_ADMIN
    );

    const userId = createRes.data.data!.user_id;

    const updateRes = await adminUpdateUser(
      {
        username: u.username,
        email: 'user1@test.com',
        password: u.password,
        isVerified: true,
      },
      userId,
      TOKEN_ADMIN
    );

    expect(updateRes.status).toBe(409);
    expect(updateRes.data.success).toBe(false);
    expect(updateRes.data.error?.message).toContain('email');
  });

  // ----------------------------------------------------------------------------

  it('should return 404 when user does not exist', async () => {
    const updateRes = await adminUpdateUser(
      {
        username: 'ghost',
        email: 'ghost@test.com',
        password: 'password123',
        isVerified: true,
      },
      999999,
      TOKEN_ADMIN
    );

    expect(updateRes.status).toBe(404);
    expect(updateRes.data.success).toBe(false);
  });

  // ----------------------------------------------------------------------------
  // DELETE USER
  // ----------------------------------------------------------------------------

  it('should delete user', async () => {
    const u = makeUser();

    const createRes = await adminCreateUser(u, TOKEN_ADMIN);

    const userId = createRes.data.data!.user_id;

    const deleteRes = await adminDeleteUser(userId, TOKEN_ADMIN);

    expect(deleteRes.status).toBe(200);
    expect(deleteRes.data.success).toBe(true);

    const getRes = await adminGetUser(userId, TOKEN_ADMIN);

    expect(getRes.status).toBe(404);
  });

  // ----------------------------------------------------------------------------

  it('should return 404 when deleting unknown user', async () => {
    const deleteRes = await adminDeleteUser(999999, TOKEN_ADMIN);

    expect(deleteRes.status).toBe(404);
  });

  // ----------------------------------------------------------------------------

  it('should prevent admin from deleting itself', async () => {
    const profileRes = await getProfile(TOKEN_ADMIN);

    const adminId = profileRes.data.data!.user.id;

    const deleteRes = await adminDeleteUser(adminId, TOKEN_ADMIN);

    expect(deleteRes.status).toBe(403);
  });

  // ----------------------------------------------------------------------------

  it('should delete user and avatar', async () => {
    const u = makeUser();

    const createRes = await adminCreateUser(u, TOKEN_ADMIN);
    const userId = createRes.data.data!.user_id;

    const loginRes = await login({
      email: u.email,
      password: u.password,
    });

    const token = loginRes.data.data!.token;

    await uploadAvatar(path.join(__dirname, '../resources/avatars/avatar-man1.png'), token);

    const deleteRes = await adminDeleteUser(userId, TOKEN_ADMIN);

    expect(deleteRes.status).toBe(200);
  });

  // ----------------------------------------------------------------------------

  it('will create an orphan file - to be deleted later', async () => {
    // For clean run
    //  go run ./cmd/cli/main.go -cleanup-avatars

    const sourceAvatar = path.join(__dirname, '../resources/avatars/avatar-man1.png');
    const orphanAvatar = path.join(__dirname, '../../../backend/storage/users/orphan-test.png');

    // console.log('__dirname:', __dirname);
    console.log('sourceAvatar:', sourceAvatar);
    console.log('orphanAvatar:', orphanAvatar);

    fs.copyFileSync(sourceAvatar, orphanAvatar);
    expect(fs.existsSync(orphanAvatar)).toBe(true);

    console.log('\n --------------------------------------------');
    console.log(' You can clean the avatar orphan file with command');
    console.log(' go run ./cmd/cli/main.go -cleanup-avatars ');
    console.log(' --------------------------------------------\n');
  });

  // ----------------------------------------------------------------------------
  // ----------------------------------------------------------------------------
});
