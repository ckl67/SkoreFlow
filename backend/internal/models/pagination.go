package models

// ===============================================================================================
// Layer              | Component      | Business Role
// -------------------|----------------|----------------------------------------------------------
// PERSISTENCE        | models/        | Handles database operations only (SQL via GORM).
// ===============================================================================================

import (
	"backend/infrastructure/logger"
	"math"
	"strings"

	"gorm.io/gorm"
)

// Pagination represents a generic pagination structure used for API responses.
//
// Notes:
// - JSON tags define API serialization.
// - Query tags are used for request binding (e.g., Gin).
//
// Pagination.Rows is stored as interface{} because the same Pagination
// structure is reused for different entities (composers, scores, composers, ...).

type Pagination struct {
	Sort       string      `json:"sort,omitempty" query:"sort"`
	SearchMode string      `json:"searchMode,omitempty" query:"searchMode"`
	Limit      int         `json:"limit,omitempty" query:"limit"`
	Page       int         `json:"page,omitempty" query:"page"`
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
// Security:
// - Only allows predefined fields and directions.
// - Prevents SQL injection via uncontrolled input.
// Default:
// - Falls back to "updated_at desc" if invalid.
func (p *Pagination) GetSort() string {
	columns := map[string]string{
		// Identifiers
		"id": "id",

		// Names
		"score_name": "name",
		"composer":   "name", // or "safe_name" if you’d prefer to sort by safe_name

		// Business dates
		"release_date": "release_date",

		// Technical timestamps
		"created_at": "created_at",
		"updated_at": "updated_at",
	}

	parts := strings.Fields(strings.ToLower(strings.TrimSpace(p.Sort)))
	if len(parts) == 2 {
		col, okCol := columns[parts[0]]
		if okCol && (parts[1] == "asc" || parts[1] == "desc") {
			return col + " " + strings.ToUpper(parts[1])
		}
	}

	return "updated_at DESC"
}

// GetSearchMode validates and returns a safe SQL request.
// Security:
// - Only allows predefined fields and directions.
// - Prevents SQL injection via uncontrolled input.
func (p *Pagination) GetSearchMode() string {
	allowed := map[string]bool{
		"contains":   true,
		"startsWith": true,
		"exact":      true,
	}

	mode := strings.ToLower(strings.TrimSpace(p.SearchMode))

	logger.Main.Info("search Mode proposed : %s", mode)
	if allowed[mode] {
		return mode
	}

	return "contains"
}

// paginate applies pagination, sorting, and total count calculation to a GORM query.
// Usage : err := query.Scopes(paginate(pagination, query, sort, "composers")).Find(&composers).Error
// Behavior:
// - Computes total number of rows (without limit/offset).
// - Updates Pagination fields (TotalRows, TotalPages).
// - Returns a scoped query with offset, limit, and order applied.
func paginate(pagination *Pagination, db *gorm.DB, sort string, tableName ...string) func(db *gorm.DB) *gorm.DB {
	var totalRows int64

	// Clone session to avoid side effects
	query := db.Session(&gorm.Session{})

	// In case of JOIN, we do not know which table to use !!
	// Solution : db.Session(&gorm.Session{}).Select("COUNT(DISTINCT composers.id)").Count(&totalRows)
	if len(tableName) > 0 && tableName[0] != "" {
		query.Select("COUNT(DISTINCT " + tableName[0] + ".id)").Count(&totalRows)
	} else {
		query.Count(&totalRows)
	}
	pagination.TotalRows = totalRows

	limit := pagination.GetLimit()
	totalPages := int(math.Ceil(float64(totalRows) / float64(limit)))
	pagination.TotalPages = totalPages

	// To avoid ambiguity we indicate the sort in the function !
	return func(db *gorm.DB) *gorm.DB {
		return db.
			Offset(pagination.GetOffset()).
			Limit(limit).
			Order(sort)
	}
}
