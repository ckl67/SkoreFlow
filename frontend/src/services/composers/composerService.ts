import {
  GetComposersPageRequest,
  GetComposersPageResponse,
} from '../../../../shared/types/composer';
import { GetComposersResponse } from '../../../../shared/types/composer';
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

  if (name) {
    params.append('name', name);
  }

  // because otherwise you’d never send: isVerified=false
  if (isVerified !== undefined) {
    params.append('isVerified', String(isVerified));
  }

  const token = localStorage.getItem('token');

  if (token) {
    return apiRequest<GetComposersPageResponse>('GET', `/composers?${params.toString()}`);
  }

  return apiRequest<GetComposersPageResponse>('GET', `/public/composers?${params.toString()}`);
}

export function getComposer(id: number) {
  return apiRequest<GetComposersResponse>('GET', `/composers/${id}`);
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
  const blob = await apiBinaryRequest('GET', `/public/composers/${id}/picture`);
  return blob;
}

export async function getComposerThumbnail(id: number) {
  const token = localStorage.getItem('token');

  if (token) {
    const blob = await apiBinaryRequest('GET', `/composers/${id}/thumbnail`);
    return blob;
  }

  const blob = await apiBinaryRequest('GET', `/public/composers/${id}/thumbnail`);
  return blob;
}
