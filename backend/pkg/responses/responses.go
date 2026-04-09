package responses

// ======================================================================================
// INFRASTRUCTURE     | utils/         | "Atomic" functions, "blind" to business logic.
//                    |                | (Disk I/O, network calls, file manipulation).
// ======================================================================================
import (
	"errors"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
)

// JSON sends a structured success response with a given HTTP status code.
func JSON(c *gin.Context, statusCode int, data interface{}) {
	c.JSON(statusCode, data)
}

// ERROR sends a standardized error response.
// - If err is nil, returns "Unknown error".
func ERROR(c *gin.Context, statusCode int, err error) {
	if err != nil {
		c.JSON(statusCode, gin.H{
			"status": statusCode,
			"error":  err.Error(),
		})
		return
	}

	c.JSON(statusCode, gin.H{
		"status": statusCode,
		"error":  "Unknown error",
	})
}

// VALIDATION_ERROR converts Gin binding/validator errors into a clean API response.
// Maps common validator tags (required, email, min, max) to human-readable messages.
func VALIDATION_ERROR(c *gin.Context, err error) {
	var ve validator.ValidationErrors

	if errors.As(err, &ve) {
		errorsMap := make(map[string]string)

		for _, fe := range ve {
			field := strings.ToLower(fe.Field())

			switch fe.Tag() {
			case "required":
				errorsMap[field] = "this field is required"
			case "email":
				errorsMap[field] = "invalid email format"
			case "min":
				errorsMap[field] = "too short"
			case "max":
				errorsMap[field] = "too long"
			default:
				errorsMap[field] = "invalid value"
			}
		}

		c.JSON(http.StatusBadRequest, gin.H{
			"errors": errorsMap,
		})
		return
	}

	// Fallback for non-validator errors (e.g., JSON type mismatch)
	c.JSON(http.StatusBadRequest, gin.H{
		"error": err.Error(),
	})
}
