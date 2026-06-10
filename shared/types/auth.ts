export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

// token should never be returned !!
export interface RegisterResponse {
  message: string;
  isVerified: boolean;
  token: string; // Only for test
}

// ----------------------------------------

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
