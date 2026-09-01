// cspell:ignore Turque   pdff
import path from 'path';
import { beforeAll, describe, expect, it } from 'vitest';

import { login } from '../helpers/auth.js';
import { createScore } from '../helpers/score';

import { CreateScorePayload } from '../../../shared/types/score.js';

import { getComposersByName } from '../helpers/composer.js';
// ----------------------------------------------------------------------------
// LOCAL HELPER
// ----------------------------------------------------------------------------
function makeScore(composer_id: number, score_name: string): CreateScorePayload {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  return {
    composerId: composer_id,
    scoreName: `${score_name}-${id}`,
    releaseDate: '1962',
    categories: '',
    tags: '',
    informationText: '',
    annotations: '',
  };
}

// ----------------------------------------------------------------------------

// Could theoretically provide several composers !
async function getComposerId(composerName: string, token: string): Promise<number> {
  const resComposer = await getComposersByName(composerName, token);

  expect(resComposer.status).toBe(200);

  // .find(...) — The array search method
  // .find() is a native JavaScript method for arrays.
  // It iterates through the elements of the array one by one and executes the callback function passed as a parameter.
  // How it works: It stops as soon as it finds the first element that satisfies the condition and returns it.
  // If no element matches, it returns undefined.
  //
  // (composer) => composer.name === 'Wolfgang Amadeus Mozart' — The predicate (callback)
  // This is an arrow function called for each element in the composers array.
  // (composer) represents the current element in the array during the iteration.
  //  composer.name === '...' checks whether the name property of that element is exactly equal to the string 'Wolfgang Amadeus Mozart'.
  const composer = resComposer.data.data?.composers.find((composer) => composer.name === composerName);
  expect(composer).toBeDefined();

  if (!composer) {
    throw new Error('Test setup error: Wolfgang Amadeus Mozart was not found');
  }

  console.log('Composer id :', composer.id);
  return composer.id;
}

// ----------------------------------------------------------------------------
// ----------------------------------------------------------------------------

describe('🎼 Score API - From the User Point of view', () => {
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
  // CREATE SCORE
  // ----------------------------------------------------------------------------
  it('should create a score', async () => {
    const composerId = await getComposerId('Wolfgang Amadeus Mozart', TOKEN_USER1);
    const score = makeScore(composerId, 'La Marche Turque');

    const filePath = path.resolve(__dirname, '../resources/scores/Amadeus Mozart/La Marche Turque.pdf');
    const res = await createScore(score, filePath, TOKEN_USER1);

    expect(res.status).toBe(201);
    expect(res.data.data!.message).toBe('Score created successfully');
  });

  // ----------------------------------------------------------------------------
  // SHOULD NOT CREATE SCORE BECAUSE ALREADY EXISTS
  // ----------------------------------------------------------------------------

  it('should not create a score because already exists', async () => {
    const filePath = path.resolve(__dirname, '../resources/scores/Amadeus Mozart/La Marche Turque.pdf');

    const composerId = await getComposerId('Wolfgang Amadeus Mozart', TOKEN_USER1);

    const score = makeScore(composerId, 'La Marche Turque');
    const res1 = await createScore(score, filePath, TOKEN_USER1);
    const res2 = await createScore(score, filePath, TOKEN_USER1);

    expect(res1.status).toBe(201);
    expect(res2.status).toBe(409);
    expect(res2.data.error!.message).toBe('score already exists for this user and composer');
  });

  // ----------------------------------------------------------------------------
  // SHOULD NOT CREATE BECAUSE COMPOSER NOT EXISTS
  // ----------------------------------------------------------------------------

  it('should not create a score because composer does not exist', async () => {
    const filePath = path.resolve(__dirname, '../resources/scores/Amadeus Mozart/La Marche Turque.pdf');

    const score = makeScore(999999, 'Score with invalid composer');

    const res = await createScore(score, filePath, TOKEN_USER1);

    expect(res.status).toBe(400);
    expect(res.data.error!.message).toBe('composer not found');
  });

  // ----------------------------------------------------------------------------
  // SHOULD NOT CREATE BECAUSE MISSING PARAMETERS
  // ----------------------------------------------------------------------------

  it('should not create a score because missing file ', async () => {
    const composerId = await getComposerId('Iron Maiden', TOKEN_USER1);

    const score = makeScore(composerId, 'La Marche Turque');
    const res = await createScore(score, '', TOKEN_USER1);
    expect(res.status).toBe(400);
  });

  it('should not create a score because wrong file ', async () => {
    const filePath = path.resolve(__dirname, '../resources/scores/Amadeus Mozart/La Marche Turque.pdff');

    const composerId = await getComposerId('Iron Maiden', TOKEN_USER1);

    const score = makeScore(composerId, 'La Marche Turque');
    const res = await createScore(score, filePath, TOKEN_USER1);
    expect(res.status).toBe(400);
  });

  // ----------------------------------------------------------------------------
  // SHOULD ACCEPT DIFFERENT DATE FORMAT
  // ----------------------------------------------------------------------------

  it.each(['1962', '1962-05-14', '1962-05-14T00:00:00Z'])('should accept release date "%s"', async (releaseDate) => {
    const composerId = await getComposerId('Wolfgang Amadeus Mozart', TOKEN_USER1);
    const score = makeScore(composerId, 'La Marche Turque');

    const filePath = path.resolve(__dirname, '../resources/scores/Amadeus Mozart/La Marche Turque.pdf');
    const res = await createScore(
      {
        composerId: score.composerId,
        scoreName: score.scoreName,
        releaseDate: releaseDate,
        categories: score.categories,
        tags: score.tags,
        informationText: score.informationText,
        annotations: score.annotations,
      },
      filePath,
      TOKEN_USER1
    );

    expect(res.status).toBe(201);
    expect(res.data.data!.message).toBe('Score created successfully');
  });

  // ----------------------------------------------------------------------------
  // SHOULD NOT ACCEPT DIFFERENT DATE FORMAT
  // ----------------------------------------------------------------------------

  it.each(['1962-13-01', '1962-99-99'])('should not accept release date "%s"', async (releaseDate) => {
    const composerId = await getComposerId('Wolfgang Amadeus Mozart', TOKEN_USER1);
    const score = makeScore(composerId, 'La Marche Turque');

    const filePath = path.resolve(__dirname, '../resources/scores/Amadeus Mozart/La Marche Turque.pdf');
    const res = await createScore(
      {
        composerId: score.composerId,
        scoreName: score.scoreName,
        releaseDate: releaseDate,
        categories: score.categories,
        tags: score.tags,
        informationText: score.informationText,
        annotations: score.annotations,
      },
      filePath,
      TOKEN_USER1
    );

    expect(res.status).toBe(404);
    expect(res.data.error!.message).toBe('invalid date format');
  });

  // ----------------------------------------------------------------------------
  // ----------------------------------------------------------------------------
});
