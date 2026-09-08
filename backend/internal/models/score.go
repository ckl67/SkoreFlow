//cspell:ignore GORM datatypes
package models

// ===============================================================================================
// Layer              | Component      | Business Role
// -------------------|----------------|----------------------------------------------------------
// PERSISTENCE        | models/        | Handles database operations only (SQL via GORM).
// ===============================================================================================

import (
	"time"

	"gorm.io/datatypes" //
	"gorm.io/gorm"
)

// Score represents a musical score stored in the database.
//
// Notes:
// - GORM tags (gorm:"...") define database schema and constraints.
// - JSON tags (json:"...") define API serialization.
//
// File Storage:
// - FilePath stores the relative pdf file path for the score
//
// Timestamps:
// - CreatedAt is set on insert.
// - UpdatedAt is set on insert and updated on each modification.
// via : OnDelete:RESTRICT
// -	We cannot delete the composer whilst there are scores that reference them.
type Score struct {
	ID            uint32 `gorm:"primary_key;auto_increment" json:"id"`
	ScoreName     string `gorm:"size:255;not null" json:"score_name"`
	SafeScoreName string `gorm:"size:255;uniqueIndex:idx_score_user"`

	// Foreign key to Composer
	//  - ComposerID is the actual foreign key stored in the scores table.
	// 		: identifies the composer in the database
	// 	- Composer is the GORM relationship that allows you to manipulate the associated composer.
	// 		: represents the associated Composer object
	// To retrieve a score along with its composer, we need to
	// 		Preload("Composer")
	ComposerID uint32   `gorm:"not null;index;uniqueIndex:idx_score_user" json:"composer_id"`
	Composer   Composer `gorm:"constraint:OnUpdate:CASCADE,OnDelete:RESTRICT;" json:"composer"`

	ReleaseDate     time.Time `gorm:"column:release_date;index;not null" json:"release_date"`
	FilePath        string    `gorm:"column:file_path;not null" json:"file_path"`
	ThumbnailPath   string    `gorm:"column:thumbnail_path;not null" json:"thumbnail_path"`
	UploaderID      uint32    `gorm:"not null;uniqueIndex:idx_score_user"`
	Tags            string    `gorm:"type:TEXT" json:"tags"`
	Categories      string    `gorm:"type:TEXT" json:"categories"`
	InformationText string    `gorm:"type:TEXT" json:"information_text"`
	// GORM will automatically detect the correct type (JSON or TEXT for SQLite, JSONB for Postgres if configured).
	Annotations datatypes.JSON `gorm:"default:'[]'" json:"annotations"`
	IsDemo      bool           `gorm:"not null;default:false;index" json:"is_demo"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
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

func (s *Score) UpdateAnnotations(
	db *gorm.DB,
	annotations datatypes.JSON,
) error {
	return db.
		Model(s).
		Update("annotations", annotations).
		Error
}

// UpdateFields updates specific fields for a given score ID.
//
// Notes:
// - Accepts struct or map[string]interface{}.
// - Use map for partial updates or zero-value updates.
//func (s *Score) UpdateFields(db *gorm.DB, id uint, data interface{}) error {
//	return db.Model(&Score{}).Where("id = ?", id).Updates(data).Error
//}

// ScoreExists checks if a score already exists for a given user and composer.
func ScoreExists(db *gorm.DB, safeName string, composerID uint32, userID uint32) (bool, error) {
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
	composer *string,
	search *string,
	tag *string,
	category *string,
	userID uint32,
	isDemo bool,
) (*Pagination, error) {
	var scores []*Score

	sort := pagination.GetSort()
	//sort := pagination.Sort

	// As soon as a query involves several tables,
	// always specify the columns belonging to `scores`.
	// To avoid :  "message": "SQL logic error: ambiguous column name: is_demo (1)"
	// This avoids problem as `composers` and `scores` share is_demo
	query := db.Model(&Score{}).
		Preload("Composer").
		Where("scores.uploader_id = ?", userID).
		Where("scores.is_demo = ?", isDemo)

	// JOIN is required for composer filtering or composer sorting.
	// The variable will be set to true if at least one of the following conditions is met:
	// 	A ‘composer’ is present  OR The sort order requested is ‘composer asc’. OR ‘composer desc’.
	needsComposerJoin := composer != nil ||
		sort == "composer asc" ||
		sort == "composer desc"

	if needsComposerJoin {
		query = query.Joins(
			"JOIN composers ON composers.id = scores.composer_id",
		)
	}

	// Composer filter
	if composer != nil {
		query = query.Where(
			"composers.safe_name LIKE ?",
			"%"+*composer+"%",
		)
	}

	if search != nil {
		searchTerm := "%" + *search + "%"
		query = query.Where(
			"(scores.score_name LIKE ? OR scores.safe_score_name LIKE ?)",
			searchTerm,
			searchTerm,
		)
	}

	// Tags & categories filters
	if tag != nil {
		query = query.Where(
			"scores.tags LIKE ?",
			"%"+*tag+"%",
		)
	}

	if category != nil {
		query = query.Where(
			"scores.categories LIKE ?",
			"%"+*category+"%",
		)
	}

	// Computed Sort
	finalSort := getScoreSort(sort)

	// Execute query with pagination
	err := query.Scopes(
		paginate(pagination, query, finalSort),
	).Find(&scores).Error

	if err != nil {
		return nil, err
	}

	pagination.Rows = scores
	return pagination, nil
}

// Sort translator
func getScoreSort(sort string) string {
	switch sort {
	case "id asc":
		return "scores.id ASC"
	case "id desc":
		return "scores.id DESC"

	case "score_name asc":
		return "scores.score_name ASC"
	case "score_name desc":
		return "scores.score_name DESC"

	case "composer asc":
		return "composers.safe_name ASC"
	case "composer desc":
		return "composers.safe_name DESC"

	case "release_date asc":
		return "scores.release_date ASC"
	case "release_date desc":
		return "scores.release_date DESC"

	case "created_at asc":
		return "scores.created_at ASC"
	case "created_at desc":
		return "scores.created_at DESC"

	case "updated_at asc":
		return "scores.updated_at ASC"
	case "updated_at desc":
		return "scores.updated_at DESC"

	default:
		return "scores.updated_at DESC"
	}
}

// FindScoreByID retrieves a score by its unique identifier.
func FindScoreByID(db *gorm.DB, userId uint32, scoreId uint, isDemo bool) (*Score, error) {
	// Base query
	query := db.Model(&Score{}).
		Preload("Composer").
		Where("scores.uploader_id = ?", userId).
		Where("scores.is_demo = ?", isDemo)

	var score Score
	err := query.First(&score, scoreId).Error
	if err != nil {
		return nil, err
	}
	return &score, err
}

// Return the number of scores for a specific composerID i
func CountScoreByComposerId(db *gorm.DB, composerID uint) (int64, error) {

	var count int64
	err := db.Model(&Score{}).
		Where("composer_id = ?", composerID).
		Count(&count).Error

	return count, err
}

// Replace all Composer ID from Source to Target
func ReassignComposerInScores(db *gorm.DB, sourceID, targetID uint) error {
	if sourceID == targetID {
		return nil
	}
	// Will do for the whole data base score
	result := db.Model(&Score{}).
		Where("composer_id = ?", sourceID).
		Update("composer_id", targetID)

	if result.Error != nil {
		return result.Error
	}

	return nil
}
