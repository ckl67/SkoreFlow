import type { UserPublicResponse } from './user';

export type AdminCreateUserRequest = {
  username: string;
  email: string;
  password: string;
};

export type AdminCreateUserResponse = {
  message: string;
  user_id: number;
};

// ---------------------------

export type AdminGetUsersPageRequest = {
  page?: number;
  limit?: number;
  sort?: string;
};

export type AdminGetUsersPageResponse = {
  message: string;
  limit: number;
  page: number;
  sort?: string;
  total_rows: number;
  total_pages: number;
  users: UserPublicResponse[];
};

// ---------------------------

export type AdminGetUserResponse = {
  message: string;
  user: UserPublicResponse;
};

// ---------------------------

export type AdminUpdateUserRequest = {
  username?: string;
  email?: string;
  password?: string;
  role?: number;
  isVerified?: boolean;
};

export type AdminUpdateUserResponse = {
  message: string;
  user: UserPublicResponse;
};

// ---------------------------

export type AdminDeleteUserResponse = {
  message: string;
};
