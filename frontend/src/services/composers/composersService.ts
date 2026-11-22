import {
  GetComposersPageRequest,
  GetComposersPageResponse,
} from '../../../../shared/types/composer';

import {
  UpdateComposerRequestPayload,
  UpdateComposerResponse,
} from '../../../../shared/types/composer';

import { GetComposerResponse } from '../../../../shared/types/composer';
import { apiRequest } from '../../api/client';
import { Pagination } from '../../config/pagination';
import { apiBinaryRequest } from '../../api/client';

import { logger } from '../../../logger/logger';

export function getComposersPage(
  {
    page = 1,
    limit = Pagination.composers.defaultLimit,
    sort = 'asc',
    name,
    isVerified,
  }: GetComposersPageRequest = {},
  onlyMine: boolean
): Promise<GetComposersPageResponse> {
  // We construct the GET url
  const params = new URLSearchParams();

  params.append('page', String(page));
  params.append('limit', String(limit));
  params.append('sort', sort);

  params.append('used', String(onlyMine));

  if (name) {
    params.append('name', name);
  }

  // because otherwise you’d never send: isVerified=false
  if (isVerified !== undefined) {
    params.append('isVerified', String(isVerified));
  }

  const token = localStorage.getItem('token');

  // Remark
  // If there is no need to read the content on the spot:
  //  `return apiRequest(...)` is sufficient (the Promise will be awaited by the React component or the final caller).
  // If you need to read or manipulate the data immediately:
  //  `await` is essential to convert `Promise<T>` to `T`.
  if (token) {
    return apiRequest<GetComposersPageResponse>(
      'GET',
      `/composers?${params.toString()}`
    );
  }

  return apiRequest<GetComposersPageResponse>(
    'GET',
    `/demo/composers?${params.toString()}`
  );
}

export function getComposer(id: number) {
  const token = localStorage.getItem('token');

  if (token) {
    return apiRequest<GetComposerResponse>('GET', `/composers/${id}`);
  }

  return apiRequest<GetComposerResponse>('GET', `/demo/composers/${id}`);
}

/**
 * Return Composer's picture or portrait
 * @param id
 * @returns : data
 *
 *
 *  The refreshKey is added as a query parameter to force the browser
 *  to request the latest picture instead of reusing a cached response.
 *  It does not change the backend route; it only creates a new cache key.
 *
 *    GET /api/v1/composers/9/picture
 *    GET /api/v1/composers/9/picture?v=1
 *    GET /api/v1/composers/9/picture?v=1
 *  Will call the same Backend route
 */
export async function getComposerPicture(id: number) {
  const token = localStorage.getItem('token');

  if (token) {
    const blob = await apiBinaryRequest('GET', `/composers/${id}/picture`);
    return blob;
  }
  const blob = await apiBinaryRequest('GET', `/demo/composers/${id}/picture`);
  return blob;
}

/**
 *
 * @param id
 * @returns
 */
export async function getComposerThumbnail(id: number) {
  const token = localStorage.getItem('token');

  if (token) {
    const blob = await apiBinaryRequest('GET', `/composers/${id}/thumbnail`);
    return blob;
  }

  const blob = await apiBinaryRequest('GET', `/demo/composers/${id}/thumbnail`);
  return blob;
}

// --------------------------------------------------------------------------------
// Update Composer
// --------------------------------------------------------------------------------
export async function updateComposer(
  composerId: number,
  { externalURL, epoch, isVerified }: UpdateComposerRequestPayload,
  file: File | null
): Promise<UpdateComposerResponse | undefined> {
  const token = localStorage.getItem('token');
  const formData = new FormData();

  // Attach uploaded image binary if a new file was selected
  // We have already a `File` object (`selectedPictureFile: File | null`)
  // in our React state:
  if (file) {
    formData.append('uploadFile', file);
  }

  console.log('updateComposer');
  // Attach boolean flag only when explicitly provided
  if (isVerified !== undefined) {
    formData.append('isVerified', String(isVerified));
  }

  // Attach optional metadata fields
  if (externalURL !== undefined) {
    formData.append('externalURL', externalURL);
  }

  if (epoch !== undefined) {
    formData.append('epoch', epoch);
  }

  if (!token) {
    // TODO: Handle missing authentication token / unauthenticated state
    return undefined;
  }

  // Do not set Content-Type manually so the browser sets the multipart boundary
  const res = await apiRequest<UpdateComposerResponse>(
    'PUT',
    `/composers/${composerId}`,
    {
      data: formData,
      //headers: {
      //  Authorization: `Bearer ${token}`,
      //},
    }
  );

  return res;
}
