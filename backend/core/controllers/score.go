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
	uid := c.GetUint32("user_id")
	userRole := c.GetInt("user_role")

	logger.Score.Debug("(CreateScore): User ID: %d, User Role: %d will create a score\n", uid, userRole)

	// logger.Score.Debug("(CreateScore): Content-Type: %s", c.ContentType())

	var form forms.CreateScoreRequest
	if err := c.ShouldBind(&form); err != nil {
		responses.FAIL(c, http.StatusBadRequest, err)
		return
	}

	logger.Score.Debug("(CreateScore): Form raw: %+v", c.Request.Form)

	if err := form.ValidateForm(); err != nil {
		responses.FAIL(c, http.StatusBadRequest, err)
		return
	}

	err := ctrl.service.CreateScore(uid, form, form.File)
	if err != nil {
		switch {
		case errors.Is(err, apperrors.ErrScoreAlreadyExists):
			responses.FAIL(c, http.StatusConflict, err)
		default:
			responses.FAIL(c, http.StatusInternalServerError, err)
		}
		return
	}

	responses.SUCCESS(c, http.StatusAccepted, gin.H{
		"message": "File uploaded successfully",
	})
}

// UpdateScore
// Updates an existing score.
// Supports:
// - Metadata update (name, tags, etc.)
// - Optional file replacement
func (ctrl *ScoreController) UpdateScore(c *gin.Context) {
	uid := c.GetUint32("user_id")
	userRole := c.GetInt("user_role")

	idParam := c.Param("id")
	scoreID, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		responses.FAIL(c, http.StatusBadRequest, errors.New("score ID must be a valid number"))
		return
	}

	var form forms.UpdateScoreRequest
	if err := c.ShouldBind(&form); err != nil {
		responses.FAIL(c, http.StatusBadRequest, err)
		return
	}

	if err := form.ValidateForm(); err != nil {
		responses.FAIL(c, http.StatusBadRequest, err)
		return
	}

	logger.Score.Debug("(Controller UpdateScore) : initiated by user %d - role %d for ID %d", uid, userRole, scoreID)

	updatedScore, err := ctrl.service.UpdateScore(uid, uint(scoreID), form, form.File)
	if err != nil {
		switch {
		case errors.Is(err, apperrors.ErrScoreNotFound):
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

	responses.SUCCESS(c, http.StatusOK, gin.H{
		"message": fmt.Sprintf("Score '%s' (ID: %d) updated", updatedScore.ScoreName, updatedScore.ID),
		"id":      scoreID,
	})
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
// Includes access control (owner or admin).
func (ctrl *ScoreController) GetScore(c *gin.Context) {
	uid := c.GetUint32("user_id")
	userRole := c.GetInt("user_role")

	idParam := c.Param("id")
	scoreID, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		responses.FAIL(c, http.StatusBadRequest, apperrors.ErrScoreInvalidID)
		return
	}

	score, err := ctrl.service.GetScore(uid, uint(scoreID), userRole)
	if err != nil {
		switch err {
		case apperrors.ErrScoreNotFound:
			responses.FAIL(c, http.StatusNotFound, err)
		case apperrors.ErrAccessForbidden:
			responses.FAIL(c, http.StatusForbidden, err)
		default:
			responses.FAIL(c, http.StatusInternalServerError, err)
		}
		return
	}

	responses.SUCCESS(c, http.StatusOK, score)
}

// UpdateAnnotations
// Updates only the annotations field of a score.
// Designed for lightweight partial updates (AJAX/editor use cases).
func (ctrl *ScoreController) UpdateAnnotations(c *gin.Context) {
	uid := c.GetUint32("user_id")

	idParam := c.Param("id")
	scoreID, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		responses.FAIL(c, http.StatusBadRequest, apperrors.ErrScoreInvalidID)
		return
	}

	var input struct {
		Annotations string `json:"annotations"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		responses.VALIDATION_ERROR(c, err)
		return
	}

	err = ctrl.service.UpdateAnnotations(uid, uint(scoreID), input.Annotations)
	if err != nil {
		if errors.Is(err, apperrors.ErrScoreNotFound) {
			responses.FAIL(c, http.StatusNotFound, err)
			return
		}
		responses.FAIL(c, http.StatusInternalServerError, err)
		return
	}

	responses.SUCCESS(c, http.StatusOK, gin.H{"message": "Annotations saved"})
}

// GetScoresPage
// Retrieves a paginated list of scores.
// Supports filtering (search, tags, categories, composer) and sorting.
// Returns both data and pagination metadata.
func (ctrl *ScoreController) GetScoresPage(c *gin.Context) {
	uid := c.GetUint32("user_id")

	var form forms.GetScoresPageRequest
	if err := c.ShouldBind(&form); err != nil {
		responses.FAIL(c, http.StatusBadRequest, err)
		return
	}

	logger.Score.Debug("(Controller GetScoresPage) : User: %d | Search: %s | Page: %d | PageSize: %d | SortBy: %s", uid, form.Search, form.Page, form.Limit, form.SortBy)

	pageData, err := ctrl.service.GetScoresPage(uid, form)
	if err != nil {
		responses.FAIL(c, http.StatusInternalServerError, err)
		return
	}

	responses.SUCCESS(c, http.StatusOK, pageData)
}
