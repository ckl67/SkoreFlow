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

/*
Example using Axios
const response = await axios.post('/auth/register', userData);

	1. response.status -> 200 (HTTP Level)
	2. response.data -> { success: true, data: {...} } (The JSON Envelope)
	3. response.data.data -> The actual user object (The Payload)

try {
	 const response = await axios.post('/auth/register', userData);
	//} catch (error) {
	1. error.response.status -> 400 (HTTP Level)
	2. error.response.data   -> { success: false, error: { message: "..." } }
	3. error.response.data.error.message -> "username is required"

	 console.error("Error API:", error.response.data.error.message);
}
*/

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
