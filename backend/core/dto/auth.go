package dto

type LoginRequestResponseDTO struct {
	Message string        `json:"message"`
	Token   string        `json:"token"`
	User    UserPublicDTO `json:"user"`
}

// Mandatory : omitempty is really the trick here !
// if Token = empty, nothing will be transmitted
type RegisterRequestResponseDTO struct {
	Message    string `json:"message"`
	IsVerified bool   `json:"isVerified"`
	Token      string `json:"token,omitempty"`
}

type RegistrationConfirmationResponseDTO struct {
	Message    string `json:"message"`
	UserId     uint32 `json:"user_id"`
	IsVerified bool   `json:"isVerified"`
}

// Mandatory : omitempty is really the trick here !
type RequestRegistrationConfirmationResponseDTO struct {
	Message string `json:"message"`
	Token   string `json:"token,omitempty"`
}

type ForgotPasswordResponseDTO struct {
	Message string `json:"message"`
	Token   string `json:"token,omitempty"`
}
