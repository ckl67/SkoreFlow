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

type APIResponse struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data,omitempty"`
	Error   *APIError   `json:"error,omitempty"`
}

type APIError struct {
	//Code    string `json:"code"`
	Message string `json:"message"`
}

func SUCCESS(c *gin.Context, status int, data interface{}) {
	c.JSON(status, APIResponse{
		Success: true,
		Data:    data,
	})
}

func FAIL(c *gin.Context, status int, err error) {
	msg := "Unknown error"

	if err != nil {
		msg = err.Error()
	}

	c.JSON(status, APIResponse{
		Success: false,
		Error: &APIError{
			Message: msg,
		},
	})
}

/**

Objective

type APIResponse struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data,omitempty"`
	Error   *APIError   `json:"error,omitempty"`
}

type APIError struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

func Fail(c *gin.Context, status int, code string, msg string) {
	c.JSON(status, APIResponse{
		Success: false,
		Error: &APIError{
			Code:    code,
			Message: msg,
		},
	})
}

Fail(c, 400, "AUTH_INVALID_TOKEN", "Invalid or expired token")

**/

// JSON sends a structured success response with a given HTTP status code.
//func JSON(c *gin.Context, statusCode int, data interface{}) {
//	c.JSON(statusCode, data)
//}

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
