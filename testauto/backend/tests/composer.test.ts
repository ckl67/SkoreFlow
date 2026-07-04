import path from 'path';
import { beforeAll, describe, expect, it } from 'vitest';

import { login } from '../helpers/auth.js';
import { createComposer } from '../helpers/composer';

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
});
