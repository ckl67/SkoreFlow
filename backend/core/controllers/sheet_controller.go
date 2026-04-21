package controllers

// ===============================================================================================
// Layer              | Component      | Responsibility
// -------------------|----------------|----------------------------------------------------------
// TRANSPORT          | controllers/   | 1. Handle HTTP requests (JSON, form-data, params)
//                    |                | 2. Delegate validation to forms layer
//                    |                | 3. Call services for business logic
//                    |                | 4. Format HTTP responses
//
// RULES:
// - No business logic here
// - No direct database access
// - Controllers must remain thin and orchestration-only
// ===============================================================================================

import (
	"errors"
	"fmt"
	"net/http"
	"strconv"

	"backend/core/apperrors"
	"backend/core/forms"
	"backend/core/services"
	"backend/infrastructure/logger"
	"backend/pkg/responses"

	"github.com/gin-gonic/gin"
)

// SheetController
// Handles all HTTP endpoints related to sheet management.
// Delegates business logic to SheetService.
type SheetController struct {
	service *services.SheetService
}

func NewSheetController(s *services.SheetService) *SheetController {
	return &SheetController{service: s}
}

// CreateSheet
// Handles the upload of a new music sheet.
// Workflow:
// 1. Extract user context (auth middleware)
// 2. Bind multipart form (metadata + file)
// 3. Run custom validation
// 4. Delegate creation to service layer
// 5. Return HTTP response
func (ctrl *SheetController) CreateSheet(c *gin.Context) {
	uid := c.GetUint32("user_id")
	userRole := c.GetInt("user_role")

	logger.Sheet.Debug("(CreateSheet): User ID: %d, User Role: %d will create a sheet\n", uid, userRole)

	// logger.Sheet.Debug("(CreateSheet): Content-Type: %s", c.ContentType())

	var form forms.CreateSheetRequest
	if err := c.ShouldBind(&form); err != nil {
		responses.ERROR(c, http.StatusBadRequest, err)
		return
	}

	logger.Sheet.Debug("(CreateSheet): Form raw: %+v", c.Request.Form)

	if err := form.ValidateForm(); err != nil {
		responses.ERROR(c, http.StatusBadRequest, err)
		return
	}

	err := ctrl.service.CreateSheet(uid, form, form.File)
	if err != nil {
		switch {
		case errors.Is(err, apperrors.ErrSheetAlreadyExists):
			responses.ERROR(c, http.StatusConflict, err)
		default:
			responses.ERROR(c, http.StatusInternalServerError, err)
		}
		return
	}

	responses.JSON(c, http.StatusAccepted, gin.H{
		"message": "File uploaded successfully",
	})
}

// UpdateSheet
// Updates an existing sheet.
// Supports:
// - Metadata update (name, tags, etc.)
// - Optional file replacement
func (ctrl *SheetController) UpdateSheet(c *gin.Context) {
	uid := c.GetUint32("user_id")
	userRole := c.GetInt("user_role")

	idParam := c.Param("id")
	sheetID, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		responses.ERROR(c, http.StatusBadRequest, errors.New("sheet ID must be a valid number"))
		return
	}

	var form forms.UpdateSheetRequest
	if err := c.ShouldBind(&form); err != nil {
		responses.ERROR(c, http.StatusBadRequest, err)
		return
	}

	if err := form.ValidateForm(); err != nil {
		responses.ERROR(c, http.StatusBadRequest, err)
		return
	}

	logger.Sheet.Debug("(Controller UpdateSheet) : initiated by user %d - role %d for ID %d", uid, userRole, sheetID)

	updatedSheet, err := ctrl.service.UpdateSheet(uid, uint(sheetID), form, form.File)
	if err != nil {
		switch {
		case errors.Is(err, apperrors.ErrSheetNotFound):
			responses.ERROR(c, http.StatusNotFound, err)
		case errors.Is(err, apperrors.ErrAccessForbidden):
			responses.ERROR(c, http.StatusForbidden, err)
		case errors.Is(err, apperrors.ErrInvalidDate):
			responses.ERROR(c, http.StatusBadRequest, err)
		default:
			responses.ERROR(c, http.StatusInternalServerError, err)
		}
		return
	}

	responses.JSON(c, http.StatusOK, gin.H{
		"status":  "success",
		"message": fmt.Sprintf("Sheet '%s' (ID: %d) updated", updatedSheet.SheetName, updatedSheet.ID),
		"id":      sheetID,
	})
}

