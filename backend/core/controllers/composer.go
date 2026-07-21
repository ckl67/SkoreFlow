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
	"backend/core/dto"
	"backend/core/forms"
	"backend/core/models"
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

	logger.Composer.Debug("(CreateComposer) Request by User ID: %d with User Role: %d\n", uid, userRole)

	// 2. Form binding
	var form forms.CreateComposerRequest
	if err := c.ShouldBind(&form); err != nil {
		responses.FAIL(c, http.StatusBadRequest, err)
		return
	}

	// 3. Validation
	if err := form.ValidateForm(); err != nil {
		responses.FAIL(c, http.StatusBadRequest, err)
		return
	}

	// 4. Service call (passing file handle to service)
	composerCreated, err := ctrl.service.CreateComposer(uid, userRole, form)
	if err != nil {
		logger.Composer.Error("(CreateComposer Controller) Error returned by service: %v", err)
		switch err {
		case apperrors.ErrComposerAlreadyExists:
			responses.FAIL(c, http.StatusConflict, err) // 409
		case apperrors.ErrAccessForbidden:
			responses.FAIL(c, http.StatusForbidden, err) // 403
		case apperrors.ErrImageFormatInvalid:
			responses.FAIL(c, http.StatusBadRequest, err) // 400
		default:
			responses.FAIL(c, http.StatusInternalServerError, err)
		}
		return
	}

	// 5. Response
	response := dto.CreateComposerResponse{
		Message: "Composer created successfully",
		Id:      composerCreated.ID,
	}
	responses.SUCCESS(c, http.StatusCreated, response)
}

// GetComposersPage fetches a paginated list of composers with optional search filters
func (ctrl *ComposerController) GetComposersPage(c *gin.Context) {
	uid := c.GetUint32("user_id")

	var form forms.GetComposersPageRequest
	if err := c.ShouldBind(&form); err != nil {
		responses.FAIL(c, http.StatusBadRequest, err)
		return
	}

	logger.Score.Debug("(Controller GetComposersPage) : User: %d | Search: %v (IsVerified = %v) | Page: %d | PageSize: %d | SortBy: %s",
		uid, form.Name, form.IsVerified, form.Page, form.Limit, form.SortBy)

	pageData, err := ctrl.service.GetComposersPage(uid, form)
	if err != nil {
		responses.FAIL(c, http.StatusInternalServerError, err)
		return
	}

	//responses.SUCCESS(c, http.StatusOK, pageData)

	// Cast to composers
	// Pagination.Rows is stored as interface{} because the same Pagination
	// structure is reused for different entities (composers, scores, composers, ...).
	//
	// Here we know that GetComposersPage() populated Rows with []*models.Composers,
	// so we perform a type assertion to recover the concrete type.
	//
	// The "ok" value prevents a panic if Rows contains an unexpected type.
	// This is mandatory to avoid a panic and a program stop !!
	//
	// Example
	// var x interface{} --> x contains something but we don't know what
	// Could be
	//		x = 123
	//		x = "hello"
	//    x = []*models.Composers{}
	// To get the right value
	// 	composers, ok := x.([]*models.Composers)

	var composers []*models.Composer
	var ok bool
	composers, ok = pageData.Rows.([]*models.Composer)
	if !ok {
		responses.FAIL(c, http.StatusInternalServerError, fmt.Errorf("invalid composers type"))
		return
	}

	response := dto.GetComposersPageResponse{
		Message:    "composers retrieved successfully",
		Page:       pageData.Page,
		Limit:      pageData.Limit,
		TotalRows:  pageData.TotalRows,
		TotalPages: pageData.TotalPages,
		Composers:  dto.ToComposersPublicResponse(composers),
	}

	responses.SUCCESS(c, http.StatusOK, response)

}

// GetComposer retrieves detailed information for a single composer
func (ctrl *ComposerController) GetComposer(c *gin.Context) {
	idParam := c.Param("id")
	cid, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		responses.FAIL(c, http.StatusBadRequest, apperrors.ErrComposerInvalidID)
		return
	}

	composer, err := ctrl.service.GetComposer(uint(cid))
	if err != nil {
		switch err {
		case apperrors.ErrComposerNotFound:
			responses.FAIL(c, http.StatusNotFound, err)
		default:
			responses.FAIL(c, http.StatusInternalServerError, err)
		}
		return
	}

	response := dto.GetComposerResponse{
		Message:  "Composer retrieved successfully",
		Composer: dto.ToComposerPublicResponse(composer),
	}

	responses.SUCCESS(c, http.StatusOK, response)

}

