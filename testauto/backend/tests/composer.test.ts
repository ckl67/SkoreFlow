import { login } from '../helpers/auth.js';
import { createComposer } from '../helpers/composer.js';

// --------------------------------------------------------------------------------
// MAIN TEST
// --------------------------------------------------------------------------------
// async meaning that it returns a Promise because we are using : await
async function run() {
  console.log('\n=================================');
  console.log('🚀 STARTING COMPOSER TESTS (Node)');
  console.log('=================================');

  // ----------------------------------------------------------------------------
  //await sleep(2000);

  // ----------------------------------------------------------------------------
  // CREATE USERS
  // ----------------------------------------------------------------------------
  console.log('\n--- Creating Composers ---');

  const TOKEN_USER2 = await login('user2@test.com', 'password123');

  const composers = [
    {
      name: 'Mozart3',
      description: 'Classic',
      file: '',
      verified: true,
    },
    {
      name: 'Beethoven',
      description: 'Twenty century',
      file: 'resources/composers/Beethoven.png',
      verified: false,
    },
    {
      name: 'SuperTramp',
      description: 'Moderne',
      file: 'resources/composers/Supertramp.png',
      verified: true,
    },
  ];

  for (const c of composers) {
    await createComposer(
      {
        name: c.name,
        externalURL: '',
        epoch: c.description,
        uploadFile: c.file,
        isVerified: c.verified,
      },
      TOKEN_USER2,
    );
  }
}

run().catch((err) => {
  console.error('💥 ERROR:', err.message);
  process.exit(1);
});
