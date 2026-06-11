import { beforeAll, afterEach, afterAll } from 'vitest';
import { server } from './msw/server';
import '@testing-library/jest-dom';

// Start MSW
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
