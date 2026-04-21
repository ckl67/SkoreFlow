package models

// ===============================================================================================
// Layer              | Component      | Business Role
// -------------------|----------------|----------------------------------------------------------
// PERSISTENCE        | models/        | Handles database operations only (SQL via GORM).
// ===============================================================================================

import (
	"time"

	"gorm.io/gorm"
)

// Score represents a musical score stored in the database.
//
// Notes:
// - GORM tags (gorm:"...") define database schema and constraints.
// - JSON tags (json:"...") define API serialization.
//
// Compatibility:
// - Tags and Categories are stored as JSON strings for cross-database support.
//
// Constraints:
//   - Unique index on (safe_score_name, composer_id, uploader_id)
//     ensures no duplicate score per user/composer pair.
//
// File Storage:
// - FilePath and ThumbnailPath store full file paths.

type Score struct {
	ID            uint   `gorm:"primary_key;auto_increment" json:"id"`
	SafeScoreName string `gorm:"size:255;uniqueIndex:idx_score_user"`
	ScoreName     string `gorm:"size:255;not null" json:"score_name"`

	// Foreign key to Composer
	ComposerID uint     `gorm:"not null;index;uniqueIndex:idx_score_user" json:"composer_id"`
	Composer   Composer `gorm:"constraint:OnUpdate:CASCADE,OnDelete:RESTRICT;" json:"composer"`

	ReleaseDate     time.Time `gorm:"column:release_date;index;not null" json:"release_date"`
	FilePath        string    `gorm:"column:file_path;not null" json:"file_path"`
	ThumbnailPath   string    `gorm:"column:thumbnail_path;not null" json:"thumbnail_path"`
	UploaderID      uint32    `gorm:"not null;uniqueIndex:idx_score_user"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
	Tags            string    `gorm:"type:TEXT" json:"tags"`
	Categories      string    `gorm:"type:TEXT" json:"categories"`
	InformationText string    `gorm:"type:TEXT" json:"information_text"`
	Annotations     string    `gorm:"type:TEXT;default:'[]'" json:"annotations"` // JSON string
}

// Create inserts a new score record into the database.
// GORM automatically sets CreatedAt and UpdatedAt.
func (s *Score) Create(db *gorm.DB) error {
	return db.Create(s).Error
}

// Update performs a full update using db.Save().
//
// WARNING:
// - All fields are overwritten, including zero values.
// - The struct must be fully loaded beforehand.
func (s *Score) Update(db *gorm.DB) error {
	return db.Save(s).Error
}

// UpdateFields updates specific fields for a given score ID.
//
// Notes:
// - Accepts struct or map[string]interface{}.
// - Use map for partial updates or zero-value updates.
func (s *Score) UpdateFields(db *gorm.DB, id uint, data interface{}) error {
	return db.Model(&Score{}).Where("id = ?", id).Updates(data).Error
}

// ScoreExists checks if a score already exists for a given user and composer.
func ScoreExists(db *gorm.DB, safeName string, composerID uint, userID uint32) (bool, error) {
	var count int64

	err := db.Model(&Score{}).
		Where("safe_score_name = ? AND composer_id = ? AND uploader_id = ?",
			safeName, composerID, userID).
		Count(&count).Error

	return count > 0, err
}

// Delete permanently removes the score from the database.
// Uses Unscoped() to bypass soft delete if enabled.
func (s *Score) Delete(db *gorm.DB) (int64, error) {
	result := db.Unscoped().Delete(s)
	return result.RowsAffected, result.Error
}

// List retrieves scores with pagination, filtering, and search capabilities.
//
// Filters:
// - search: matches score name or safe name
// - composer: filters by composer (JOIN)
// - tag: filters by tags
// - category: filters by categories
//
// Scope:
// - Always restricted to a specific uploader (userID)
func (s *Score) List(
	db *gorm.DB,
	pagination *Pagination,
	composer string,
	tag string,
	category string,
	search string,
	userID uint32,
) (*Pagination, error) {
	var scores []*Score

	// Base query (scoped to user)
	query := db.Model(&Score{}).Where("uploader_id = ?", userID)

	// Search filter
	if search != "" {
		searchTerm := "%" + search + "%"
		query = query.Where("(score_name LIKE ? OR safe_score_name LIKE ?)", searchTerm, searchTerm)
	}

	// Composer filter
	if composer != "" {
		query = query.Joins("JOIN composers ON composers.id = scores.composer_id").
			Where("composers.safe_name LIKE ?", "%"+composer+"%")
	}

	// Tags & categories filters
	if tag != "" {
		query = query.Where("tags LIKE ?", "%"+tag+"%")
	}
	if category != "" {
		query = query.Where("categories LIKE ?", "%"+category+"%")
	}

	// Execute query with pagination
	err := query.Scopes(paginate(pagination, query)).Find(&scores).Error
	if err != nil {
		return nil, err
	}

	pagination.Rows = scores
	return pagination, nil
}

// FindScoreByID retrieves a score by its unique identifier.
func FindScoreByID(db *gorm.DB, id uint) (*Score, error) {
	var score Score
	err := db.First(&score, id).Error
	return &score, err
}