// Merge Composer from source to target in all the scores
// --> Replace composers in the scores then delete Composers
func (ctrl *ComposerController) MergeComposers(c *gin.Context) {
	uid := c.GetUint32("user_id")
	userRole := c.GetInt("user_role")

	var form forms.GetComposersMergeRequest
	if err := c.ShouldBindJSON(&form); err != nil {
		responses.FAIL(c, http.StatusBadRequest, err)
		return
	}

	logger.Score.Debug("(Controller MergeComposers) : User: %d with role : %d will merge Composer ID %d to %d| ",
		uid, userRole, form.SourceID, form.TargetID)

	err := ctrl.service.MergeComposers(uid, userRole, form.SourceID, form.TargetID)
	if err != nil {
		switch err {
		case apperrors.ErrComposerMerging:
			responses.FAIL(c, http.StatusBadRequest, err)
		case apperrors.ErrComposerNotFound:
			responses.FAIL(c, http.StatusNotFound, err)
		default:
			responses.FAIL(c, http.StatusInternalServerError, err)
		}
		return
	}

	responses.SUCCESS(c, http.StatusOK, gin.H{"message": "Composer merging successfully"})

}

// UpdateComposer updates an existing composer (metadata and optional file)
func (ctrl *ComposerController) UpdateComposer(c *gin.Context) {
	uid := c.GetUint32("user_id")
	userRole := c.GetInt("user_role")

	// 1. Retrieve and validate ID from URL
	idParam := c.Param("id")
	cid, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		responses.FAIL(c, http.StatusBadRequest, errors.New("Composer ID must be a valid number"))
		return
	}

	// 2. Form binding (metadata + optional file)
	var form forms.UpdateComposerRequest
	if err := c.ShouldBind(&form); err != nil {
		responses.FAIL(c, http.StatusBadRequest, err)
		return
	}

	logger.Composer.Debug("(Controller UpdateComposer) : initiated by user %d - role %d for Composer ID %d", uid, userRole, cid)

	// 3. Service execution
	updatedComposer, err := ctrl.service.UpdateComposer(uid, userRole, uint(cid), form)
	if err != nil {
		switch {
		case errors.Is(err, apperrors.ErrComposerNotFound):
			responses.FAIL(c, http.StatusNotFound, err)
		case errors.Is(err, apperrors.ErrAccessForbidden):
			responses.FAIL(c, http.StatusForbidden, err)
		default:
			responses.FAIL(c, http.StatusInternalServerError, err)
		}
		return
	}

	message := fmt.Sprintf("Composer %d updated successfully", updatedComposer.ID)

	response := dto.GetComposerResponse{
		Message:  message,
		Composer: dto.ToComposerPublicResponse(updatedComposer),
	}

	responses.SUCCESS(c, http.StatusOK, response)

}

// DeleteComposer handles the removal of a composer (database and file system)
// Access is restricted by ownership or admin privileges
func (ctrl *ComposerController) DeleteComposer(c *gin.Context) {
	uid := c.GetUint32("user_id")
	userRole := c.GetInt("user_role")

	// 1. Validate ID
	idParam := c.Param("id")
	cid, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		responses.FAIL(c, http.StatusBadRequest, errors.New("invalid ID"))
		return
	}

	// 2. Service execution
	err = ctrl.service.DeleteComposer(uid, uint(cid), userRole)
	if err != nil {
		switch {
		case errors.Is(err, apperrors.ErrFileDeletion):
			responses.SUCCESS(c, http.StatusOK, gin.H{
				"message": "Composer deleted, but some files could not be removed",
			})
		case errors.Is(err, apperrors.ErrFileNotFound):
			responses.SUCCESS(c, http.StatusOK, gin.H{
				"message": "Composer deleted, but some files were missing",
			})
		case errors.Is(err, apperrors.ErrComposerNotFound):
			responses.FAIL(c, http.StatusNotFound, err)
		case errors.Is(err, apperrors.ErrAccessForbidden):
			responses.FAIL(c, http.StatusForbidden, err)
		default:
			responses.FAIL(c, http.StatusInternalServerError, err)
		}
		return
	}

	// 3. Success response
	responses.SUCCESS(c, http.StatusOK, gin.H{"message": "Composer deleted successfully"})
}

func (ctrl *ComposerController) GetComposerPicture(c *gin.Context) {
	// We are Not in the same situation than for Avatar
	// Because the same reference will always return the same picture
	// So we can ask for a very long cover 24 x 3600 secondes = 86400
	c.Header("Cache-Control", "public, max-age=86400")

	cidString := c.Param("id")
	cid, err := strconv.ParseUint(cidString, 10, 32)
	if err != nil || cid <= 0 {
		responses.FAIL(c, http.StatusBadRequest, fmt.Errorf("invalid composer id"))
		return
	}

	file, err := ctrl.service.ComposerPictureFile(uint32(cid))
	logger.User.Debug("(Ctrl-GetComposerPicture) ComposerPictureFile : %s", file)
	if err != nil {
		responses.FAIL(c, http.StatusNotFound, err)
		return
	}

	c.File(file)
}
