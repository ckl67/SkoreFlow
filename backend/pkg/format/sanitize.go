package format

// ======================================================================================
// INFRASTRUCTURE     | utils/         | "Atomic" functions, "blind" to business logic.
//                    |                | (Disk I/O, network calls, file manipulation).
// ======================================================================================
// cspell:ignore École Élève

import (
	"path/filepath"
	"regexp"
	"strings"

	"github.com/mozillazg/go-unidecode"
)

// The regexes are compiled ONLY ONCE when the package starts up
var (
	reUnsafeChars = regexp.MustCompile(`[^a-z0-9\-.]+`)
	reMultiHyphen = regexp.MustCompile(`-+`)
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
// SanitizeName converts a string into a "safe" format suitable for filenames, URLs, etc.
func SanitizeName(name string) string {
	// 1 & 2 & 3: Transliterate, lowercase and trim spaces directly
	// Transliterate Unicode → ASCII
	s := unidecode.Unidecode(name)
	// Lowercase
	s = strings.ToLower(s)
	//  Trim spaces
	s = strings.TrimSpace(s)

	// 4. Replace spaces and underscores with hyphen
	s = strings.ReplaceAll(s, " ", "-")
	s = strings.ReplaceAll(s, "_", "-")

	// 5. Keep only [a-z0-9-.] (uses the pre-compiled global regex)
	s = reUnsafeChars.ReplaceAllString(s, "")

	// 6. Collapse consecutive hyphens
	s = reMultiHyphen.ReplaceAllString(s, "-")

	// 7. Optional: Remove any extra dashes at the beginning or end
	s = strings.Trim(s, "-")

	// 8. Set the length limit sensibly (max. 255 bytes for file systems such as ext4 and NTFS)
	if len(s) > 255 {
		s = truncateSafe(s, 255)
	}

	return s
}

// truncateSafe truncates the string whilst preserving the extension where possible
func truncateSafe(s string, maxLen int) string {
	ext := filepath.Ext(s)
	if len(ext) >= maxLen {
		return s[:maxLen] // An extreme case where the extension is longer than the limit
	}

	// We remove the ‘name’ part and reattach the extension
	allowedNameLen := maxLen - len(ext)
	namePart := s[:allowedNameLen]

	return strings.TrimSuffix(namePart, "-") + ext
}
