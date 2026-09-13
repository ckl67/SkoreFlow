// cspell:ignore Turque Supertramp pdff Pathétique
import path from 'path';
import fs from 'node:fs/promises';

import { beforeAll, describe, expect, it } from 'vitest';

import { login } from '../helpers/auth.js';

import { CreateScorePayload, Annotation } from '../../../shared/types/score.js';

import { createScore, DeleteScore, UpdateScore } from '../helpers/score';

import { getComposersByName } from '../helpers/composer.js';

import { GetScoresPage, GetScore } from '../helpers/score';

import { UpdateScoreAnnotations } from '../helpers/score';

// ----------------------------------------------------------------------------
// LOCAL HELPER
// ----------------------------------------------------------------------------
function makeScore(composer_id: number, score_name: string, scoreRandomName: boolean): CreateScorePayload {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  let scoreName: string;
  if (scoreRandomName) {
    scoreName = `${score_name}-${id}`;
  } else {
    scoreName = `${score_name}`;
  }
  return {
    composerId: composer_id,
    scoreName: scoreName,
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
  console.log('  --> Find score with composerName = %s --> (Name must match 100%)', composerName);
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
    let message = "Test setup error: %s was not found', composerName";
    throw new Error(message);
  }

  console.log('Composer id :', composer.id);
  return composer.id;
}

// ----------------------------------------------------------------------------
// ----------------------------------------------------------------------------

