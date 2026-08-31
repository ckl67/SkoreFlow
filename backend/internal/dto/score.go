package dto

type CreateScoreResponse struct {
	Message string `json:"message"`
	Id      uint32 `json:"id"`
}

type ScorePublicResponse struct {
	ID          uint32 `json:"id"`
	Name        string `json:"name"`
	Picture     string `json:"picture"`
	ExternalURL string `json:"external_url"`
	Epoch       string `json:"epoch"`
	IsVerified  bool   `json:"isVerified"`
	IsDemo      bool   `json:"isDemo"`
}