// DeleteSheet
// Deletes a sheet and its associated files.
// Authorization:
// - Allowed for owner or admin
// Special cases:
// - Partial file deletion failure still returns success with warning
func (ctrl *SheetController) DeleteSheet(c *gin.Context) {
	uid := c.GetUint32("user_id")
	userRole := c.GetInt("user_role")

	idParam := c.Param("id")
	sheetID, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		responses.ERROR(c, http.StatusBadRequest, errors.New("invalid ID"))
		return
	}

	err = ctrl.service.DeleteSheet(uid, uint(sheetID), userRole)
	if err != nil {
		switch {
		case errors.Is(err, apperrors.ErrFileDeletion):
			responses.JSON(c, http.StatusOK, gin.H{
				"message": "Sheet deleted, but some files could not be removed",
			})
		case errors.Is(err, apperrors.ErrFileNotFound):
			responses.JSON(c, http.StatusOK, gin.H{
				"message": "Sheet deleted but some files were missing",
			})
		case errors.Is(err, apperrors.ErrSheetNotFound):
			responses.ERROR(c, http.StatusNotFound, err)
		case errors.Is(err, apperrors.ErrAccessForbidden):
			responses.ERROR(c, http.StatusForbidden, err)
		default:
			responses.ERROR(c, http.StatusInternalServerError, err)
		}
		return
	}

	responses.JSON(c, http.StatusOK, gin.H{"message": "Sheet deleted successfully"})
}

// GetSheet
// Retrieves a single sheet by ID.
// Includes access control (owner or admin).
func (ctrl *SheetController) GetSheet(c *gin.Context) {
	uid := c.GetUint32("user_id")
	userRole := c.GetInt("user_role")

	idParam := c.Param("id")
	sheetID, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		responses.ERROR(c, http.StatusBadRequest, apperrors.ErrSheetInvalidID)
		return
	}

	sheet, err := ctrl.service.GetSheet(uid, uint(sheetID), userRole)
	if err != nil {
		switch err {
		case apperrors.ErrSheetNotFound:
			responses.ERROR(c, http.StatusNotFound, err)
		case apperrors.ErrAccessForbidden:
			responses.ERROR(c, http.StatusForbidden, err)
		default:
			responses.ERROR(c, http.StatusInternalServerError, err)
		}
		return
	}

	responses.JSON(c, http.StatusOK, sheet)
}

// UpdateAnnotations
// Updates only the annotations field of a sheet.
// Designed for lightweight partial updates (AJAX/editor use cases).
func (ctrl *SheetController) UpdateAnnotations(c *gin.Context) {
	uid := c.GetUint32("user_id")

	idParam := c.Param("id")
	sheetID, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		responses.ERROR(c, http.StatusBadRequest, apperrors.ErrSheetInvalidID)
		return
	}

	var input struct {
		Annotations string `json:"annotations"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		responses.VALIDATION_ERROR(c, err)
		return
	}

	err = ctrl.service.UpdateAnnotations(uid, uint(sheetID), input.Annotations)
	if err != nil {
		if errors.Is(err, apperrors.ErrSheetNotFound) {
			responses.ERROR(c, http.StatusNotFound, err)
			return
		}
		responses.ERROR(c, http.StatusInternalServerError, err)
		return
	}

	responses.JSON(c, http.StatusOK, gin.H{"message": "Annotations saved"})
}

// GetSheetsPage
// Retrieves a paginated list of sheets.
// Supports filtering (search, tags, categories, composer) and sorting.
// Returns both data and pagination metadata.
func (ctrl *SheetController) GetSheetsPage(c *gin.Context) {
	uid := c.GetUint32("user_id")

	var form forms.GetSheetsPageRequest
	if err := c.ShouldBind(&form); err != nil {
		responses.ERROR(c, http.StatusBadRequest, err)
		return
	}

	logger.Sheet.Debug("(Controller GetSheetsPage) : User: %d | Search: %s | Page: %d | PageSize: %d | SortBy: %s", uid, form.Search, form.Page, form.Limit, form.SortBy)

	pageData, err := ctrl.service.GetSheetsPage(uid, form)
	if err != nil {
		responses.ERROR(c, http.StatusInternalServerError, err)
		return
	}

	responses.JSON(c, http.StatusOK, pageData)
}
