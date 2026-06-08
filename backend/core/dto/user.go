package dto

import "backend/core/models"

type UserPublicResponse struct {
	ID         uint32 `json:"id"`
	Username   string `json:"username"`
	Email      string `json:"email"`
	Avatar     string `json:"avatar"`
	Role       int    `json:"role"`
	IsVerified bool   `json:"isVerified"`
}

type ProfileUserResponse struct {
	Message string             `json:"message"`
	User    UserPublicResponse `json:"user"`
}

type UpdateMailResponse struct {
	Message      string `json:"message"`
	Email        string `json:"email"`
	PendingEmail string `json:"pending_email"`
	TokenEmail   string `json:"token_email,omitempty"`
}

type ConfirmUpdateMailResponse struct {
	Message string `json:"message"`
	UserId  uint32 `json:"user_id"`
}

type UpdatePasswordResponse struct {
	Message string `json:"message"`
}

type DeleteAvatarResponse struct {
	Message string `json:"message"`
}

type AdminCreateUserResponse struct {
	Message string `json:"message"`
	UserId  uint32 `json:"user_id"`
}

type AdminGetUsersPageResponse struct {
	Message    string               `json:"message"`
	Page       int                  `json:"page"`
	Limit      int                  `json:"limit"`
	TotalRows  int64                `json:"total_rows"`
	TotalPages int                  `json:"total_pages"`
	Users      []UserPublicResponse `json:"users"`
}

type AdminGetUserResponse struct {
	Message string             `json:"message"`
	User    UserPublicResponse `json:"user"`
}

type AdminUpdateUserResponse struct {
	Message string             `json:"message"`
	User    UserPublicResponse `json:"user"`
}

type AdminDeleteUserResponse struct {
	Message string `json:"message"`
}

// --------------------------------------------------------------------------
// Function
// --------------------------------------------------------------------------
func ToUserPublicResponse(user *models.User) UserPublicResponse {
	return UserPublicResponse{
		ID:         user.ID,
		Username:   user.Username,
		Email:      user.Email,
		Role:       user.Role,
		Avatar:     user.Avatar,
		IsVerified: user.IsVerified,
	}
}

func ToUsersPublicResponse(users []*models.User) []UserPublicResponse {
	result := make([]UserPublicResponse, len(users))

	for i, u := range users {
		result[i] = ToUserPublicResponse(u)
	}
	return result
}
