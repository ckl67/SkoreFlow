package dto

import "backend/core/models"

type ComposerPublicResponse struct {
	ID          uint32 `json:"id"`
	Name        string `json:"name"`
	Picture     string `json:"picture"`
	ExternalURL string `json:"external_url"`
	Epoch       string `json:"epoch"`
	IsVerified  bool   `json:"isVerified"`
}

type CreateComposerResponse struct {
	Message string `json:"message"`
	Id      uint32 `json:"id"`
}

type GetComposersPageResponse struct {
	Message    string                   `json:"message"`
	Page       int                      `json:"page"`
	Limit      int                      `json:"limit"`
	TotalRows  int64                    `json:"total_rows"`
	TotalPages int                      `json:"total_pages"`
	Composers  []ComposerPublicResponse `json:"composers"`
}

type GetComposerResponse struct {
	Message  string                 `json:"message"`
	Composer ComposerPublicResponse `json:"composer"`
}

// --------------------------------------------------------------------------
// Function
// --------------------------------------------------------------------------
func ToComposerPublicResponse(composer *models.Composer) ComposerPublicResponse {
	return ComposerPublicResponse{
		ID:          composer.ID,
		Name:        composer.Name,
		Picture:     composer.Picture,
		ExternalURL: composer.ExternalURL,
		Epoch:       composer.Epoch,
		IsVerified:  composer.IsVerified,
	}
}

func ToComposersPublicResponse(composers []*models.Composer) []ComposerPublicResponse {
	result := make([]ComposerPublicResponse, len(composers))

	for i, u := range composers {
		result[i] = ToComposerPublicResponse(u)
	}
	return result
}
