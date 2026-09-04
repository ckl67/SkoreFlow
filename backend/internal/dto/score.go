package dto

import "backend/internal/models"

type CreateScoreResponse struct {
	Message string `json:"message"`
	Id      uint32 `json:"id"`
}

type ScorePublicResponse struct {
	ID              uint32                 `json:"id"`
	ScoreName       string                 `json:"name"`
	ComposerID      uint32                 `json:"composerId"`
	Composer        ComposerPublicResponse `json:"composer"`
	ReleaseDate     string                 `json:"releaseDate"`
	FilePath        string                 `json:"filePath"`
	ThumbnailPath   string                 `json:"thumbnailPath"`
	UploaderID      uint32                 `json:"uploaderId"`
	Tags            string                 `json:"tags"`
	Categories      string                 `json:"categories"`
	InformationText string                 `json:"informationText"`
	Annotations     string                 `json:"annotations"`
	CreatedAt       string                 `json:"createdAt"`
	UpdatedAt       string                 `json:"updatedAt"`
	IsDemo          bool                   `json:"isDemo"`
}

type GetScoresPageResponse struct {
	Message    string                `json:"message"`
	Page       int                   `json:"page"`
	Limit      int                   `json:"limit"`
	TotalRows  int64                 `json:"total_rows"`
	TotalPages int                   `json:"total_pages"`
	Scores     []ScorePublicResponse `json:"scores"`
}

type GetScoreResponse struct {
	Message string              `json:"message"`
	Score   ScorePublicResponse `json:"score"`
}

// --------------------------------------------------------------------------
// Function
// --------------------------------------------------------------------------

func ToScorePublicResponse(score *models.Score) ScorePublicResponse {
	return ScorePublicResponse{
		ID:         score.ID,
		ScoreName:  score.ScoreName,
		ComposerID: score.ComposerID,

		Composer: ToComposerPublicResponse(&score.Composer),

		ReleaseDate:     score.ReleaseDate.Format("2006-01-02"),
		FilePath:        score.FilePath,
		ThumbnailPath:   score.ThumbnailPath,
		UploaderID:      score.UploaderID,
		Tags:            score.Tags,
		Categories:      score.Categories,
		InformationText: score.InformationText,
		Annotations:     score.Annotations,
		CreatedAt:       score.CreatedAt.Format("2006-01-02 15:04:05"),
		UpdatedAt:       score.UpdatedAt.Format("2006-01-02 15:04:05"),
		IsDemo:          score.IsDemo,
	}
}

func ToScoresPublicResponse(scores []*models.Score) []ScorePublicResponse {
	result := make([]ScorePublicResponse, len(scores))

	for i, score := range scores {
		result[i] = ToScorePublicResponse(score)
	}

	return result
}
