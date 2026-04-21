package domain

// ===============================================================================================
// INFRASTRUCTURE     | utils/         | "Atomic" functions, "blind" to business logic.
//                    |                | (Disk I/O, network calls, file manipulation).
// ===============================================================================================

import (
	"encoding/json"
	"strings"
)

// CleanTagsCategories sanitizes a semicolon-separated string of tags or categories.
// - Trims whitespace
// - Removes empty values
// - Removes duplicates (case-insensitive)
// - Returns a JSON string suitable for database storage
func CleanTagsCategories(input string) string {
	rawTags := strings.Split(input, ";")
	uniqueMap := make(map[string]bool)
	var cleanTags []string

	for _, t := range rawTags {
		trimmed := strings.TrimSpace(t)
		lower := strings.ToLower(trimmed)

		// Skip empty or duplicate entries
		if trimmed != "" && !uniqueMap[lower] {
			uniqueMap[lower] = true
			cleanTags = append(cleanTags, trimmed)
		}
	}

	// Convert to JSON string for DB storage
	data, _ := json.Marshal(cleanTags)
	return string(data)
}
