// --------------------------------------------------------------------------------
// HELPERS
// --------------------------------------------------------------------------------

import { API_URL } from '../config.js';

import { createReadStream } from 'node:fs';
import FormData from 'form-data';
import { request } from './api.js';

// --------------------------------------------------------------------------------
// createScore
// --------------------------------------------------------------------------------
//
//	File            *multipart.FileHeader `form:"uploadFile"`
//	Composer        string                `form:"composer"`
//	ScoreName       string                `form:"scoreName"`
//	ReleaseDate     string                `form:"releaseDate"`
//	Categories      string                `form:"categories"`
//	Tags            string                `form:"tags"`
//	InformationText string                `form:"informationText"`
//
//
//    createScore({
//      name: "mozart",
//      externalURL: "https://fr.wikipedia.org/wiki/mozart",
//      epoch: "Moderne",
//      uploadFile: "resources/scores/mozart.png",
//      isVerified: true},
//      TOKEN
//    );
// --------------------------------------------------------------------------------

// --------------------------------------------------------------------------------
// TYPES
// --------------------------------------------------------------------------------

interface RequestOptions {
  uploadFile: string;
  composer?: string;
  scoreName: string;
  releaseDate?: string;
  categories?: string;
  tags?: string;
  informationText?: string;
}

interface ApiMessage {
  message: string;
}
// --------------------------------------------------------------------------------
// createScore
// --------------------------------------------------------------------------------
async function createScore(
  {
    scoreName,
    releaseDate,
    categories,
    tags,
    informationText,
    uploadFile,
    composer,
  }: RequestOptions,
  token: string,
) {
  const form = new FormData();

  if (!uploadFile) {
    throw new Error('uploadFile is required');
  }
  // scoreName Mandatory !
  form.append('scoreName', scoreName);
  if (releaseDate) form.append('releaseDate', releaseDate);
  if (categories) form.append('categories', categories);
  if (tags) form.append('tags', tags);
  if (informationText) form.append('informationText', informationText);
  if (composer) form.append('composer', composer);
  if (uploadFile) form.append('uploadFile', createReadStream(uploadFile));

  console.log(`\n Creating score: ${scoreName} (File: ${uploadFile || 'None'})`);

  const res = await request<ApiMessage>('POST', `${API_URL}/scores/upload`, {
    token,
    data: form,
    headers: form.getHeaders(),
  });
  return res;
}

// --------------------------------------------------------------------------------
// EXPORT (ESM)
// --------------------------------------------------------------------------------

export { createScore };
