package format

// ======================================================================================
// INFRASTRUCTURE     | utils/         | "Atomic" functions, "blind" to business logic.
//                    |                | (Disk I/O, network calls, file manipulation).
// ======================================================================================

import (
	"encoding/json"
	"strings"
)

// ParseSemicolonList converts a string of items separated by semicolons or commas into a JSON array string.
// - Empty input returns "[]"
// - Leading/trailing spaces are trimmed
// Example: "Classique;Baroque" -> '["Classique","Baroque"]'
// Example: "A,B,C" -> '["A","B","C"]'
func ParseSemicolonList(input string) string {
	if input == "" {
		return "[]"
	}

	// Normalize: replace commas with semicolons for uniform splitting
	normalized := strings.ReplaceAll(input, ",", ";")
	parts := strings.Split(normalized, ";")

	var cleaned []string
	for _, p := range parts {
		t := strings.TrimSpace(p)
		if t != "" {
			cleaned = append(cleaned, t)
		}
	}

	// Convert to JSON string
	b, _ := json.Marshal(cleaned)
	return string(b)
}
