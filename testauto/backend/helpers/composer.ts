// --------------------------------------------------------------------------------
// HELPERS
// --------------------------------------------------------------------------------
import FormData from 'form-data';
import fs from 'fs';

import { API_URL } from '../config.js';
import { request } from './api.js';

import { CreateComposerPayload, CreateComposerResponse } from '../../../shared/types/composer';
import {
  GetComposersPageRequest,
  GetComposersPageResponse,
  GetComposersResponse,
} from '../../../shared/types/composer';

// --------------------------------------------------------------------------------
// Create Composer
// Usage in Vitest
// const res = await CreateComposer(...)
// --------------------------------------------------------------------------------
async function createComposer(
  { name, externalURL, epoch }: CreateComposerPayload,
  filePath: string,
  token: string
) {
  if (!name || !filePath) {
    throw new Error('name and uploadFile are required');
  }

  const form = new FormData();

  form.append('name', name);
  form.append('uploadFile', fs.createReadStream(filePath));

  if (externalURL) {
    form.append('externalURL', externalURL);
  }

  if (epoch) {
    form.append('epoch', epoch);
  }

  // In function request :
  //    headers: {
  //      ...(token ? { Authorization: `Bearer ${token}` } : {}),
  //      ...(headers || {}),
  // We will construct
  //    Authorization: Bearer xxx
  //    Content-Type: multipart/form-data; boundary=
  const res = await request<CreateComposerResponse>('POST', `${API_URL}/composers`, {
    token,
    data: form,
    headers: form.getHeaders(),
  });

  console.log('\n Composer Creation response:', res.status, res.data);

  return res;
}

// --------------------------------------------------------------------------------
// GetComposersPage
// --------------------------------------------------------------------------------
//  {}, parameter optional --> Must be placed at the second rang
//  const res = await GetComposersPage(TOKEN_composers);
//  Or {}, parameter optional --> first rang
//
async function GetComposersPage(
  { page = 1, limit = 10, sort = 'id asc' }: GetComposersPageRequest = {},
  token: string
) {
  const params = new URLSearchParams();

  if (page !== undefined) params.append('page', String(page));
  if (limit !== undefined) params.append('limit', String(limit));
  if (sort) params.append('sort', sort);

  const url =
    params.toString().length > 0
      ? `${API_URL}/composers?${params.toString()}`
      : `${API_URL}/composers`;

  const res = await request<GetComposersPageResponse>('GET', url, {
    token,
  });

  console.log('\n composers Get Composers Page response:', res.status);
  console.log(JSON.stringify(res.data, null, 2));

  return res;
}

// --------------------------------------------------------------------------------

async function GetComposer(ComposerId: number, token: string) {
  const res = await request<GetComposersResponse>('GET', `${API_URL}/composers/${ComposerId}`, {
    token,
  });

  console.log('\n composers User response:', res.status, res.data);
  return res;
}

// --------------------------------------------------------------------------------
// EXPORT (ESM)
// --------------------------------------------------------------------------------

export { createComposer, GetComposersPage, GetComposer };
