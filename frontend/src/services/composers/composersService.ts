import { GetComposersPageRequest, GetComposersPageResponse } from '../../../../shared/types/composer';
import { GetComposerResponse } from '../../../../shared/types/composer';
import { apiRequest } from '../../api/client';
import { Pagination } from '../../config/pagination';
import { apiBinaryRequest } from '../../api/client';
import { logger } from '../../../logger/logger';

export function getComposersPage({
  page = 1,
  limit = Pagination.composers.defaultLimit,
  sort = 'asc',
  name,
  isVerified,
}: GetComposersPageRequest = {}): Promise<GetComposersPageResponse> {
  // We construct the GET url
  const params = new URLSearchParams();

  params.append('page', String(page));
  params.append('limit', String(limit));
  params.append('sort', sort);

  params.append('used', String(true));

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
    return apiRequest<GetComposersPageResponse>('GET', `/composers?${params.toString()}`);
  }

  return apiRequest<GetComposersPageResponse>('GET', `/demo/composers?${params.toString()}`);
}

export function getComposer(id: number) {
  return apiRequest<GetComposerResponse>('GET', `/composers/${id}`);
}

/**
 * Return Composer's picture or portrait
 * @param id
 * @returns : data
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

export async function getComposerThumbnail(id: number) {
  const token = localStorage.getItem('token');

  if (token) {
    const blob = await apiBinaryRequest('GET', `/composers/${id}/thumbnail`);
    return blob;
  }

  const blob = await apiBinaryRequest('GET', `/demo/composers/${id}/thumbnail`);
  return blob;
}
