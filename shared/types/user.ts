import type { UserPublicResponse } from './auth';

export interface UpdateProfilerRequest {
  username: string;
}

export interface ProfileUserResponse {
  message: string;
  user: UserPublicResponse;
}
