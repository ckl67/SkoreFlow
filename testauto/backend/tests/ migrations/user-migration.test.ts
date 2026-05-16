import { beforeAll, describe, expect, it } from 'vitest';
import Database from 'better-sqlite3';
import fs from 'fs';

const DB_PATH = './tmp/migration-test.db';

type UserRow = {
  id: number;
  username: string;
  email: string;
  password: string;
  pending_email?: string | null;
};

describe('Database migration compatibility', () => {
  beforeAll(async () => {
    // Cleanup previous DB
    if (fs.existsSync(DB_PATH)) {
      fs.unlinkSync(DB_PATH);
    }

    // ------------------------------------------------------------------
    // STEP 1:
    // Simulate an OLD database schema (before pending_email existed)
    // ------------------------------------------------------------------

    const db = new Database(DB_PATH);

    db.exec(`
      CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT,
        email TEXT,
        password TEXT
      );
    `);

    db.exec(`
      INSERT INTO users (username, email, password)
      VALUES (
        'old_user',
        'old@test.com',
        'hashed_password'
      );
    `);

    db.close();

    // ------------------------------------------------------------------
    // STEP 2:
    // Start CURRENT backend
    //
    // IMPORTANT:
    // Your Go backend must use this exact DB_PATH
    // and execute AutoMigrate()
    // ------------------------------------------------------------------

    // Example:
    //
    // process.env.DB_PATH = DB_PATH;
    // await startBackend();
    //
    // Depending on your existing setup.
  });

  it('should preserve old data after migration', async () => {
    const db = new Database(DB_PATH);

    // ----------------------------------------------------------
    // STEP 3:
    // Verify old data still exists
    // ----------------------------------------------------------

    const user = db.prepare(`SELECT * FROM users WHERE email = ?`).get('old@test.com') as
      | UserRow
      | undefined;

    expect(user).toBeDefined();
    expect(user!.username).toBe('old_user');

    // ----------------------------------------------------------
    // STEP 4:
    // Verify new column now exists
    // ----------------------------------------------------------

    const columns = db.prepare(`PRAGMA table_info(users)`).all() as UserRow[];

    const hasPendingEmail = columns.some((c) => c.email === 'pending_email');

    expect(hasPendingEmail).toBe(true);

    db.close();
  });
});
