export interface LoginRequest {
  email: string;
  password: string;
}

export interface UserPublicResponse {
  id: number;
  username: string;
  email: string;
  avatar: string;
  role: number;
  isVerified: boolean;
}

export interface LoginResponse {
  message: string;
  token: string;
  user: UserPublicResponse;
}
