// --------------------------------------------------------------------------------
// HELPERS
// --------------------------------------------------------------------------------

import FormData from 'form-data';
import fs from 'fs';

import { API_URL } from '../config.js';
import { request } from './api.js';

import {
  CreateScorePayload,
  CreateScoreResponse,
  UpdateScoreRequestPayload,
  UpdateScoreResponse,
} from '../../../shared/types/score';
import {
  GetScoresPageRequest,
  GetScoresPageResponse,
  GetScoreRequest,
  GetScoreResponse,
} from '../../../shared/types/score';

import { UpdateScoreAnnotationRequest, UpdateScoreAnnotationResponse } from '../../../shared/types/score';
// --------------------------------------------------------------------------------
// Create Score,
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
// GetScoresPage
// --------------------------------------------------------------------------------
//  {}, parameter optional --> Must be placed at the second rang
//  const res = await GetScoresPage(TOKEN_scores);
//  Or {}, parameter optional --> first rang
//
async function GetScoresPage(
  { page = 1, limit = 10, sort = 'id asc', search, composer, tag, category }: GetScoresPageRequest = {},
  token: string
) {
  const params = new URLSearchParams();

  if (page !== undefined) params.append('page', String(page));
  if (limit !== undefined) params.append('limit', String(limit));
  if (sort) params.append('sort', sort);
  if (search) params.append('search', search);
  if (composer) params.append('composer', composer);
  if (tag) params.append('tag', tag);
  if (category) params.append('category', category);

  const url = params.toString().length > 0 ? `${API_URL}/scores?${params.toString()}` : `${API_URL}/scores`;

  const res = await request<GetScoresPageResponse>('GET', url, {
    token,
  });

  console.log('\n ---> GetScoresPage response: (status = ', res.status, ' )');
  // console.dir is a native Node.js method that allows you to display an object with color and indentation,
  // and to control the depth of the output.
  console.dir(res.data, { depth: null, colors: true });

  return res;
}

// --------------------------------------------------------------------------------
// GetScore
// --------------------------------------------------------------------------------

// Unique response
async function GetScore({ scoreId }: GetScoreRequest, token: string) {
  const res = await request<GetScoreResponse>('GET', `${API_URL}/scores/${scoreId}`, {
    token,
  });

  console.log('\n ---> GetScore response: (status = ', res.status, ' )');
  // console.dir is a native Node.js method that allows you to display an object with color and indentation,
  // and to control the depth of the output.
  console.dir(res.data, { depth: null, colors: true });

  return res;
}

// --------------------------------------------------------------------------------
// Update Score
// --------------------------------------------------------------------------------
async function UpdateScore(
  scoreId: number,
  data: UpdateScoreRequestPayload,
  filePath: string | undefined,
  token: string
) {
  if (!scoreId) {
    throw new Error('scoreId is required');
  }

  if (!Number.isInteger(scoreId) || scoreId <= 0) {
    throw new Error('scoreId must be a positive integer');
  }

  const form = new FormData();

  if (data.scoreName !== undefined) {
    form.append('scoreName', data.scoreName);
  }

  if (data.composerId !== undefined) {
    form.append('composerId', String(data.composerId));
  }

  if (data.releaseDate !== undefined) {
    form.append('releaseDate', data.releaseDate);
  }

  if (data.categories !== undefined) {
    form.append('categories', data.categories);
  }

  if (data.tags !== undefined) {
    form.append('tags', data.tags);
  }

  if (data.informationText !== undefined) {
    form.append('informationText', data.informationText);
  }

  if (filePath) {
    form.append('uploadFile', fs.createReadStream(filePath));
  }

  const res = await request<UpdateScoreResponse>('PUT', `${API_URL}/scores/${scoreId}`, {
    token,
    data: form,
    headers: form.getHeaders(),
  });

  console.log('\nScore Update response:', res.status);
  console.dir(res.data, { depth: null, colors: true });

  return res;
}

// --------------------------------------------------------------------------------
// Update Score Annotations
// --------------------------------------------------------------------------------

async function UpdateScoreAnnotations({ scoreId, annotations }: UpdateScoreAnnotationRequest, token: string) {
  // Don't use FormData which expects a string | Blob, whereas annotations is an Annotation[].
  const res = await request<UpdateScoreAnnotationResponse>('PATCH', `${API_URL}/scores/${scoreId}/annotations`, {
    token,
    data: {
      annotations,
    },
  });

  console.log('\n update score annotations response:', res.status);
  console.log(JSON.stringify(res.data, null, 2));

  return res;
}

// --------------------------------------------------------------------------------
// EXPORT (ESM)
// --------------------------------------------------------------------------------

export { createScore, GetScoresPage, GetScore, UpdateScore, UpdateScoreAnnotations };
