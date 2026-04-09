package models

// ===============================================================================================
// Layer              | Component      | Business Role
// -------------------|----------------|----------------------------------------------------------
// PERSISTENCE        | models/        | Handles database operations only (SQL via GORM).
// ===============================================================================================

import (
	"math"
	"strings"

	"gorm.io/gorm"
)

// Pagination represents a generic pagination structure used for API responses.
//
// Notes:
// - JSON tags define API serialization.
// - Query tags are used for request binding (e.g., Gin).

type Pagination struct {
	Limit      int         `json:"limit,omitempty" query:"limit"`
	Page       int         `json:"page,omitempty" query:"page"`
	Sort       string      `json:"sort,omitempty" query:"sort"`
	TotalRows  int64       `json:"total_rows"`
	TotalPages int         `json:"total_pages"`
	Rows       interface{} `json:"rows"`
}


// GetOffset calculates the SQL offset based on the current page and limit.
func (p *Pagination) GetOffset() int {
	return (p.GetPage() - 1) * p.GetLimit()
}


// GetLimit returns the pagination limit.
// Defaults to 10 if not specified.
func (p *Pagination) GetLimit() int {
	if p.Limit == 0 {
		p.Limit = 10
	}
	return p.Limit
}


// GetPage returns the current page.
// Defaults to 1 if not specified.
func (p *Pagination) GetPage() int {
	if p.Page == 0 {
		p.Page = 1
	}
	return p.Page
}


// GetSort validates and returns a safe SQL ORDER BY clause.
//
// Security:
// - Only allows predefined fields and directions.
// - Prevents SQL injection via uncontrolled input.
//
// Default:
// - Falls back to "updated_at desc" if invalid.
func (p *Pagination) GetSort() string {
	allowed := map[string]bool{
		// Identifiers
		"id asc":  true,
		"id desc": true,

		// Names
		"sheet_name asc":  true,
		"sheet_name desc": true,
		"composer asc":    true,
		"composer desc":   true,

		// Business dates
		"release_date asc":  true,
		"release_date desc": true,

		// Technical timestamps
		"created_at asc":  true,
		"created_at desc": true,
		"updated_at asc":  true,
		"updated_at desc": true,
	}

	// Normalize input (trim + lowercase)
	sort := strings.ToLower(strings.TrimSpace(p.Sort))

	if allowed[sort] {
		return sort
	}

	return "updated_at desc"
}


// paginate applies pagination, sorting, and total count calculation to a GORM query.
//
// Behavior:
// - Computes total number of rows (without limit/offset).
// - Updates Pagination fields (TotalRows, TotalPages).
// - Returns a scoped query with offset, limit, and order applied.
func paginate(pagination *Pagination, db *gorm.DB) func(db *gorm.DB) *gorm.DB {
	var totalRows int64

	// Clone session to avoid side effects
	db.Session(&gorm.Session{}).Count(&totalRows)

	pagination.TotalRows = totalRows

	limit := pagination.GetLimit()
	totalPages := int(math.Ceil(float64(totalRows) / float64(limit)))
	pagination.TotalPages = totalPages

	return func(db *gorm.DB) *gorm.DB {
		return db.
			Offset(pagination.GetOffset()).
			Limit(limit).
			Order(pagination.GetSort())
	}
}
