import type { UserPublicResponse } from './auth';

export interface AdminCreateUserRequest {
  username: string;
  email: string;
  password: string;
}

export interface AdminCreateUserResponse {
  message: string;
  user_id: number;
}

// ---------------------------

export interface AdminGetUsersPageRequest {
  page?: number;
  limit?: number;
  sort?: string;
}

export interface AdminGetUsersPageResponse {
  message: string;
  limit: number;
  page: number;
  sort?: string;
  total_rows: number;
  total_pages: number;
  users: UserPublicResponse[];
}

// ---------------------------

export interface AdminGetUserResponse {
  message: string;
  user: UserPublicResponse;
}

// ---------------------------