describe('🎼 Score API - From the User Point of view', () => {
  let TOKEN_USER1: string;
  let TOKEN_USER2: string;
  let TOKEN_USER6: string;
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
      email: 'user6@test.com',
      password: 'password123',
    });
    TOKEN_USER6 = res.data.data!.token;

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
    const score = makeScore(composerId, 'La Marche Turque', true);

    const resourceFilePath = path.resolve(__dirname, '../resources/scores/Amadeus Mozart/La Marche Turque.pdf');
    const res = await createScore(score, resourceFilePath, TOKEN_USER1);

    expect(res.status).toBe(201);
    expect(res.data.data!.message).toBe('Score created successfully');
  });

  // ----------------------------------------------------------------------------
  // SHOULD NOT CREATE SCORE BECAUSE ALREADY EXISTS
  // ----------------------------------------------------------------------------

  it('should not create a score because already exists', async () => {
    const resourceFilePath = path.resolve(__dirname, '../resources/scores/Amadeus Mozart/La Marche Turque.pdf');

    const composerId = await getComposerId('Wolfgang Amadeus Mozart', TOKEN_USER1);

    const score = makeScore(composerId, 'La Marche Turque', true);
    const res1 = await createScore(score, resourceFilePath, TOKEN_USER1);
    const res2 = await createScore(score, resourceFilePath, TOKEN_USER1);

    expect(res1.status).toBe(201);
    expect(res2.status).toBe(409);
    expect(res2.data.error!.message).toBe('score already exists for this user and composer');
  });

  // ----------------------------------------------------------------------------
  // SHOULD NOT CREATE BECAUSE COMPOSER NOT EXISTS
  // ----------------------------------------------------------------------------

  it('should not create a score because composer does not exist', async () => {
    const resourceFilePath = path.resolve(__dirname, '../resources/scores/Amadeus Mozart/La Marche Turque.pdf');

    const score = makeScore(999999, 'Score with invalid composer', true);

    const res = await createScore(score, resourceFilePath, TOKEN_USER1);

    expect(res.status).toBe(404);
    expect(res.data.error!.message).toBe('composer not found');
  });

  // ----------------------------------------------------------------------------
  // SHOULD NOT CREATE BECAUSE MISSING PARAMETERS
  // ----------------------------------------------------------------------------

  it('should not create a score because missing file ', async () => {
    const composerId = await getComposerId('Iron Maiden', TOKEN_USER1);

    const score = makeScore(composerId, 'La Marche Turque', true);
    const res = await createScore(score, '', TOKEN_USER1);
    expect(res.status).toBe(400);
  });

  it('should not create a score because wrong file ', async () => {
    const resourceFilePath = path.resolve(__dirname, '../resources/scores/Amadeus Mozart/La Marche Turque.pdff');

    const composerId = await getComposerId('Iron Maiden', TOKEN_USER1);

    const score = makeScore(composerId, 'La Marche Turque', true);
    const res = await createScore(score, resourceFilePath, TOKEN_USER1);
    expect(res.status).toBe(400);
  });

  // ----------------------------------------------------------------------------
  // SHOULD ACCEPT DIFFERENT DATE FORMAT
  // ----------------------------------------------------------------------------

  it.each(['1962', '1962-05-14', '1962-05-14T00:00:00Z'])('should accept release date "%s"', async (releaseDate) => {
    const composerId = await getComposerId('Wolfgang Amadeus Mozart', TOKEN_USER1);
    const score = makeScore(composerId, 'La Marche Turque', true);

    const resourceFilePath = path.resolve(__dirname, '../resources/scores/Amadeus Mozart/La Marche Turque.pdf');
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
      resourceFilePath,
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
    const score = makeScore(composerId, 'La Marche Turque', true);

    const resourceFilePath = path.resolve(__dirname, '../resources/scores/Amadeus Mozart/La Marche Turque.pdf');
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
      resourceFilePath,
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

  // ============================================================================
  //                                        SORT
  // ============================================================================

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
  // 5) TEST SORTING BY COMPOSER
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
  // 6) SEARCH BY NAME
  // ----------------------------------------------------------------------------
  it('should filter scores by name', async () => {
    const res = await GetScoresPage({ name: 'Marche' }, TOKEN_USER1);

    expect(res.status).toBe(200);
    expect(res.data.success).toBe(true);

    const scores = res.data.data!.scores;

    expect(scores.length).toBeGreaterThan(0);

    for (const score of scores) {
      console.log('Score Name : %s', score.name);
      expect(score.name.toLowerCase()).toContain('marche');
    }
  });

  it('should filter scores Contains Pathétique', async () => {
    const res = await GetScoresPage({ name: 'Pathétique' }, TOKEN_USER2);
    expect(res.status).toBe(200);
  });

  it('should filter scores : Contains Pathétique exact', async () => {
    const res = await GetScoresPage({ name: 'Pathétique', searchMode: 'exact' }, TOKEN_USER2);
    expect(res.status).toBe(200);
    expect(res.data.data?.message).equal('no score found with exact name: Pathétique');
  });

  it('should filter scores : Contains all composers containing Beethoven', async () => {
    const res = await GetScoresPage({ composer: 'Beethoven', searchMode: 'exact' }, TOKEN_USER2);
    expect(res.status).toBe(200);
    expect(res.data.data?.message).equal('no scores found');
  });

  it('should filter scores : Contains Composer Exact : Ludwig van Beethoven + Pathétique', async () => {
    const res = await GetScoresPage(
      { composer: 'Ludwig van Beethoven', searchMode: 'exact', name: 'Pathétique' },
      TOKEN_USER2
    );
    expect(res.status).toBe(200);
    expect(res.data.data?.message).equal('no score found with exact name: Pathétique');
  });

  it('should filter scores : Contains Composer Exact : Ludwig van Beethoven + Adagio Pathétique', async () => {
    const res = await GetScoresPage(
      { composer: 'Ludwig van Beethoven', searchMode: 'exact', name: 'Adagio Pathétique' },
      TOKEN_USER2
    );
    expect(res.status).toBe(200);
    expect(res.data.data?.message).equal('scores retrieved successfully');
  });

  // ----------------------------------------------------------------------------
  // 7) COMPOSER FILTER
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
  // 8) TAG FILTER
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
  // 9) CATEGORY FILTER
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
  // 10) COMBINATION OF PAGINATION AND FILTERS
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
  // 11) USER-SPECIFIC FILTERING
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

    const res1 = await GetScore({ scoreId: scoreId }, TOKEN_USER1);

    expect(res1.status).toBe(200);
    expect(res1.data.success).toBe(true);
    expect(res1.data.data!.score.id).toBe(scoreId);
  });

  // ----------------------------------------------------------------------------

  it('should return 404 for unknown score', async () => {
    const res = await GetScore({ scoreId: 999999 }, TOKEN_ADMIN);

    expect(res.status).toBe(404);
  });

  // ============================================================================
  //                                       UPDATE
  // ============================================================================

  // ----------------------------------------------------------------------------
  // CHANGE THE NAME OF THE SCORE
  // ----------------------------------------------------------------------------
  it('should update score name', async () => {
    const scores = await GetScoresPage({ limit: 1 }, TOKEN_USER1);

    expect(scores.status).toBe(200);
    expect(scores.data.data!.scores.length).toBeGreaterThan(0);

    const score = scores.data.data!.scores[0];
    const newName = `${score.name} Updated`;

    const update = await UpdateScore(
      score.id,
      {
        scoreName: newName,
      },
      undefined,
      TOKEN_USER1
    );

    expect(update.status).toBe(200);
    expect(update.data.success).toBe(true);
    expect(update.data.data!.score.name).toBe(newName);

    const result = await GetScore({ scoreId: score.id }, TOKEN_USER1);

    expect(result.status).toBe(200);
    expect(result.data.data!.score.name).toBe(newName);
  });

  // ----------------------------------------------------------------------------
  // CHANGE NAME OF COMPOSER
  // ----------------------------------------------------------------------------
  it('should update score composer', async () => {
    const scores = await GetScoresPage({ limit: 1 }, TOKEN_USER1);
    expect(scores.status).toBe(200);
    const score = scores.data.data!.scores[0];

    const newComposerId = await getComposerId('Ludwig van Beethoven', TOKEN_USER1);
    console.log('Old ComposerId = %s --> %s = New ComposerId', score.composerId, newComposerId);

    expect(score.composerId).not.toBe(newComposerId);

    const update = await UpdateScore(
      score.id,
      {
        composerId: newComposerId,
      },
      undefined,
      TOKEN_USER1
    );

    expect(update.status).toBe(200);
    expect(update.data.success).toBe(true);

    expect(update.data.data!.score.composerId).toBe(newComposerId);

    const result = await GetScore({ scoreId: score.id }, TOKEN_USER1);

    expect(result.status).toBe(200);
    expect(result.data.data!.score.composerId).toBe(newComposerId);
  });

  // ----------------------------------------------------------------------------
  // COMBINED TEST: TITLE + COMPOSER
  // ----------------------------------------------------------------------------
  it('should update score name and composer', async () => {
    const scores = await GetScoresPage({ limit: 1 }, TOKEN_USER1);

    expect(scores.status).toBe(200);

    const score = scores.data.data!.scores[0];

    const newComposerId = await getComposerId('Supertramp', TOKEN_USER1);

    const newName = `${score.name} Updated to Supertramp`;

    const update = await UpdateScore(
      score.id,
      {
        scoreName: newName,
        composerId: newComposerId,
      },
      undefined,
      TOKEN_USER1
    );

    expect(update.status).toBe(200);
    expect(update.data.success).toBe(true);

    expect(update.data.data!.score.name).toBe(newName);
    expect(update.data.data!.score.composerId).toBe(newComposerId);

    const result = await GetScore({ scoreId: score.id }, TOKEN_USER1);

    expect(result.status).toBe(200);

    expect(result.data.data!.score.name).toBe(newName);
    expect(result.data.data!.score.composerId).toBe(newComposerId);
  });

  // ----------------------------------------------------------------------------
  // NON EXISTING COMPOSER
  // ----------------------------------------------------------------------------

  it('should not update score because composer does not exist', async () => {
    const scores = await GetScoresPage({ limit: 1 }, TOKEN_USER1);

    expect(scores.status).toBe(200);

    const score = scores.data.data!.scores[0];

    const update = await UpdateScore(
      score.id,
      {
        composerId: 999999,
      },
      undefined,
      TOKEN_USER1
    );

    expect(update.status).toBe(404);
    expect(update.data.success).toBe(false);
  });

  // ----------------------------------------------------------------------------
  // RELEASE DATE INVALID
  // ----------------------------------------------------------------------------

  it('should not update score because release date is invalid', async () => {
    const scores = await GetScoresPage({ limit: 1 }, TOKEN_USER1);

    expect(scores.status).toBe(200);

    const score = scores.data.data!.scores[0];
    const oldName = score.name;

    const update = await UpdateScore(
      score.id,
      {
        releaseDate: 'not-a-date',
      },
      undefined,
      TOKEN_USER1
    );

    expect(update.status).toBe(400);
    expect(update.data.success).toBe(false);

    const result = await GetScore({ scoreId: score.id }, TOKEN_USER1);

    expect(result.status).toBe(200);
    expect(result.data.data!.score.name).toBe(oldName);
  });

  // ----------------------------------------------------------------------------
  // UPDATE FILE OF A SCORE
  // ----------------------------------------------------------------------------

  it('should Update the File of a score', async () => {
    const resourceFilePath = path.resolve(__dirname, '../resources/scores/Supertramp/Logical Song.pdf');

    const scores = await GetScoresPage({ limit: 1 }, TOKEN_USER1);

    expect(scores.status).toBe(200);

    const score = scores.data.data!.scores[0];
    const newName = 'New Logical Song';

    const update = await UpdateScore(
      score.id,
      {
        scoreName: newName,
      },
      resourceFilePath,
      TOKEN_USER1
    );

    const result = await GetScore({ scoreId: score.id }, TOKEN_USER1);

    expect(result.status).toBe(200);
    expect(result.data.data!.score.name).toBe(newName);
  });

  // ----------------------------------------------------------------------------
  // REVERT BACK TO THE ORIGIN
  // ----------------------------------------------------------------------------
  it('should Revert back to the origin', async () => {
    const resourceFilePath = path.resolve(__dirname, '../resources/scores/Amadeus Mozart/La Marche Turque.pdf');

    // Get Mozart Id
    const newComposerId = await getComposerId('Wolfgang Amadeus Mozart', TOKEN_USER1);

    // Get the first score
    const scores = await GetScoresPage({ limit: 1 }, TOKEN_USER1);
    expect(scores.status).toBe(200);
    const score = scores.data.data!.scores[0];

    const newName = 'La Marche Turque';

    const update = await UpdateScore(
      score.id,
      {
        scoreName: newName,
        composerId: newComposerId,
      },
      resourceFilePath,
      TOKEN_USER1
    );

    const result = await GetScore({ scoreId: score.id }, TOKEN_USER1);

    expect(result.status).toBe(200);
    expect(result.data.data!.score.name).toBe(newName);
    expect(result.data.data!.score.composerId).toBe(newComposerId);
    expect(result.data.data?.score.filePath).contain('marche');
  });

  // ============================================================================
  //                                      ANNOTATION
  // ============================================================================

  // ----------------------------------------------------------------------------
  // UPDATE ANNOTATION
  // ----------------------------------------------------------------------------

  it('should update and persist score annotations', async () => {
    const scores = await GetScoresPage({ limit: 1 }, TOKEN_USER1);

    expect(scores.status).toBe(200);
    expect(scores.data.success).toBe(true);
    expect(scores.data.data!.scores.length).toBeGreaterThan(0);

    const scoreId = scores.data.data!.scores[0].id;

    const annotations: Annotation[] = [
      {
        id: 'annotation-128',
        page: 3,
        type: 'rectangle',
        geometry: {
          x: 120,
          y: 180,
          width: 150,
          height: 60,
        },
        style: {
          color: '#ff0000',
          strokeWidth: 2,
        },
      },
    ];

    const update = await UpdateScoreAnnotations({ scoreId, annotations }, TOKEN_USER1);

    expect(update.status).toBe(200);
    expect(update.data.success).toBe(true);

    const result = await GetScore({ scoreId }, TOKEN_USER1);

    expect(result.status).toBe(200);
    expect(result.data.success).toBe(true);

    expect(result.data.data!.score.annotations).toEqual(annotations);
  });

  // ============================================================================
  //                                      TO DELETE
  // ============================================================================

  // ----------------------------------------------------------------------------
  // To watch the directory run in a terminal
  //
  //  watch -n 1 'tree backend/storage/scores/uploaded/user-5/supertramp'
  // ----------------------------------------------------------------------------

  // Via bootstrap USER-6 = userId=5
  //
  // Build storage path
  //			├── scores/
  //			│   ├── uploaded
  //			│   │    ├── user-6/
  //			│   │    │   ├── Supertramp/
  //			│   │    │   │   └── Logical Song To delete.pdf
  //			│   │    │   │   └── School to delete.pdf
  //			│   ├── thumbnails
  //			│   │    ├── user-6/
  //			│   │        └─── Supertramp/
  //			│   │            └── Logical Song To delete.png
  //			│   │            └── School to delete.png

  // ----------------------------------------------------------------------------
  // DELETE 1 SCORE
  // ----------------------------------------------------------------------------

  it('should delete 1 score', async () => {
    // 1. Find the score to delete
    const scores = await GetScoresPage({ name: 'Logical Song To delete' }, TOKEN_USER6);

    expect(scores.status).toBe(200);
    expect(scores.data.success).toBe(true);
    expect(scores.data.data!.scores.length).toBeGreaterThan(0);

    // 2. Delete
    const score = scores.data.data!.scores[0];
    const scoreDeleted = await DeleteScore({ scoreId: score.id }, TOKEN_USER6);

    expect(scoreDeleted.status).toBe(200);
    expect(scoreDeleted.data.success).toBe(true);
    expect(scoreDeleted.data.data?.message).toBe('Score deleted successfully');

    debugger;
    // 3. Verify that score has been deleted
    const result = await GetScoresPage({ name: 'Logical Song To delete' }, TOKEN_USER6);

    expect(result.status).toBe(200);
    expect(result.data.success).toBe(true);
    expect(result.data.data!.scores.length).toBe(0);

    // 4. Recreate the score (Simple)
    const composerId = await getComposerId('Supertramp', TOKEN_USER6);

    const scoreNew = makeScore(composerId, 'Logical Song To delete', false);
    const resourceFilePath = path.resolve(__dirname, '../resources/scores/Supertramp/Logical Song to-delete.pdf');

    const res = await createScore(scoreNew, resourceFilePath, TOKEN_USER6);

    expect(res.status).toBe(201);
    expect(res.data.data!.message).toBe('Score created successfully');

    // 5. Reverify that score is again there
    const scoresRC = await GetScoresPage({ name: 'Logical Song To delete' }, TOKEN_USER6);

    expect(scoresRC.status).toBe(200);
    expect(scoresRC.data.success).toBe(true);
    expect(scoresRC.data.data!.scores.length).toBeGreaterThan(0);
  });

  // ----------------------------------------------------------------------------
  // SHOULD DELETE 1 SCORE WHEN THE SCORE FILE IS MISSING'
  // ----------------------------------------------------------------------------

  it('should delete 1 score when the score file is missing', async () => {
    // 1. Find the score to delete
    const scores = await GetScoresPage({ name: 'Logical Song To delete' }, TOKEN_USER6);

    expect(scores.status).toBe(200);
    expect(scores.data.success).toBe(true);
    expect(scores.data.data!.scores.length).toBeGreaterThan(0);

    const score = scores.data.data!.scores[0];

    // 2. Delete the score file intentionally for TOKEN_USER6 --> id =5
    const filePathUser6 = path.resolve(
      __dirname,
      '../../../backend/storage/scores/uploaded/user-5/supertramp/logical-song-to-delete.pdf'
    );

    // The file must exist before we remove it.
    await expect(fs.access(filePathUser6)).resolves.toBeUndefined();
    // unlink will delete the file
    await fs.unlink(filePathUser6);
    // Verify that the file is really deleted - missing.
    await expect(fs.access(filePathUser6)).rejects.toThrow();

    // In cas to debug !
    debugger;

    // 3. Delete the score
    const scoreDeleted = await DeleteScore({ scoreId: score.id }, TOKEN_USER6);

    expect(scoreDeleted.status).toBe(200);
    expect(scoreDeleted.data.success).toBe(true);
    expect(scoreDeleted.data.data?.message).toBe('Score deleted but some files were missing');

    // 4. Verify that the score has been deleted from the database
    const result = await GetScoresPage({ name: 'Logical Song To delete' }, TOKEN_USER6);

    expect(result.status).toBe(200);
    expect(result.data.success).toBe(true);
    expect(result.data.data!.scores.length).toBe(0);

    // 5. Recreate the score
    const resourceFilePath = path.resolve(__dirname, '../resources/scores/Supertramp/Logical Song to-delete.pdf');

    const composerId = await getComposerId('Supertramp', TOKEN_USER6);
    const scoreNew = makeScore(composerId, 'Logical Song To delete', false);
    const res = await createScore(scoreNew, resourceFilePath, TOKEN_USER6);

    expect(res.status).toBe(201);
    expect(res.data.data!.message).toBe('Score created successfully');

    // 6. Verify that the score is again there
    const scoresRC = await GetScoresPage({ name: 'Logical Song To delete' }, TOKEN_USER6);

    expect(scoresRC.status).toBe(200);
    expect(scoresRC.data.success).toBe(true);
    expect(scoresRC.data.data!.scores.length).toBeGreaterThan(0);
  });

  // ----------------------------------------------------------------------------
  // DELETE 2 SCORES AND CLEAN EMPTY DIRECTORY
  // ----------------------------------------------------------------------------
  it('should delete 2 scores', async () => {
    const scoreDirectory = path.resolve(__dirname, '../../../backend/storage/scores/uploaded/user-5/supertramp');

    // 1. Find the scores to delete
    const scores1 = await GetScoresPage({ name: 'Logical Song To delete' }, TOKEN_USER6);

    expect(scores1.status).toBe(200);
    expect(scores1.data.success).toBe(true);
    expect(scores1.data.data!.scores.length).toBe(1);

    const scores2 = await GetScoresPage({ name: 'School To delete' }, TOKEN_USER6);

    expect(scores2.status).toBe(200);
    expect(scores2.data.success).toBe(true);
    expect(scores2.data.data!.scores.length).toBe(1);

    const score1 = scores1.data.data!.scores[0];
    const score2 = scores2.data.data!.scores[0];

    // 2. Delete first score
    const score1Deleted = await DeleteScore({ scoreId: score1.id }, TOKEN_USER6);

    expect(score1Deleted.status).toBe(200);
    expect(score1Deleted.data.success).toBe(true);
    expect(score1Deleted.data.data?.message).toBe('Score deleted successfully');

    // The directory must still exist because the second score is still present.
    await expect(fs.access(scoreDirectory)).resolves.toBeUndefined();

    // 3. Delete second score
    const score2Deleted = await DeleteScore({ scoreId: score2.id }, TOKEN_USER6);

    expect(score2Deleted.status).toBe(200);
    expect(score2Deleted.data.success).toBe(true);
    expect(score2Deleted.data.data?.message).toBe('Score deleted successfully');

    // The directory must now have been removed.
    await expect(fs.access(scoreDirectory)).rejects.toThrow();

    // 4. Verify that both scores have been deleted from the database
    const result1 = await GetScoresPage({ name: 'Logical Song To delete' }, TOKEN_USER6);

    expect(result1.status).toBe(200);
    expect(result1.data.success).toBe(true);
    expect(result1.data.data!.scores.length).toBe(0);

    const result2 = await GetScoresPage({ name: 'School To delete' }, TOKEN_USER6);

    expect(result2.status).toBe(200);
    expect(result2.data.success).toBe(true);
    expect(result2.data.data!.scores.length).toBe(0);

    // 5. Recreate the score
    const resourceFilePath1 = path.resolve(__dirname, '../resources/scores/Supertramp/Logical Song to-delete.pdf');

    const composerId1 = await getComposerId('Supertramp', TOKEN_USER6);
    const scoreNew1 = makeScore(composerId1, 'Logical Song To delete', false);
    const res1 = await createScore(scoreNew1, resourceFilePath1, TOKEN_USER6);
    expect(res1.status).toBe(201);
    expect(res1.data.data!.message).toBe('Score created successfully');

    const resourceFilePath2 = path.resolve(__dirname, '../resources/scores/Supertramp/School To delete.pdf');
    const composerId2 = await getComposerId('Supertramp', TOKEN_USER6);
    const scoreNew2 = makeScore(composerId2, 'School To delete', false);
    const res2 = await createScore(scoreNew2, resourceFilePath1, TOKEN_USER6);
    expect(res2.status).toBe(201);
    expect(res2.data.data!.message).toBe('Score created successfully');

    // 6. Verify that the scores are again there
    const scoresRC1 = await GetScoresPage({ name: 'Logical Song To delete' }, TOKEN_USER6);
    expect(scoresRC1.status).toBe(200);
    expect(scoresRC1.data.success).toBe(true);
    expect(scoresRC1.data.data!.scores.length).toBeGreaterThan(0);

    const scoresRC2 = await GetScoresPage({ name: 'School To delete' }, TOKEN_USER6);
    expect(scoresRC2.status).toBe(200);
    expect(scoresRC2.data.success).toBe(true);
    expect(scoresRC2.data.data!.scores.length).toBeGreaterThan(0);
  });

  // ----------------------------------------------------------------------------
  // ----------------------------------------------------------------------------
});
