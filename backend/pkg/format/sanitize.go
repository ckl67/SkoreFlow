package format

// ======================================================================================
// INFRASTRUCTURE     | utils/         | "Atomic" functions, "blind" to business logic.
//                    |                | (Disk I/O, network calls, file manipulation).
// ======================================================================================

import (
	"regexp"
	"strings"

	"github.com/mozillazg/go-unidecode"
)

// SanitizeUserEmail trims spaces and converts email to lowercase.
// Example: "  John.Doe@EXAMPLE.COM  " -> "john.doe@example.com"
func SanitizeUserEmail(email string) string {
	return strings.ToLower(strings.TrimSpace(email))
}

// SafeFileName normalizes a filename for safe storage in filesystem or URLs.
// It converts the name to ASCII and applies general sanitization.
func SafeFileName(name string) string {
	return SanitizeName(ToASCII(name))
}

// ToASCII transliterates a string to ASCII, removing accents and special characters.
// Example: "Élève" -> "Eleve"
func ToASCII(input string) string {
	ascii := unidecode.Unidecode(input)
	return strings.TrimSpace(ascii)
}

// SanitizeName converts a string into a "safe" format suitable for filenames, URLs, etc.
// Example: "École #1.pdf" -> "ecole-1.pdf"
func SanitizeName(name string) string {
	// 1 Transliterate Unicode → ASCII
	s := unidecode.Unidecode(name)

	// 2 Lowercase
	s = strings.ToLower(s)

	// 3 Trim spaces
	s = strings.TrimSpace(s)

	// 4 Replace spaces and underscores with hyphen
	s = strings.ReplaceAll(s, " ", "-")
	s = strings.ReplaceAll(s, "_", "-")

	// 5 Keep only [a-z0-9-.]
	re := regexp.MustCompile(`[^a-z0-9\-.]+`)
	s = re.ReplaceAllString(s, "")

	// 6 Collapse consecutive hyphens
	re2 := regexp.MustCompile(`-+`)
	s = re2.ReplaceAllString(s, "-")

	// 7 Limit length
	if len(s) > 255 {
		s = s[:255]
	}

	return s
}
