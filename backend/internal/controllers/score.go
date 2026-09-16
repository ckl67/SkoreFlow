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

	"backend/infrastructure/config"
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
func (ctrl *ScoreController) DeleteScore(c *gin.Context) {
	uid := c.GetUint32("user_id")

	idParam := c.Param("id")
	scoreId, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		responses.FAIL(c, http.StatusBadRequest, apperrors.ErrScoreInvalidID)
		return
	}

	err = ctrl.service.DeleteScore(uid, uint(scoreId))
	if err != nil {
		switch {
		case errors.Is(err, apperrors.ErrFileDeletion):
			response := dto.DeleteScoreResponse{
				Message: "Score deleted, but some files could not be removed",
			}
			responses.SUCCESS(c, http.StatusOK, response)

		case errors.Is(err, apperrors.ErrFileNotFound):
			response := dto.DeleteScoreResponse{
				Message: "Score deleted but some files were missing",
			}
			responses.SUCCESS(c, http.StatusOK, response)

		case errors.Is(err, apperrors.ErrScoreNotFound):
			responses.FAIL(c, http.StatusNotFound, err)

		case errors.Is(err, apperrors.ErrAccessForbidden):
			responses.FAIL(c, http.StatusForbidden, err)

		default:
			responses.FAIL(c, http.StatusInternalServerError, err)
		}
		return
	}

	response := dto.DeleteScoreResponse{
		Message: "Score deleted successfully",
	}
	responses.SUCCESS(c, http.StatusOK, response)
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

	score, err := ctrl.service.GetScore(uid, uint(sid), false)
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

// GetDemoScore
// Retrieves a single score by ID.
// GetScore retrieves detailed information for a single score
func (ctrl *ScoreController) GetDemoScore(c *gin.Context) {
	//uid := c.GetUint32("user_id")
	uid := config.UidDemo
	idParam := c.Param("id")
	sid, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		responses.FAIL(c, http.StatusBadRequest, apperrors.ErrScoreInvalidID)
		return
	}

	score, err := ctrl.service.GetScore(uid, uint(sid), true)
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
	logger.Score.Info("(Controller GetScoresPage) : User: %d | Search: %v | Page: %d | PageSize: %d | SortBy: %s | SearchMode :%s ",
		uid,
		form.Name,
		form.Page,
		form.Limit,
		form.SortBy,
		form.SearchMode,
	)

	pagination, err := ctrl.service.GetScoresPage(uid, isDemo, form)
	if err != nil {
		responses.FAIL(c, http.StatusInternalServerError, err)
		return
	}

	// Pagination.Rows is stored as interface{} because the same Pagination
	// structure is reused for different entities (composers, scores, composers, ...).
	// The "ok" value prevents a panic if Rows contains an unexpected type.
	// Cast to scores
	var scores []*models.Score
	var ok bool
	scores, ok = pagination.Rows.([]*models.Score)
	if !ok {
		responses.FAIL(c, http.StatusInternalServerError, fmt.Errorf("invalid scores type"))
		return
	}

	message := "scores retrieved successfully"

	if pagination.TotalRows == 0 {
		switch {
		case form.Name != nil && pagination.SearchMode == "exact":
			message = fmt.Sprintf(
				"no score found with exact name: %s",
				*form.Name,
			)

		case form.Name != nil:
			message = fmt.Sprintf(
				"no score found for search: %s",
				*form.Name,
			)

		default:
			message = "no scores found"
		}
	}

	response := dto.GetScoresPageResponse{
		Message:    message,
		Page:       pagination.Page,
		Limit:      pagination.Limit,
		TotalRows:  pagination.TotalRows,
		TotalPages: pagination.TotalPages,
		Scores:     dto.ToScoresPublicResponse(scores),
	}

	responses.SUCCESS(c, http.StatusOK, response)
}

// GetDemoScoresPage
// Retrieves a paginated list of scores.
// Supports filtering (search, tags, categories, composer) and sorting.
// Returns both data and pagination metadata.
func (ctrl *ScoreController) GetDemoScoresPage(c *gin.Context) {
	isDemo := true
	uid := config.UidDemo

	var form forms.GetScoresPageRequest
	if err := c.ShouldBind(&form); err != nil {
		responses.FAIL(c, http.StatusBadRequest, err)
		return
	}
	logger.Score.Info("(Controller GetScoresPage) : User: %d | Search: %v | Page: %d | PageSize: %d | SortBy: %s | SearchMode :%s ",
		uid,
		form.Name,
		form.Page,
		form.Limit,
		form.SortBy,
		form.SearchMode,
	)

	pagination, err := ctrl.service.GetScoresPage(uid, isDemo, form)
	if err != nil {
		responses.FAIL(c, http.StatusInternalServerError, err)
		return
	}

	// Pagination.Rows is stored as interface{} because the same Pagination
	// structure is reused for different entities (composers, scores, composers, ...).
	// The "ok" value prevents a panic if Rows contains an unexpected type.
	// Cast to scores
	var scores []*models.Score
	var ok bool
	scores, ok = pagination.Rows.([]*models.Score)
	if !ok {
		responses.FAIL(c, http.StatusInternalServerError, fmt.Errorf("invalid scores type"))
		return
	}

	message := "scores retrieved successfully"

	if pagination.TotalRows == 0 {
		switch {
		case form.Name != nil && pagination.SearchMode == "exact":
			message = fmt.Sprintf(
				"no score found with exact name: %s",
				*form.Name,
			)

		case form.Name != nil:
			message = fmt.Sprintf(
				"no score found for search: %s",
				*form.Name,
			)

		default:
			message = "no scores found"
		}
	}

	response := dto.GetScoresPageResponse{
		Message:    message,
		Page:       pagination.Page,
		Limit:      pagination.Limit,
		TotalRows:  pagination.TotalRows,
		TotalPages: pagination.TotalPages,
		Scores:     dto.ToScoresPublicResponse(scores),
	}

	responses.SUCCESS(c, http.StatusOK, response)
}

