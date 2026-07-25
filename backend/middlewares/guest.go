package middlewares

import (
	"backend/auth"
	"backend/infrastructure/config"

	"github.com/gin-gonic/gin"
)

func OptionalAuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {

		tokenString := auth.ExtractToken(c)

		// No token = guest mode
		if tokenString == "" {
			c.Set("guest", true)
			c.Next()
			return
		}

		userID, role, err := auth.ExtractTokenMetadata(
			tokenString,
			config.Config().ApiSecret,
		)

		// Invalid token -> treat as guest or reject
		if err != nil {
			c.Set("guest", true)
			c.Next()
			return
		}

		c.Set("guest", false)
		c.Set("user_id", userID)
		c.Set("user_role", role)

		c.Next()
	}
}
