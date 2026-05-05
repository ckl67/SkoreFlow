package apperrors

import (
	"errors"
)

// ===============================================================================================
// Layer               | Component      | Responsibility
// --------------------|----------------|----------------------------------------------------------
// APPLICATION ERRORS  | apperrors/     | Define application-specific error variables.
//                     |                | These errors can be used across the application for consistent error handling and messaging.
// ===============================================================================================

//
// ERROR STRATEGY:
//
// - Define common application errors as package-level variables.
// - Use these errors in service and handler layers to provide consistent error responses.
// - Avoid defining business logic errors here; these should be defined in the service layer if needed.
//
// RULE:
// → Do not include HTTP status codes or response formatting here; this layer is only for error definitions.

var (
	// Auth
	ErrAuthInvalidCredentials  = errors.New("Invalid Credential")
	ErrMissingToken            = errors.New("Missing Token")
	ErrAuthInvalidToken        = errors.New("Invalid Token")
	ErrAuthTokenExpired        = errors.New("Token Expired")
	ErrAuthTokenInvalidExpired = errors.New("Token Invalid or Expired")

	// User Login
	ErrUserEmailAlreadyUsed     = errors.New("email already in use")
	ErrUserNotVerified          = errors.New("User Not verified!")
	ErrUserNotFound             = errors.New("User Not Found")
	ErrUsernameTaken            = errors.New("username already taken")
	ErrUserAvatarFileNotFound   = errors.New("Avatar picture not found")
	ErrUserAvatarFileNotDeleted = errors.New("Avatar picture not deleted")

	// User Access
	ErrAccessForbidden = errors.New("access forbidden")

	// SMTP
	ErrSmtpNotConfigured = errors.New("smtp not configured")
	ErrSmtpFailed        = errors.New("smtp failed")

	// Score
	ErrScoreAlreadyExists = errors.New("score already exists for this user and composer")
	ErrScoreInvalidID     = errors.New("invalid score ID")
	ErrScoreNotFound      = errors.New("score not found")

	// Other
	ErrInvalidDate = errors.New("invalid date format")

	// Composer
	ErrComposerMandatory     = errors.New("composer is mandatory !")
	ErrComposerInvalidID     = errors.New("invalid composer ID")
	ErrComposerDeletion      = errors.New("composer deletion issue")
	ErrComposerNotFound      = errors.New("composer not found")
	ErrComposerAlreadyExists = errors.New("Composer already exists")
	ErrComposerCreation      = errors.New("Composer Error in Creation Process")
	ErrComposerMerging       = errors.New("Composer merging issue")

	// Image
	ErrImageFormatInvalid = errors.New("Image Format not allowed !")

	// File
	ErrFileDeletion = errors.New("failed to delete file(s)")
	ErrFileNotFound = errors.New("file not found")
	ErrFileTooLarge = errors.New("file too large")
)
