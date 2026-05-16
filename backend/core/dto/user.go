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
