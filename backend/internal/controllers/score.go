//cspell:ignore gonic
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

	"backend/infrastructure/logger"
	"backend/internal/apperrors"
	"backend/internal/dto"
	"backend/internal/forms"
	"backend/internal/models"
	"backend/internal/services"
	"backend/pkg/responses"

	"github.com/gin-gonic/gin"
)

// ScoreController
// Handles all HTTP endpoints related to score management.
// Delegates business logic to ScoreService.
type ScoreController struct {
	service *services.ScoreService
}

func NewScoreController(s *services.ScoreService) *ScoreController {
	return &ScoreController{service: s}
}

// CreateScore
// Handles the upload of a new music score.
func (ctrl *ScoreController) CreateScore(c *gin.Context) {
	// 1. User context
	uid := c.GetUint32("user_id")
	userRole := c.GetInt("user_role")

	logger.Score.Debug("(CreateScore): User ID: %d (Role: %d) will create a score\n", uid, userRole)

	// 2. Form binding
	// ShouldBind : Automatic Type Conversion: Converts string values from form fields or URLs into Go types (e.g., "42" to uint).
	var form forms.CreateScoreRequest
	if err := c.ShouldBind(&form); err != nil {
		responses.FAIL(c, http.StatusBadRequest, err)
		return
	}

	//logger.Score.Debug("(CreateScore): Form raw: %+v", c.Request.Form)

	// 3. Validation
	if err := form.ValidateForm(); err != nil {
		responses.FAIL(c, http.StatusBadRequest, err)
		return
	}

	// 4. Service call (passing file handle to service)
	scoreCreated, err := ctrl.service.CreateScore(uid, form)
	if err != nil {
		switch {
		case errors.Is(err, apperrors.ErrScoreAlreadyExists):
			responses.FAIL(c, http.StatusConflict, err)

		case errors.Is(err, apperrors.ErrComposerNotFound):
			responses.FAIL(c, http.StatusNotFound, err)

		case errors.Is(err, apperrors.ErrInvalidDate):
			responses.FAIL(c, http.StatusBadRequest, err)

		default:
			responses.FAIL(c, http.StatusInternalServerError, err)
		}
		return
	}

	// 5. Response
	response := dto.CreateScoreResponse{
		Message: "Score created successfully",
		Id:      scoreCreated.ID,
	}
	responses.SUCCESS(c, http.StatusCreated, response)
}

// UpdateScore
// Updates an existing score.
// Supports:
// - Metadata update (name, tags, etc.)
// - Optional file replacement
func (ctrl *ScoreController) UpdateScore(c *gin.Context) {
	uid := c.GetUint32("user_id")

	// Update for ScoreId id
	idParam := c.Param("id")
	scoreId, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		responses.FAIL(c, http.StatusBadRequest, apperrors.ErrScoreInvalidID)
		return
	}

	// 2. Form binding (metadata + optional file)
	var form forms.UpdateScoreRequest
	if err := c.ShouldBind(&form); err != nil {
		responses.FAIL(c, http.StatusBadRequest, err)
		return
	}

	if err := form.ValidateForm(); err != nil {
		responses.FAIL(c, http.StatusBadRequest, err)
		return
	}

	logger.Score.Debug("(Controller UpdateScore) : initiated by user: %d for scoreId: %d", uid, scoreId)

	updatedScore, err := ctrl.service.UpdateScore(uid, uint(scoreId), form)
	if err != nil {
		switch {
		case errors.Is(err, apperrors.ErrScoreNotFound):
			responses.FAIL(c, http.StatusNotFound, err)

		case errors.Is(err, apperrors.ErrComposerNotFound):
			responses.FAIL(c, http.StatusNotFound, err)

		case errors.Is(err, apperrors.ErrAccessForbidden):
			responses.FAIL(c, http.StatusForbidden, err)

		case errors.Is(err, apperrors.ErrInvalidDate):
			responses.FAIL(c, http.StatusBadRequest, err)

		default:
			responses.FAIL(c, http.StatusInternalServerError, err)
		}
		return
	}

	message := fmt.Sprintf("Score %d updated successfully", updatedScore.ID)

	response := dto.UpdateScoreResponse{
		Message: message,
		Score:   dto.ToScorePublicResponse(updatedScore),
	}

	responses.SUCCESS(c, http.StatusOK, response)

}

