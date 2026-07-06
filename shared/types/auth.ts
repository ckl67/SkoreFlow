import type { UserPublicResponse } from './user';

export type RegisterRequest = {
  username: string;
  email: string;
  password: string;
};

// token should never be returned !!
export type RegisterResponse = {
  message: string;
  isVerified: boolean;
  token: string; // Only for test
};

// ----------------------------------------

export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginResponse = {
  message: string;
  token: string;
  user: UserPublicResponse;
};

// -------------------

export type ConfirmRegistrationRequest = {
  token: string;
};

export type ConfirmRegistrationResponse = {
  message: string;
  user_id: number;
  isVerified: boolean;
};

// -------------------

export type ResendRegistrationRequest = {
  email: string;
};

export type ResendRegistrationResponse = {
  message: string;
  token: string; // Only for test
};

// -------------------

export type LogoutResponse = {
  message: string;
};
// -------------------

export type ForgotPasswordRequest = {
  email: string;
};

export type ForgotPasswordResponse = {
  message: string;
  token: string; // Only for test
};

// -------------------

export type ResetPasswordRequest = {
  token: string;
  password: string;
};

export type ResetPasswordResponse = {
  message: string;
  id: number;
};

// -------------------

export type ConfirmUpdateMailRequest = {
  token: string;
};

export type ConfirmUpdateMailResponse = {
  message: string;
  id: number;
};
