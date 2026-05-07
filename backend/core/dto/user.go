package dto

import "backend/core/models"

type UserPublicDTO struct {
	ID         uint32 `json:"id"`
	Username   string `json:"username"`
	Email      string `json:"email"`
	Avatar     string `json:"avatar"`
	Role       int    `json:"role"`
	IsVerified bool   `json:"isVerified"`
}

func ToUserPublicDTO(user *models.User) UserPublicDTO {
	return UserPublicDTO{
		ID:         user.ID,
		Username:   user.Username,
		Email:      user.Email,
		Role:       user.Role,
		Avatar:     user.Avatar,
		IsVerified: user.IsVerified,
	}
}
