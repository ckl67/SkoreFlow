import { describe, it, expect } from 'vitest';

import { register } from '../helpers/auth.js';

describe('🧪 Stress tests - Production or Development Mode ', () => {
  // ----------------------------------------------------------------------------
  // TEST RATE LIMIT
  // ----------------------------------------------------------------------------

  it('should rate limit register endpoint', async () => {
    const requests = [];

    for (let i = 0; i < 10; i++) {
      requests.push(
        register({
          username: `spam${i}`,
          email: `spam${i}@test.com`,
          password: 'password123',
        }),
      );
    }

    const responses = await Promise.all(requests);

    const has429 = responses.some((r) => r.status === 429);

    expect(has429).toBe(true);
  });

  // ----------------------------------------------------------------------------
  // ----------------------------------------------------------------------------
});
