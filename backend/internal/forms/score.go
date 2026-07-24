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
//    - File constraints (size, extension)
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
	"mime/multipart"
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

// GetScoresPageRequest defines pagination and filtering for score listing.
type GetScoresPageRequest struct {
	PaginatedRequest
	Search   string `form:"search" json:"search"`
	Tag      string `form:"tag" json:"tag"`
	Category string `form:"category" json:"category"`
	Composer string `form:"composer" json:"composer"`
}

// CreateScoreRequest defines the payload for creating a new score.
type CreateScoreRequest struct {
	File            *multipart.FileHeader `form:"uploadFile" binding:"required"`
	Composer        string                `form:"composer"`
	ComposerId      *uint                 `form:"composerId"`
	ScoreName       string                `form:"scoreName" binding:"required"`
	ReleaseDate     string                `form:"releaseDate"`
	Categories      string                `form:"categories"`
	Tags            string                `form:"tags"`
	InformationText string                `form:"informationText"`
}

// UpdateScoreRequest defines the payload for updating an existing score.
type UpdateScoreRequest struct {
	File            *multipart.FileHeader `form:"uploadFile"`
	ScoreName       string                `form:"scoreName"`
	ReleaseDate     string                `form:"releaseDate"`
	Categories      string                `form:"categories"`
	Tags            string                `form:"tags"`
	InformationText string                `form:"informationText"`
}

// TagRequest defines a payload for tag-related operations.
type TagRequest struct {
	TagValue string `form:"tagValue"`
}

// InformationTextRequest defines a payload for updating score information text.
type InformationTextRequest struct {
	InformationText string `form:"informationText"`
}

// ValidateForm performs custom validation for CreateScoreRequest.
// Validations:
// - File is required
// - Composer is required
// - ScoreName is required
// - File must be a PDF
// - Max file size: 10MB
func (req *CreateScoreRequest) ValidateForm() error {
	if req.File == nil {
		return errors.New("file is required")
	}

	if strings.TrimSpace(req.Composer) == "" {
		return errors.New("composer is required")
	}

	if strings.TrimSpace(req.ScoreName) == "" {
		return errors.New("score name is required")
	}

	// File validation
	if req.File.Size > 10<<20 {
		return errors.New("file too large")
	}

	if !strings.HasSuffix(strings.ToLower(req.File.Filename), ".pdf") {
		return errors.New("only PDF files are allowed")
	}

	return nil
}

// ValidateForm performs custom validation for UpdateScoreRequest.
// Validations:
// - File is optional
// - If provided:
//   - Must be a PDF
//   - Max file size: 10MB
func (req *UpdateScoreRequest) ValidateForm() error {
	if req.File != nil {

		if req.File.Size > 10<<20 {
			return errors.New("file too large")
		}

		if !strings.HasSuffix(strings.ToLower(req.File.Filename), ".pdf") {
			return errors.New("only PDF files are allowed")
		}
	}

	return nil
}
