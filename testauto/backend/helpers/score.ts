// --------------------------------------------------------------------------------
// HELPERS
// --------------------------------------------------------------------------------

import FormData from 'form-data';
import fs from 'fs';

import { API_URL } from '../config.js';
import { request } from './api.js';

import { CreateScorePayload, CreateScoreResponse } from '../../../shared/types/score';

// --------------------------------------------------------------------------------
// Create Score
// Usage in Vitest
// const res = await CreateScore(...)
// --------------------------------------------------------------------------------
async function createScore(
  { composerId, scoreName, releaseDate, categories, tags, informationText, annotations }: CreateScorePayload,
  filePath: string,
  token: string
) {
  if (!composerId) {
    throw new Error('composerId is required');
  }

  if (!Number.isInteger(composerId) || composerId <= 0) {
    throw new Error('composerId must be a positive integer');
  }

  if (!scoreName) {
    throw new Error('scoreName is required');
  }

  const form = new FormData();

  form.append('composerId', String(composerId));
  form.append('scoreName', scoreName);

  if (releaseDate !== undefined) {
    form.append('releaseDate', releaseDate);
  }

  if (categories !== undefined) {
    form.append('categories', categories);
  }

  if (tags !== undefined) {
    form.append('tags', tags);
  }

  if (informationText !== undefined) {
    form.append('informationText', informationText);
  }

  if (annotations !== undefined) {
    form.append('annotations', annotations);
  }

  // File is optional for the helper itself so that
  // Vitest can test the backend validation.
  if (filePath) {
    form.append('uploadFile', fs.createReadStream(filePath));
  }

  const res = await request<CreateScoreResponse>('POST', `${API_URL}/scores`, {
    token,
    data: form,
    headers: form.getHeaders(),
  });

  console.log('\nScore Creation response:', res.status, res.data);

  return res;
}

// --------------------------------------------------------------------------------
// EXPORT (ESM)
// --------------------------------------------------------------------------------

export { createScore };
