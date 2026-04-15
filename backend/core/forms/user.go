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
// B. CUSTOM / COMPLEX VALIDATION → handled via ValidateForm()
//    - File constraints
//    - Cross-field logic
//
// C. BUSINESS VALIDATION → MUST NOT be handled here
//    - Must be implemented in the service layer
//
// RULE:
// → Never duplicate binding validation inside ValidateForm()

import "mime/multipart"

// -----------------------
// RULE TO APPLY
// -----------------------
// Create → types simples
// Update → pointers
// -----------------------

// CreateUserRequest defines the payload for user creation.
type AdmCreateUserRequest struct {
	Username string `json:"username" binding:"omitempty,min=3,max=100"`
	Email    string `json:"email" form:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=8,max=100"`
}

// AdminUpdateUserRequest defines the payload for updating a user.
type AdmUpdateUserRequest struct {
	Username   *string `json:"username" binding:"omitempty,min=3,max=100"`
	Email      *string `json:"email" binding:"omitempty,email"`
	Password   *string `json:"password" binding:"omitempty,min=8,max=100"`
	Role       *int    `json:"role"`
	IsVerified *bool   `json:"isVerified"`
}

// UpdateUserRequest defines the payload for updating a user.
type UpdateUserRequest struct {
	Username *string `json:"username" binding:"omitempty,min=3,max=100"`
	Role     *int    `json:"role"`
}

// UploadAvatarRequest defines the payload for uploading a user avatar.
type UploadAvatarRequest struct {
	File *multipart.FileHeader `form:"avatar" binding:"required"`
}
