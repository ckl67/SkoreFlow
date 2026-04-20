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

// ===============================================================================================
// Black Import !
// ===============================================================================================
// Blank imports like _ "image/jpeg" follow the "Registration Pattern".
// 1. It imports the package solely for its side effects.
// 2. Before main() starts, the package's init() function is executed.
// 3. This init() calls image.RegisterFormat() to "teach" the standard
//    "image" package how to handle this specific format.
// 4. When image.Decode() or image.DecodeConfig() is called, the 'image'
//    package uses the registered decoder (JPEG, PNG, or WebP) to process the file.
// ===============================================================================================

import (
	"errors"
	"image"
	"mime/multipart"
	"net/http"
	"path/filepath"
	"strings"

	_ "image/jpeg"
	_ "image/png"

	_ "golang.org/x/image/webp"
)

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
	Password   *string `json:"password" binding:"omitempty,min=8,max=100"`
	Role       *int    `json:"role"`
	IsVerified *bool   `json:"isVerified"`
}

// UpdateUserRequest defines the payload for updating a user.
type UpdateUserRequest struct {
	Username *string `json:"username" binding:"omitempty,min=3,max=100"`
}

// UploadAvatarRequest defines the payload for uploading a user avatar.
type UploadAvatarRequest struct {
	File *multipart.FileHeader `form:"uploadFile" binding:"required"`
}

// ValidateForm performs custom validation for CreateComposerRequest.
// Validations:
// - Name must not be empty
// - File (if provided):
//   - Max size: 2MB
//   - Allowed extensions: jpg, jpeg, png, webp
//   - Valid MIME type
//   - Valid image file
//   - Dimensions
func (req *UploadAvatarRequest) ValidateForm() error {
	// Validate file if present
	if req.File != nil {

		// 1. File size validation (max 2MB)
		if req.File.Size > 2<<20 {
			return errors.New("file too large (max 2MB)")
		}

		// 2. File extension validation (quick filter)
		ext := strings.ToLower(filepath.Ext(req.File.Filename))
		allowedExt := map[string]bool{
			".jpg":  true,
			".jpeg": true,
			".png":  true,
			".webp": true,
		}
		if !allowedExt[ext] {
			return errors.New("only jpg, jpeg, png, webp files are allowed")
		}

		// 3. Open file
		file, err := req.File.Open()
		if err != nil {
			return errors.New("unable to open file")
		}
		defer file.Close()

		// 4. Detect MIME type (first 512 bytes)
		buffer := make([]byte, 512)
		_, err = file.Read(buffer)
		if err != nil {
			return errors.New("unable to read file")
		}

		mimeType := http.DetectContentType(buffer)

		allowedMime := map[string]bool{
			"image/jpeg": true,
			"image/png":  true,
			"image/webp": true,
		}
		if !allowedMime[mimeType] {
			return errors.New("invalid image type")
		}

		// Reset file cursor
		_, err = file.Seek(0, 0)
		if err != nil {
			return errors.New("unable to reset file reader")
		}

		// 5. Decode image config (fast, no full load)
		imgConfig, _, err := image.DecodeConfig(file)
		if err != nil {
			return errors.New("invalid image file")
		}

		// 6. Validate dimensions
		if imgConfig.Width > 800 || imgConfig.Height > 800 {
			return errors.New("image dimensions too large (max 800x800)")
		}

		if imgConfig.Width < 50 || imgConfig.Height < 50 {
			return errors.New("image too small (min 50x50)")
		}
	}

	return nil
}
