package v1

import (
	"backend/infrastructure/config"
	"net/http"

	"github.com/gin-gonic/gin"
)

// RegisterHealthRoutes registers system/health routes
func RegisterHealthRoutes(rg *gin.RouterGroup, serverVersion string) {

	// public routes
	// Explicitly declare the root without a slash to intercept /api/v1
	// Without this the /api/v1 route will return a 301 redirect to /api/v1/ which is not ideal for API clients.
	//healthGroup := rg.Group("/")
	{
		rg.GET("", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{"message": "API is running"})
		})

		rg.GET("/health", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{"status": "OK"})
		})

		rg.GET("/version", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{"version": serverVersion})
		})

		rg.GET("/info", func(c *gin.Context) {
			cfg := config.Config()

			c.JSON(http.StatusOK, gin.H{
				"name":               "skoreflow",
				"version":            serverVersion,
				"App Environment":    cfg.AppEnv,
				"DevelopmentRuntime": cfg.DevelopmentRuntime,
				"Security":           cfg.Security,
				"Paths":              cfg.Paths,
				"frontend":           cfg.Frontend,
				"microservices":      cfg.MicroServices,
			})
		})
	}
}
