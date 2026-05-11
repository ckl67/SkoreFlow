package dto

type LoginResponse struct {
	Message string             `json:"message"`
	Token   string             `json:"token"`
	User    UserPublicResponse `json:"user"`
}

type LogoutResponse struct {
	Message string `json:"message"`
}

// Mandatory : omitempty is really the trick here !
// if Token = empty, nothing will be transmitted
type RegisterResponse struct {
	Message    string `json:"message"`
	IsVerified bool   `json:"isVerified"`
	Token      string `json:"token,omitempty"`
}

type ConfirmRegistrationResponse struct {
	Message    string `json:"message"`
	UserId     uint32 `json:"user_id"`
	IsVerified bool   `json:"isVerified"`
}

// Mandatory : omitempty is really the trick here !
type ResendRegistrationResponse struct {
	Message string `json:"message"`
	Token   string `json:"token,omitempty"`
}

type ForgotPasswordResponse struct {
	Message string `json:"message"`
	Token   string `json:"token,omitempty"`
}

type ResetPasswordResponse struct {
	Message string `json:"message"`
	UserId  uint32 `json:"user_id"`
}
