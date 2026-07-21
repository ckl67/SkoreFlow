import { apiRequest } from '../../api/client';
import type { ProfileUserResponse } from '../../../../shared/types/user';

export async function getProfile() {
  return apiRequest<ProfileUserResponse>('GET', '/me');
}
