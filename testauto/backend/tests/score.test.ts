// cspell:ignore Turque   pdff
import path from 'path';
import { beforeAll, describe, expect, it } from 'vitest';

import { login } from '../helpers/auth.js';

import { createScore } from '../helpers/score';
import { CreateScorePayload } from '../../../shared/types/score.js';

import { getComposersByName } from '../helpers/composer.js';

import { GetScoresPage, GetScore } from '../helpers/score';

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
  let TOKEN_USER2: string;
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
      email: 'user2@test.com',
      password: 'password123',
    });
    TOKEN_USER2 = res.data.data!.token;

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

    expect(res.status).toBe(404);
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

    expect(res.status).toBe(400);
    expect(res.data.error!.message).toBe('invalid date format');
  });

  // ----------------------------------------------------------------------------
  // LIST SCORES
  // ----------------------------------------------------------------------------

  it('should get default page of scores', async () => {
    const res = await GetScoresPage({}, TOKEN_USER1);

    expect(res.status).toBe(200);
    expect(res.data.success).toBe(true);

    expect(res.data.data!.page).toBe(1);
    expect(res.data.data!.limit).toBe(10);

    expect(res.data.data!.scores.length).toBeGreaterThan(0);

    expect(res.data.data!.total_rows).toBeGreaterThan(0);
    expect(res.data.data!.total_pages).toBeGreaterThan(0);
  });

  // ----------------------------------------------------------------------------
  //                                        SORT
  // ----------------------------------------------------------------------------

  // ----------------------------------------------------------------------------
  // 1) EXPLICIT PAGINATION;
  // ----------------------------------------------------------------------------

  it('should get a specific page of scores', async () => {
    const res = await GetScoresPage({ page: 1, limit: 2 }, TOKEN_USER1);

    expect(res.status).toBe(200);
    expect(res.data.success).toBe(true);

    expect(res.data.data!.page).toBe(1);
    expect(res.data.data!.limit).toBe(2);

    expect(res.data.data!.scores.length).toBeLessThanOrEqual(2);
    expect(res.data.data!.total_rows).toBeGreaterThan(0);
    expect(res.data.data!.total_pages).toBeGreaterThan(0);
  });

  // ----------------------------------------------------------------------------
  // 2) SECOND PAGE;
  // ----------------------------------------------------------------------------
  it('should get the second page of scores', async () => {
    const page1 = await GetScoresPage({ page: 1, limit: 2, sort: 'id asc' }, TOKEN_USER1);

    const page2 = await GetScoresPage({ page: 2, limit: 2, sort: 'id asc' }, TOKEN_USER1);

    expect(page1.status).toBe(200);
    expect(page2.status).toBe(200);

    expect(page1.data.data!.page).toBe(1);
    expect(page2.data.data!.page).toBe(2);

    expect(page1.data.data!.limit).toBe(2);
    expect(page2.data.data!.limit).toBe(2);

    expect(page2.data.data!.scores.length).toBeGreaterThan(0);

    // We are using map function with arrow function
    // (score) => score.id : For each element in the array (temporarily named ‘score’), it returns its ‘.id’ value.
    const page1Ids = page1.data.data!.scores.map((score) => score.id);
    const page2Ids = page2.data.data!.scores.map((score) => score.id);

    expect(page1Ids).not.toEqual(expect.arrayContaining(page2Ids));
  });
  // ----------------------------------------------------------------------------
  // 3) PAGE OUTSIDE THE LIMITS;
  // ----------------------------------------------------------------------------
  it('should return an empty page when page is out of range', async () => {
    const res = await GetScoresPage({ page: 999, limit: 10 }, TOKEN_USER1);

    expect(res.status).toBe(200);
    expect(res.data.success).toBe(true);

    expect(res.data.data!.page).toBe(999);
    expect(res.data.data!.scores).toHaveLength(0);

    expect(res.data.data!.total_rows).toBeGreaterThan(0);
    expect(res.data.data!.total_pages).toBeGreaterThan(0);
  });
  // ----------------------------------------------------------------------------
  // 4) SORTING ASC and DESC;
  // ----------------------------------------------------------------------------
  it('should sort scores by id ascending', async () => {
    const res = await GetScoresPage({ sort: 'id asc' }, TOKEN_USER1);

    expect(res.status).toBe(200);
    expect(res.data.success).toBe(true);

    const scores = res.data.data!.scores;

    for (let i = 1; i < scores.length; i++) {
      expect(scores[i].id).toBeGreaterThanOrEqual(scores[i - 1].id);
    }
  });

  it('should sort scores by id descending', async () => {
    const res = await GetScoresPage({ sort: 'id desc' }, TOKEN_USER1);

    expect(res.status).toBe(200);
    expect(res.data.success).toBe(true);

    const scores = res.data.data!.scores;

    for (let i = 1; i < scores.length; i++) {
      expect(scores[i].id).toBeLessThanOrEqual(scores[i - 1].id);
    }
  });

  // ----------------------------------------------------------------------------
  // 5) Test sorting by composer
  // ----------------------------------------------------------------------------

  it('should sort scores by composer name ascending', async () => {
    const res = await GetScoresPage({ sort: 'composer asc' }, TOKEN_USER1);

    expect(res.status).toBe(200);
    expect(res.data.success).toBe(true);

    const scores = res.data.data!.scores;

    for (let i = 1; i < scores.length; i++) {
      expect(scores[i].composer.name.localeCompare(scores[i - 1].composer.name)).toBeGreaterThanOrEqual(0);
    }
  });

  it('should sort scores by composer name descending', async () => {
    const res = await GetScoresPage({ sort: 'composer desc' }, TOKEN_USER1);

    expect(res.status).toBe(200);
    expect(res.data.success).toBe(true);

    const scores = res.data.data!.scores;

    for (let i = 1; i < scores.length; i++) {
      expect(scores[i].composer.name.localeCompare(scores[i - 1].composer.name)).toBeLessThanOrEqual(0);
    }
  });

  // ----------------------------------------------------------------------------
  // 6) SEARCH BY NAME;
  // ----------------------------------------------------------------------------
  it('should filter scores by name', async () => {
    const res = await GetScoresPage({ search: 'Marche' }, TOKEN_USER1);

    expect(res.status).toBe(200);
    expect(res.data.success).toBe(true);

    const scores = res.data.data!.scores;

    expect(scores.length).toBeGreaterThan(0);

    for (const score of scores) {
      console.log('Score Name : %s', score.name);
      expect(score.name.toLowerCase()).toContain('marche');
    }
  });
  // ----------------------------------------------------------------------------
  // 7) COMPOSER FILTER;
  // ----------------------------------------------------------------------------

  it('should filter scores by composer', async () => {
    const res = await GetScoresPage({ composer: 'Beethoven' }, TOKEN_USER1);

    expect(res.status).toBe(200);
    expect(res.data.success).toBe(true);

    const scores = res.data.data!.scores;

    expect(scores.length).toBeGreaterThan(0);

    for (const score of scores) {
      expect(score.composer.name).toContain('Beethoven');
    }
  });

  it('should return no scores for an unknown composer', async () => {
    const res = await GetScoresPage({ composer: 'ThisComposerDoesNotExist' }, TOKEN_USER1);

    expect(res.status).toBe(200);
    expect(res.data.success).toBe(true);

    expect(res.data.data!.scores).toHaveLength(0);
    expect(res.data.data!.total_rows).toBe(0);
    expect(res.data.data!.total_pages).toBe(0);
  });

  // ----------------------------------------------------------------------------
  // 8) TAG FILTER;
  // ----------------------------------------------------------------------------

  it('should filter scores by tag', async () => {
    const res = await GetScoresPage({ tag: 'Piano' }, TOKEN_USER1);

    expect(res.status).toBe(200);
    expect(res.data.success).toBe(true);

    expect(res.data.data!.scores.length).toBeGreaterThan(0);

    for (const score of res.data.data!.scores) {
      expect(score.tags.toLowerCase()).toContain('piano');
    }
  });
  // ----------------------------------------------------------------------------
  // 9) CATEGORY FILTER;
  // ----------------------------------------------------------------------------

  it('should filter scores by category', async () => {
    const res = await GetScoresPage({ category: 'Classical' }, TOKEN_USER1);

    expect(res.status).toBe(200);
    expect(res.data.success).toBe(true);

    expect(res.data.data!.scores.length).toBeGreaterThan(0);

    for (const score of res.data.data!.scores) {
      expect(score.categories.toLowerCase()).toContain('classical');
    }
  });
  // ----------------------------------------------------------------------------
  // 10) COMBINATION OF PAGINATION AND FILTERS;
  // ----------------------------------------------------------------------------

  it('should paginate filtered scores', async () => {
    const res = await GetScoresPage(
      {
        composer: 'Beethoven',
        page: 1,
        limit: 1,
      },
      TOKEN_USER1
    );

    expect(res.status).toBe(200);
    expect(res.data.success).toBe(true);

    expect(res.data.data!.page).toBe(1);
    expect(res.data.data!.limit).toBe(1);

    expect(res.data.data!.scores.length).toBeLessThanOrEqual(1);

    expect(res.data.data!.total_rows).toBeGreaterThan(0);
  });
  // ----------------------------------------------------------------------------
  // 11) USER-SPECIFIC FILTERING.
  // ----------------------------------------------------------------------------
  it('should only return scores belonging to the authenticated user', async () => {
    const res = await GetScoresPage({}, TOKEN_USER2);
    const USER2_ID = 3;
    expect(res.status).toBe(200);
    expect(res.data.success).toBe(true);

    for (const score of res.data.data!.scores) {
      expect(score.uploaderId).toBe(USER2_ID);
    }
  });

  // ----------------------------------------------------------------------------
  // 12) UNIQUE LIST COMPOSER
  // ----------------------------------------------------------------------------

  it('should get one score by id', async () => {
    // First we need to recover 1 scores
    const res = await GetScoresPage({ page: 1, limit: 2 }, TOKEN_USER1);
    expect(res.status).toBe(200);
    expect(res.data.success).toBe(true);

    const scores = res.data.data!.scores;
    expect(scores.length).toBeGreaterThan(0);

    // Index 0 !!
    const scoreId: number = Number(scores[0].id);
    console.log('We will get score with scoreId : ', scoreId);

    const res1 = await GetScore(scoreId, TOKEN_USER1);

    expect(res1.status).toBe(200);
    expect(res1.data.success).toBe(true);
    expect(res1.data.data!.score.id).toBe(scoreId);
  });

  // ----------------------------------------------------------------------------

  it('should return 404 for unknown score', async () => {
    const res = await GetScore(999999, TOKEN_ADMIN);

    expect(res.status).toBe(404);
  });

  // ----------------------------------------------------------------------------
  // ----------------------------------------------------------------------------
});
