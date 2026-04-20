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

// We create a struct for the controller that contains its dependencies (services)
type ComposerController struct {
	service *services.ComposerService
}

func NewComposerController(s *services.ComposerService) *ComposerController {
	return &ComposerController{service: s}
}

// CreateComposer handles creating a new music composer
func (ctrl *ComposerController) CreateComposer(c *gin.Context) {
	// 1. User context
	uid := c.GetUint32("user_id")
	userRole := c.GetInt("user_role")

	logger.Composer.Debug("(CreateComposer) Created by User ID: %d with User Role: %d\n", uid, userRole)

	// 2. Form binding
	var form forms.CreateComposerRequest
	if err := c.ShouldBind(&form); err != nil {
		responses.ERROR(c, http.StatusBadRequest, err)
		return
	}
	logger.Composer.Debug("(CreateComposer) Step 2Created by User ID: %d with User Role: %d\n", uid, userRole)

	// 3. Validation
	if err := form.ValidateForm(); err != nil {
		responses.ERROR(c, http.StatusBadRequest, err)
		return
	}

	// 4. Service call (passing file handle to service)
	err := ctrl.service.CreateComposer(uid, userRole, form, form.File)
	if err != nil {
		logger.Composer.Error("(CreateComposer Controller) Error returned by service: %v", err)
		switch err {
		case apperrors.ErrComposerAlreadyExists:
			responses.ERROR(c, http.StatusConflict, err) // 409
		case apperrors.ErrAccessForbidden:
			responses.ERROR(c, http.StatusForbidden, err) // 403
		case apperrors.ErrImageFormatInvalid:
			responses.ERROR(c, http.StatusBadRequest, err) // 400
		default:
			responses.ERROR(c, http.StatusInternalServerError, err)
		}
		return
	}

	// 5. Response
	responses.JSON(c, http.StatusCreated, gin.H{
		"message": "Composer created successfully",
	})
}

// GetComposersPage fetches a paginated list of composers with optional search filters
func (ctrl *ComposerController) GetComposersPage(c *gin.Context) {
	uid := c.GetUint32("user_id")

	var form forms.GetComposersPageRequest
	if err := c.ShouldBind(&form); err != nil {
		responses.ERROR(c, http.StatusBadRequest, err)
		return
	}

	logger.Sheet.Debug("(Controller GetComposersPage) : User: %d | Search: %s | Page: %d | PageSize: %d | SortBy: %s",
		uid, form.Search, form.Page, form.Limit, form.SortBy)

	pageData, err := ctrl.service.GetComposersPage(uid, form)
	if err != nil {
		responses.ERROR(c, http.StatusInternalServerError, err)
		return
	}

	responses.JSON(c, http.StatusOK, pageData)
}

// GetComposer retrieves detailed information for a single composer
func (ctrl *ComposerController) GetComposer(c *gin.Context) {
	idParam := c.Param("id")
	composerID, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		responses.ERROR(c, http.StatusBadRequest, apperrors.ErrComposerInvalidID)
		return
	}

	composer, err := ctrl.service.GetComposer(uint(composerID))
	if err != nil {
		switch err {
		case apperrors.ErrComposerNotFound:
			responses.ERROR(c, http.StatusNotFound, err)
		default:
			responses.ERROR(c, http.StatusInternalServerError, err)
		}
		return
	}

	responses.JSON(c, http.StatusOK, composer)
}

// UpdateComposer updates an existing composer (metadata and optional file)
func (ctrl *ComposerController) UpdateComposer(c *gin.Context) {
	uid := c.GetUint32("user_id")
	userRole := c.GetInt("user_role")

	// 1. Retrieve and validate ID from URL
	idParam := c.Param("id")
	composerID, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		responses.ERROR(c, http.StatusBadRequest, errors.New("Composer ID must be a valid number"))
		return
	}

	// 2. Form binding (metadata + optional file)
	var form forms.UpdateComposerRequest
	if err := c.ShouldBind(&form); err != nil {
		responses.ERROR(c, http.StatusBadRequest, err)
		return
	}

	logger.Composer.Debug("(Controller UpdateComposer) : initiated by user %d - role %d for Composer ID %d", uid, userRole, composerID)

	// 3. Service execution
	updatedComposer, err := ctrl.service.UpdateComposer(uid, userRole, uint(composerID), form, form.File)
	if err != nil {
		switch {
		case errors.Is(err, apperrors.ErrComposerNotFound):
			responses.ERROR(c, http.StatusNotFound, err)
		case errors.Is(err, apperrors.ErrAccessForbidden):
			responses.ERROR(c, http.StatusForbidden, err)
		default:
			responses.ERROR(c, http.StatusInternalServerError, err)
		}
		return
	}

	// 4. Success response
	responses.JSON(c, http.StatusOK, gin.H{
		"status":  "success",
		"message": fmt.Sprintf("Composer '%s' (ID: %d) updated", updatedComposer.Name, updatedComposer.ID),
		"id":      composerID,
	})
}

// DeleteComposer handles the removal of a composer (database and file system)
// Access is restricted by ownership or admin privileges
func (ctrl *ComposerController) DeleteComposer(c *gin.Context) {
	uid := c.GetUint32("user_id")
	userRole := c.GetInt("user_role")

	// 1. Validate ID
	idParam := c.Param("id")
	composerID, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		responses.ERROR(c, http.StatusBadRequest, errors.New("invalid ID"))
		return
	}

	// 2. Service execution
	err = ctrl.service.DeleteComposer(uid, uint(composerID), userRole)
	if err != nil {
		switch {
		case errors.Is(err, apperrors.ErrFileDeletion):
			responses.JSON(c, http.StatusOK, gin.H{
				"message": "Composer deleted, but some files could not be removed",
			})
		case errors.Is(err, apperrors.ErrFileNotFound):
			responses.JSON(c, http.StatusOK, gin.H{
				"message": "Composer deleted, but some files were missing",
			})
		case errors.Is(err, apperrors.ErrComposerNotFound):
			responses.ERROR(c, http.StatusNotFound, err)
		case errors.Is(err, apperrors.ErrAccessForbidden):
			responses.ERROR(c, http.StatusForbidden, err)
		default:
			responses.ERROR(c, http.StatusInternalServerError, err)
		}
		return
	}

	// 3. Success response
	responses.JSON(c, http.StatusOK, gin.H{"message": "Composer deleted successfully"})
}
