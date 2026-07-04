export interface AdminCreateUserRequest {
  username: string;
  email: string;
  password: string;
}

export interface AdminCreateUserResponse {
  message: string;
  user_id: number;
}
