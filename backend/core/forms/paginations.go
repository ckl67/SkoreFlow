package forms

// ===============================================================================================
// Layer              | Component      | Responsibility
// -------------------|----------------|----------------------------------------------------------
// VALIDATION         | forms/         |
//                    |                | 1. Define request schemas (DTO)
//                    |                | 2. Handle binding (JSON, form-data, query)
// ===============================================================================================
//
// VALIDATION STRATEGY:
//
// A. STRUCTURAL VALIDATION → handled by Gin binding
//    - Defined via `binding:"..."` tags
//    - Automatically executed using:
//        c.ShouldBindJSON(...) or c.ShouldBind(...)
//
// B. CUSTOM / COMPLEX VALIDATION → handled via ValidateForm()
//    - File constraints
//    - Cross-field logic
//
// C. BUSINESS VALIDATION → MUST NOT be handled here
//    - Must be implemented in the service layer
//
// RULE:
// → Never duplicate binding validation inside ValidateForm()

// PaginatedRequest defines common query parameters for paginated endpoints.
//
// Fields:
// - SortBy: sorting field and direction (e.g., "created_at desc")
// - Limit: number of items per page
// - Page: current page number
type PaginatedRequest struct {
	SortBy string `form:"sort" json:"sort" binding:"omitempty"`
	Limit  int    `form:"limit" json:"limit"`
	Page   int    `form:"page" json:"page"`
}
