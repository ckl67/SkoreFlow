import { describe, it, expect, beforeAll } from 'vitest';
import { request } from '../helpers/api.js';

import { BASE_URL } from '../config.js';

// --------------------------------------------------------------------------------
// BASIC SMOKE TESTS
// --------------------------------------------------------------------------------

describe('🚦 Smoke Tests - API Basics', () => {
  beforeAll(() => {
    console.log('⚠️ Server must be RUN ! ');
  });

  it('should pass health check', async () => {
    const res = await request('GET', `${BASE_URL}/health`);

    expect(res.status).toBe(200);
    expect(res.data).toBeTruthy();
  });

  it('should return version info', async () => {
    const res = await request('GET', `${BASE_URL}/version`);

    expect(res.status).toBe(200);
    expect(res.data).toBeTruthy();
  });

  it('should access API root', async () => {
    const res = await request('GET', `${BASE_URL}/api`);

    expect(res.status).toBe(200);
    expect(res.data).toBeTruthy();
  });
});
