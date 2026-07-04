// --------------------------------------------------------------------------------
// HELPERS
// --------------------------------------------------------------------------------
import FormData from 'form-data';
import fs from 'fs';

import { API_URL } from '../config.js';
import { request } from './api.js';

import { CreateComposerPayload, CreateComposerResponse } from '../../../shared/types/composer';

// --------------------------------------------------------------------------------
// createComposer
// --------------------------------------------------------------------------------

// --------------------------------------------------------------------------------
// Create Composer
// Usage in Vitest
// const res = await CreateComposer(...)
// --------------------------------------------------------------------------------
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
// EXPORT (ESM)
// --------------------------------------------------------------------------------

export { createComposer };
