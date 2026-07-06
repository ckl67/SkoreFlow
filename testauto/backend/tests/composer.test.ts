import path from 'path';
import { beforeAll, describe, expect, it } from 'vitest';

import { login } from '../helpers/auth.js';
import { createComposer, GetComposersPage, GetComposer } from '../helpers/composer';

// ----------------------------------------------------------------------------
// LOCAL HELPER
// ----------------------------------------------------------------------------
function makeComposer(prefix = 'composer') {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  return {
    name: `${prefix}-${id}`,
    externalURL: `https://test.local/${prefix}/${id}`,
    epoch: 'Classical',
  };
}

describe('🎼 Composer API - From the User Point of view', () => {
  let TOKEN_USER1: string;
  let TOKEN_ADMIN: string;
  let TOKEN_MODERATOR1: string;

  // ----------------------------------------------------------------------------
  // SETUP GLOBAL
  // ----------------------------------------------------------------------------

  beforeAll(async () => {
    let res;
    res = await login({
      email: 'admin@admin.com',
      password: 'skoreflow',
    });
    TOKEN_ADMIN = res.data.data!.token;

    res = await login({
      email: 'user1@test.com',
      password: 'password123',
    });
    TOKEN_USER1 = res.data.data!.token;

    res = await login({
      email: 'moderator1@test.com',
      password: 'password123',
    });
    TOKEN_MODERATOR1 = res.data.data!.token;
  });

  // ----------------------------------------------------------------------------
  // SETUP
  // ----------------------------------------------------------------------------
  beforeAll(async () => {});

  // ----------------------------------------------------------------------------
  // LOGIN
  // ----------------------------------------------------------------------------
  it('should confirm login of pre seeded user', async () => {
    const resLogin = await login({
      email: 'user1@test.com',
      password: 'password123',
    });

    expect(resLogin.status).toBe(200);

    TOKEN_USER1 = resLogin.data.data!.token;
  });

  // ----------------------------------------------------------------------------
  // CREATE COMPOSER
  // ----------------------------------------------------------------------------
  it('should create a composer', async () => {
    const filePath = path.resolve(__dirname, '../resources/composers/Frédéric Chopin.png');

    const composer = makeComposer('Chopin');

    const res = await createComposer(composer, filePath, TOKEN_USER1);

    expect(res.status).toBe(201);
    expect(res.data.data!.message).toBe('Composer created successfully');
  });

  // ----------------------------------------------------------------------------
  // SHOULD NOT CREATE COMPOSER BECAUSE ALREADY EXISTS
  // ----------------------------------------------------------------------------
  it('should not create a composer because already exists', async () => {
    const filePath = path.resolve(__dirname, '../resources/composers/Mozart.png');

    const res = await createComposer(
      {
        name: 'Wolfgang Amadeus Mozart',
        externalURL: 'https://fr.wikipedia.org/wiki/Wolfgang_Amadeus_Mozart',
        epoch: 'Classical',
      },
      filePath,
      TOKEN_USER1
    );

    expect(res.status).toBe(409);

    expect(res.data.success).toBe(false);
    expect(res.data.error).toBeDefined();
    expect(res.data.error!.message).toBe('Composer already exists');
  });

  // ----------------------------------------------------------------------------
  // LIST COMPOSERS
  // ----------------------------------------------------------------------------

  it('should get default page of composers - for moderator', async () => {
    const res = await GetComposersPage({}, TOKEN_MODERATOR1);

    expect(res.status).toBe(200);
    expect(res.data.success).toBe(true);

    expect(res.data.data!.page).toBe(1);
    expect(res.data.data!.limit).toBe(10);

    expect(res.data.data!.composers.length).toBeGreaterThan(0);

    expect(res.data.data!.total_rows).toBeGreaterThan(0);
    expect(res.data.data!.total_pages).toBeGreaterThan(0);
  });

  it('should get default page of composers - for Normal User', async () => {
    const res = await GetComposersPage({}, TOKEN_USER1);

    expect(res.status).toBe(200);
    expect(res.data.success).toBe(true);

    expect(res.data.data!.page).toBe(1);
    expect(res.data.data!.limit).toBe(10);

    expect(res.data.data!.composers.length).toBeGreaterThan(0);

    expect(res.data.data!.total_rows).toBeGreaterThan(0);
    expect(res.data.data!.total_pages).toBeGreaterThan(0);
  });

  // ----------------------------------------------------------------------------

  it('should get first page of 50 composers', async () => {
    const res = await GetComposersPage(
      {
        page: 1,
        limit: 50,
      },
      TOKEN_USER1
    );

    expect(res.status).toBe(200);
    expect(res.data.success).toBe(true);

    expect(res.data.data!.page).toBe(1);
    expect(res.data.data!.limit).toBe(50);

    expect(res.data.data!.composers.length).toBeGreaterThan(0);

    expect(res.data.data!.total_rows).toBeGreaterThan(0);
    expect(res.data.data!.total_pages).toBeGreaterThan(0);
  });

  // ----------------------------------------------------------------------------

  it('should sort composers by id asc', async () => {
    const res = await GetComposersPage(
      {
        page: 1,
        limit: 10,
        sort: 'id asc',
      },
      TOKEN_USER1
    );

    expect(res.status).toBe(200);

    const composers = res.data.data!.composers;

    expect(composers.length).toBeGreaterThan(1);

    for (let i = 1; i < composers.length; i++) {
      expect(composers[i].id).toBeGreaterThan(composers[i - 1].id);
    }
  });

  // ----------------------------------------------------------------------------

  it('should sort composers by id desc', async () => {
    const res = await GetComposersPage(
      {
        page: 1,
        limit: 10,
        sort: 'id desc',
      },
      TOKEN_USER1
    );

    expect(res.status).toBe(200);

    const composers = res.data.data!.composers;

    expect(composers.length).toBeGreaterThan(1);

    for (let i = 1; i < composers.length; i++) {
      expect(composers[i].id).toBeLessThan(composers[i - 1].id);
    }
  });

  // ----------------------------------------------------------------------------

  it('should fallback on invalid sort', async () => {
    const res = await GetComposersPage(
      {
        page: 1,
        limit: 10,
        sort: 'drop table composers',
      },
      TOKEN_USER1
    );

    expect(res.status).toBe(200);
    expect(res.data.success).toBe(true);
    expect(res.data.data!.composers.length).toBeGreaterThan(0);
  });

  // ----------------------------------------------------------------------------

  it('should paginate composers', async () => {
    const page1 = await GetComposersPage(
      {
        page: 1,
        limit: 2,
        sort: 'id asc',
      },
      TOKEN_USER1
    );

    const page2 = await GetComposersPage(
      {
        page: 2,
        limit: 2,
        sort: 'id asc',
      },
      TOKEN_USER1
    );

    expect(page1.status).toBe(200);
    expect(page2.status).toBe(200);

    expect(page1.data.data!.composers[0].id).not.toBe(page2.data.data!.composers[0].id);
  });

  // ----------------------------------------------------------------------------

  it('should reject composers page without token', async () => {
    const res = await GetComposersPage({}, '');

    expect(res.status).toBe(401);
  });

  // ----------------------------------------------------------------------------
  // LIST USER
  // ----------------------------------------------------------------------------

  it('should get one composer by id', async () => {
    const composerId = 1;

    const res = await GetComposer(composerId, TOKEN_USER1);

    expect(res.status).toBe(200);
    expect(res.data.success).toBe(true);

    console.log(res.data.data!.composer.id);
    expect(res.data.data!.composer.id).toBe(composerId);
  });

  // ----------------------------------------------------------------------------

  it('should return 404 for unknown composer', async () => {
    const res = await GetComposer(999999, TOKEN_ADMIN);

    expect(res.status).toBe(404);
  });

  // ----------------------------------------------------------------------------
  // ----------------------------------------------------------------------------
});
