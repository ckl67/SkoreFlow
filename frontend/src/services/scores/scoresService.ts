import { GetScoresPageRequest, GetScoresPageResponse } from '../../../../shared/types/score';
import { GetScoreResponse } from '../../../../shared/types/score';
import { apiRequest } from '../../api/client';
import { Pagination } from '../../config/pagination';
import { apiBinaryRequest } from '../../api/client';
import { logger } from '../../../logger/logger';

/**
 * getScoresPage
 * @param ..
 * @returns <GetScoresPageResponse>
 */
export async function getScoresPage({
  page = 1,
  limit = Pagination.scores.defaultLimit,
  sort = 'asc',
  searchMode,
  name,
  composer,
  tag,
  category,
}: GetScoresPageRequest = {}): Promise<GetScoresPageResponse> {
  // We construct the GET url
  const params = new URLSearchParams();

  params.append('page', String(page));
  params.append('limit', String(limit));
  params.append('sort', sort);

  if (searchMode) params.append('searchMode', searchMode);
  if (name) params.append('name', name);
  if (composer) params.append('composer', composer);
  if (tag) params.append('tag', tag);
  if (category) params.append('category', category);
  const token = localStorage.getItem('token');

  // Remark
  // If there is no need to read the content on the spot:
  //  `return apiRequest(...)` is sufficient (the Promise will be awaited by the React component or the final caller).
  // If you need to read or manipulate the data immediately:
  //  `await` is essential to convert `Promise<T>` to `T`.
  // as export async function getScoresPage
  if (token) {
    return apiRequest<GetScoresPageResponse>('GET', `/scores?${params.toString()}`);
  }

  return apiRequest<GetScoresPageResponse>('GET', `/demo/scores?${params.toString()}`);
}

/**
 * getScore
 * @param id
 * @returns GetScoreResponse
 */
export function getScore(id: number) {
  return apiRequest<GetScoreResponse>('GET', `/scores/${id}`);
}

/**
 * Return Score's file
 * @param id
 * @returns : data
 */
export async function getScoreFile(id: number) {
  const token = localStorage.getItem('token');

  if (token) {
    const blob = await apiBinaryRequest('GET', `/scores/${id}/file`);
    return blob;
  }
  const blob = await apiBinaryRequest('GET', `/demo/scores/${id}/file`);
  return blob;
}

/**
 * Return Score thumbnail
 * @param id
 * @returns
 */
export async function getScoreThumbnail(id: number) {
  const token = localStorage.getItem('token');

  if (token) {
    const blob = await apiBinaryRequest('GET', `/scores/${id}/thumbnail`);
    return blob;
  }

  const blob = await apiBinaryRequest('GET', `/demo/scores/${id}/thumbnail`);
  return blob;
}
