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

// GetSheetsPageRequest defines pagination and filtering for sheet listing.
type GetSheetsPageRequest struct {
	PaginatedRequest
	Search   string `form:"search" json:"search"`
	Tag      string `form:"tag" json:"tag"`
	Category string `form:"category" json:"category"`
	Composer string `form:"composer" json:"composer"`
}

// CreateSheetRequest defines the payload for creating a new sheet.
type CreateSheetRequest struct {
	File            *multipart.FileHeader `form:"uploadFile"`
	Composer        string                `form:"composer"`
	SheetName       string                `form:"sheetName"`
	ReleaseDate     string                `form:"releaseDate"`
	Categories      string                `form:"categories"`
	Tags            string                `form:"tags"`
	InformationText string                `form:"informationText"`
}

// UpdateSheetRequest defines the payload for updating an existing sheet.
type UpdateSheetRequest struct {
	File            *multipart.FileHeader `form:"uploadFile"`
	SheetName       string                `form:"sheetName"`
	ReleaseDate     string                `form:"releaseDate"`
	Categories      string                `form:"categories"`
	Tags            string                `form:"tags"`
	InformationText string                `form:"informationText"`
}

// TagRequest defines a payload for tag-related operations.
type TagRequest struct {
	TagValue string `form:"tagValue"`
}

// InformationTextRequest defines a payload for updating sheet information text.
type InformationTextRequest struct {
	InformationText string `form:"informationText"`
}

// ValidateForm performs custom validation for CreateSheetRequest.
// Validations:
// - File is required
// - Composer is required
// - SheetName is required
// - File must be a PDF
// - Max file size: 10MB
func (req *CreateSheetRequest) ValidateForm() error {
	if req.File == nil {
		return errors.New("file is required")
	}

	if strings.TrimSpace(req.Composer) == "" {
		return errors.New("composer is required")
	}

	if strings.TrimSpace(req.SheetName) == "" {
		return errors.New("sheet name is required")
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

// ValidateForm performs custom validation for UpdateSheetRequest.
// Validations:
// - File is optional
// - If provided:
//   - Must be a PDF
//   - Max file size: 10MB
func (req *UpdateSheetRequest) ValidateForm() error {
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
