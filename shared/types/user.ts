export type UserPublicResponse = {
  id: number;
  username: string;
  email: string;
  avatar: string;
  role: number;
  isVerified: boolean;
};

// -------------------

export type UpdateProfilerRequest = {
  username: string;
};

// -------------------

export type ProfileUserResponse = {
  message: string;
  user: UserPublicResponse;
};

// -------------------

export type UpdateMailRequest = {
  email: string;
};

export type UpdateMailResponse = {
  message: string;
  email: string;
  pending_email: string;
  token_email: string;
};

// -------------------

export type UploadAvatarResponse = {
  message: string;
  user: UserPublicResponse;
};

// -------------------

export type DeleteAvatarResponse = {
  message: string;
};