// DeleteScore
// Deletes a score and its associated files.
// Authorization:
// - Allowed for owner or admin
// Special cases:
// - Partial file deletion failure still returns success with warning
func (ctrl *ScoreController) DeleteScore(c *gin.Context) {
	uid := c.GetUint32("user_id")
	userRole := c.GetInt("user_role")

	idParam := c.Param("id")
	scoreID, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		responses.FAIL(c, http.StatusBadRequest, errors.New("invalid ID"))
		return
	}

	err = ctrl.service.DeleteScore(uid, uint(scoreID), userRole)
	if err != nil {
		switch {
		case errors.Is(err, apperrors.ErrFileDeletion):
			responses.SUCCESS(c, http.StatusOK, gin.H{
				"message": "Score deleted, but some files could not be removed",
			})
		case errors.Is(err, apperrors.ErrFileNotFound):
			responses.SUCCESS(c, http.StatusOK, gin.H{
				"message": "Score deleted but some files were missing",
			})
		case errors.Is(err, apperrors.ErrScoreNotFound):
			responses.FAIL(c, http.StatusNotFound, err)
		case errors.Is(err, apperrors.ErrAccessForbidden):
			responses.FAIL(c, http.StatusForbidden, err)
		default:
			responses.FAIL(c, http.StatusInternalServerError, err)
		}
		return
	}

	responses.SUCCESS(c, http.StatusOK, gin.H{"message": "Score deleted successfully"})
}

// GetScore
// Retrieves a single score by ID.
// GetScore retrieves detailed information for a single score
func (ctrl *ScoreController) GetScore(c *gin.Context) {
	uid := c.GetUint32("user_id")

	idParam := c.Param("id")
	sid, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		responses.FAIL(c, http.StatusBadRequest, apperrors.ErrScoreInvalidID)
		return
	}

	score, err := ctrl.service.GetScore(uid, uint(sid))
	if err != nil {
		switch err {
		case apperrors.ErrScoreNotFound:
			responses.FAIL(c, http.StatusNotFound, err)
		default:
			responses.FAIL(c, http.StatusInternalServerError, err)
		}
		return
	}

	response := dto.GetScoreResponse{
		Message: "Score retrieved successfully",
		Score:   dto.ToScorePublicResponse(score),
	}

	responses.SUCCESS(c, http.StatusOK, response)

}

// UpdateAnnotations
// Updates only the annotations field of a score.
// Designed for lightweight partial updates (AJAX/editor use cases).
func (ctrl *ScoreController) UpdateAnnotations(c *gin.Context) {
	uid := c.GetUint32("user_id")

	// Update for ScoreId id
	idParam := c.Param("id")
	scoreID, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		responses.FAIL(c, http.StatusBadRequest, apperrors.ErrScoreInvalidID)
		return
	}

	// Form binding
	var form forms.UpdateScoreAnnotationRequest
	if err := c.ShouldBind(&form); err != nil {
		responses.FAIL(c, http.StatusBadRequest, err)
		return
	}

	err = ctrl.service.UpdateAnnotations(uid, uint(scoreID), form)
	if err != nil {
		if errors.Is(err, apperrors.ErrScoreNotFound) {
			responses.FAIL(c, http.StatusNotFound, err)
			return
		}
		if errors.Is(err, apperrors.ErrAccessForbidden) {
			responses.FAIL(c, http.StatusForbidden, err)
			return
		}
		responses.FAIL(c, http.StatusInternalServerError, err)
		return
	}

	message := fmt.Sprintf("Score %d : Annotation saved successfully", scoreID)
	response := dto.UpdateScoreAnnotationResponse{
		Message: message,
	}

	responses.SUCCESS(c, http.StatusOK, response)

}

// GetScoresPage
// Retrieves a paginated list of scores.
// Supports filtering (search, tags, categories, composer) and sorting.
// Returns both data and pagination metadata.
func (ctrl *ScoreController) GetScoresPage(c *gin.Context) {
	isDemo := false
	uid := c.GetUint32("user_id")

	var form forms.GetScoresPageRequest
	if err := c.ShouldBind(&form); err != nil {
		responses.FAIL(c, http.StatusBadRequest, err)
		return
	}

	// logger.Score.Debug("(Controller GetScoresPage) : User: %d | Search: %v | Page: %d | PageSize: %d | SortBy: %s", uid, form.Name, form.Page, form.Limit, form.SortBy)

	pageData, err := ctrl.service.GetScoresPage(uid, isDemo, form)
	if err != nil {
		responses.FAIL(c, http.StatusInternalServerError, err)
		return
	}

	// Cast to scores
	var scores []*models.Score
	var ok bool
	scores, ok = pageData.Rows.([]*models.Score)
	if !ok {
		responses.FAIL(c, http.StatusInternalServerError, fmt.Errorf("invalid scores type"))
		return
	}

	response := dto.GetScoresPageResponse{
		Message:    "scores retrieved successfully",
		Page:       pageData.Page,
		Limit:      pageData.Limit,
		TotalRows:  pageData.TotalRows,
		TotalPages: pageData.TotalPages,
		Scores:     dto.ToScoresPublicResponse(scores),
	}

	responses.SUCCESS(c, http.StatusOK, response)
}
