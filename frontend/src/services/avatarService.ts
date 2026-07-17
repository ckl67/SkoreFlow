import { apiBinaryRequest } from '../api/client';
import { logger } from './../core/logger/logger';

export async function getAvatar() {
  const blob = await apiBinaryRequest('GET', '/me/avatar');

  logger.debug('avatar', '(getAvatar) blob', blob);

  return blob;
}

export async function getUserAvatar(id: number) {
  const blob = await apiBinaryRequest('GET', `/admin/users/${id}/avatar`);
  logger.debug('avatar', '(getUserAvatar) blob', blob);

  return blob;
}
