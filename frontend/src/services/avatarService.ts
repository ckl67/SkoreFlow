import { apiBinaryRequest } from '../api/client';

export async function getAvatar() {
  const blob = await apiBinaryRequest('GET', '/me/avatar');

  console.log(blob);

  return blob;
}

export function getUserAvatar(id: number) {
  console.log('getMyAvatar()');

  return apiBinaryRequest('GET', `/admin/users/${id}/avatar`);
}
