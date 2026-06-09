export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
  };
}

export interface HttpResponse<T = unknown> {
  status: number;
  data: APIResponse<T>;
}

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
