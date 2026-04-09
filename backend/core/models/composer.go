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

// Composer represents a music composer stored in the database.
//
// Notes:
// - GORM tags (gorm:"...") define database schema and constraints.
// - JSON tags (json:"...") define API serialization.
//
// File Storage:
// - PicturePath stores the full file path to the composer's image.
//
// Timestamps:
// - CreatedAt is set on insert.
// - UpdatedAt is set on insert and updated on each modification.

type Composer struct {
	ID          uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	SafeName    string    `gorm:"size:255;uniqueIndex" json:"safe_name"`
	Name        string    `gorm:"size:255;not null" json:"name"`
	PicturePath string    `gorm:"column:thumbnail_path;not null" json:"picture_path"`
	ExternalURL string    `gorm:"size:255" json:"external_url"`
	Epoch       string    `gorm:"size:255" json:"epoch"`
	IsVerified  bool      `gorm:"default:false" json:"is_verified"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// Create inserts a new composer record into the database.
// GORM automatically sets CreatedAt and UpdatedAt.
func (c *Composer) Create(db *gorm.DB) error {
	return db.Create(c).Error
}

// Update performs a full update using db.Save().
//
// WARNING:
// - All fields are overwritten, including zero values.
// - The struct must be fully loaded beforehand.
func (c *Composer) Update(db *gorm.DB) error {
	return db.Save(c).Error
}

// Delete permanently removes the composer from the database.
// Uses Unscoped() to bypass soft delete if enabled.
// Returns the number of affected rows.
func (c *Composer) Delete(db *gorm.DB) (int64, error) {
	result := db.Unscoped().Delete(c)
	return result.RowsAffected, result.Error
}

// List retrieves composers with pagination and optional search filtering.
//
// Filters:
// - search: matches name or safe name
func (c *Composer) List(db *gorm.DB, pagination *Pagination, search string, userID uint32) (*Pagination, error) {
	var composers []*Composer

	// Base query
	query := db.Model(&Composer{})

	// Search filter
	if search != "" {
		searchTerm := "%" + search + "%"
		query = query.Where("(name LIKE ? OR safe_name LIKE ?)", searchTerm, searchTerm)
	}

	// Execute query with pagination
	err := query.Scopes(paginate(pagination, query)).Find(&composers).Error
	if err != nil {
		return nil, err
	}

	pagination.Rows = composers
	return pagination, nil
}

// FindComposerByID retrieves a composer by its unique identifier.
func FindComposerByID(db *gorm.DB, id uint) (*Composer, error) {
	var composer Composer
	err := db.First(&composer, id).Error
	return &composer, err
}