// GetScoreFile
func (ctrl *ScoreController) GetScoreFile(c *gin.Context) {
	// We are Not in the same situation than for Avatar
	// Because the same reference will always return the same picture
	// So we can ask for a very long cover 24 x 3600 secondes = 86400
	c.Header("Cache-Control", "private, max-age=86400")

	isDemo := false
	uid := c.GetUint32("user_id")

	cidString := c.Param("id")
	cid, err := strconv.ParseUint(cidString, 10, 32)
	if err != nil || cid <= 0 {
		responses.FAIL(c, http.StatusBadRequest, fmt.Errorf("invalid score id"))
		return
	}

	logger.Score.Info(
		"Origin=%q Authorization=%t",
		c.GetHeader("Origin"),
		c.GetHeader("Authorization") != "",
	)

	file, err := ctrl.service.ScoreFileData(uint32(cid), uid, isDemo)
	logger.Score.Debug("(Ctrl-GetScoreFile) ScoreFileData : %s", file)
	if err != nil {
		responses.FAIL(c, http.StatusNotFound, err)
		return
	}

	c.File(file)
}

// GetScoreThumbnail
func (ctrl *ScoreController) GetScoreThumbnail(c *gin.Context) {
	// We are Not in the same situation than for Avatar
	// Because the same reference will always return the same picture
	// So we can ask for a very long cover 24 x 3600 secondes = 86400
	c.Header("Cache-Control", "private, max-age=86400")

	isDemo := false
	uid := c.GetUint32("user_id")

	cidString := c.Param("id")
	cid, err := strconv.ParseUint(cidString, 10, 32)
	if err != nil || cid <= 0 {
		responses.FAIL(c, http.StatusBadRequest, fmt.Errorf("invalid composer id"))
		return
	}

	file, err := ctrl.service.ScoreThumbnailData(uint32(cid), uid, isDemo)
	logger.Score.Debug("(Ctrl-GetScoreThumbnail) ScoreThumbnailData : %s", file)
	if err != nil {
		responses.FAIL(c, http.StatusNotFound, err)
		return
	}

	c.File(file)
}

// GetDemoScoreFile
func (ctrl *ScoreController) GetDemoScoreFile(c *gin.Context) {
	// We are Not in the same situation than for Avatar
	// Because the same reference will always return the same picture
	// So we can ask for a very long cover 24 x 3600 secondes = 86400
	c.Header("Cache-Control", "private, max-age=86400")

	isDemo := true
	uid := config.UidDemo

	cidString := c.Param("id")
	cid, err := strconv.ParseUint(cidString, 10, 32)
	if err != nil || cid <= 0 {
		responses.FAIL(c, http.StatusBadRequest, fmt.Errorf("invalid score id"))
		return
	}

	logger.Score.Info(
		"Origin=%q Authorization=%t",
		c.GetHeader("Origin"),
		c.GetHeader("Authorization") != "",
	)

	file, err := ctrl.service.ScoreFileData(uint32(cid), uid, isDemo)
	logger.Score.Debug("(Ctrl-GetDemoScoreFile) ScoreFileData : %s", file)
	if err != nil {
		responses.FAIL(c, http.StatusNotFound, err)
		return
	}

	c.File(file)
}

// GetDemoScoreThumbnail
func (ctrl *ScoreController) GetDemoScoreThumbnail(c *gin.Context) {
	// We are Not in the same situation than for Avatar
	// Because the same reference will always return the same picture
	// So we can ask for a very long cover 24 x 3600 secondes = 86400
	c.Header("Cache-Control", "private, max-age=86400")

	isDemo := true
	uid := config.UidDemo

	cidString := c.Param("id")
	cid, err := strconv.ParseUint(cidString, 10, 32)
	if err != nil || cid <= 0 {
		responses.FAIL(c, http.StatusBadRequest, fmt.Errorf("invalid composer id"))
		return
	}

	file, err := ctrl.service.ScoreThumbnailData(uint32(cid), uid, isDemo)
	logger.Score.Debug("(Ctrl-GetDemoScoreThumbnail) ScoreThumbnailData : %s", file)
	if err != nil {
		responses.FAIL(c, http.StatusNotFound, err)
		return
	}

	c.File(file)
}
