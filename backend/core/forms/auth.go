package forms

// ===============================================================================================
// Layer              | Component      | Responsibility
// -------------------|----------------|----------------------------------------------------------
// VALIDATION         | forms/         |
//                    |                | 1. Define request schemas (DTO)
//                    |                | 2. Handle binding (JSON, form-data, query)
// ===============================================================================================
//
// VALIDATION STRATEGY:
//
// A. STRUCTURAL VALIDATION → handled by Gin binding
//    - Defined via `binding:"..."` tags
//    - Automatically executed using:
//        c.ShouldBindJSON(...) or c.ShouldBind(...)
//
//    Examples:
//    - Required fields
//    - Email format
//    - Min/Max length
//
// B. CUSTOM / COMPLEX VALIDATION → handled via ValidateForm()
//    - File constraints (size, extension)
//    - Cross-field logic
//
// C. BUSINESS VALIDATION → MUST NOT be handled here
//    - Must be implemented in the service layer
//
// RULE:
// → Never duplicate binding validation inside ValidateForm()

// -----------------------
// RULE TO APPLY
// -----------------------
// Create → types simples
// Update → pointers
// -----------------------

// RegisterRequest defines the payload for user registration.
type RegisterRequest struct {
	Username string `json:"username" binding:"omitempty,min=3,max=100"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=8,max=100"`
}

// RegistrationConfirmation defines the payload for confirming a registration using a token.
type RegistrationConfirmation struct {
	Token string `json:"token" binding:"required"`
}

// RequestRegistrationConfirmation defines the payload for requesting a new registration confirmation email.
type RequestRegistrationConfirmation struct {
	Email string `json:"email" binding:"required,email"`
}

// LoginRequest defines the payload for user authentication.
// Supports both JSON and form-data binding.
type LoginRequest struct {
	Email    string `json:"email" form:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=8,max=100"`
}

// ResetPasswordRequest defines the payload for resetting a password using a token.
type ResetPasswordRequest struct {
	Token    string `json:"token" binding:"required"`
	Password string `json:"password" binding:"required,min=8,max=100"`
}

// RequestResetPasswordRequest defines the payload for initiating a password reset.
type RequestResetPasswordRequest struct {
	Email string `json:"email" binding:"required,email"`
}
