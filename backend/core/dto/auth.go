package dto

type LoginResponseDTO struct {
	Message string        `json:"message"`
	Token   string        `json:"token"`
	User    UserPublicDTO `json:"user"`
}
