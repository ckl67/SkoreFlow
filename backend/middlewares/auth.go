package middlewares

import (
	"backend/auth"
	"backend/infrastructure/config"
	"backend/infrastructure/logger"
	"net/http"

	"github.com/gin-gonic/gin"
)

// Responsibility:
// - Validate JWT token from the Authorization header
// - Authenticate the request (identify the caller)
// - Extract user_id and role from the token
// - Inject these values into the Gin context for downstream usage
// Notes:
// - Does NOT perform authorization (permissions)
// - Must be applied to all protected routes
func AuthMiddleware() gin.HandlerFunc {
	secret := config.Config().ApiSecret

	return func(c *gin.Context) {
		// 1. Extract token from Authorization header
		tokenString := auth.ExtractToken(c)

		// 2. Ensure token is present
		if tokenString == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error": "Authorization token required",
			})
			return
		}

		// 3. Decode token and extract metadata (user_id, role)
		userID, role, err := auth.ExtractTokenMetadata(tokenString, secret)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error": "Invalid token",
			})
			return
		}

		logger.Login.Debug("(AuthMiddleware) userID=%d role=%d", userID, role)

		// 4. Inject identity into context for downstream handlers
		c.Set("user_id", userID)
		c.Set("user_role", role)

		c.Next()
	}
}

// Responsibility:
// - Enforce admin-level authorization
// Requirements:
// - AuthMiddleware must run BEFORE this middleware
// Behavior:
// - Reads user_role from context
// - Blocks request if the user is not an admin
func AdminOnlyMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// 1. Retrieve role from context (set by AuthMiddleware)
		role := c.GetInt("user_role")

		logger.Login.Debug("(AdminOnlyMiddleware) checking admin privileges: role=%d", role)

		// 2. Enforce admin-only access
		if role != config.RoleAdmin {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{
				"error": "Admin access required",
			})
			return
		}

		c.Next()
	}
}
