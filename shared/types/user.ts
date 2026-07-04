import type { UserPublicResponse } from './auth';

export interface UpdateProfilerRequest {
  username: string;
}

export interface ProfileUserResponse {
  message: string;
  user: UserPublicResponse;
}

export interface UpdateMailRequest {
  email: string;
}

export interface UpdateMailResponse {
  message: string;
  email: string;
  pending_email: string;
  token_email: string;
}
