package v2

import (
	"backend/infrastructure/config"
	"net/http"

	"github.com/gin-gonic/gin"
)

// RegisterHealthRoutes registers system/health routes
func RegisterHealthRoutes(rg *gin.RouterGroup, serverVersion string) {

	// public routes
	healthGroup := rg.Group("/")
	{

		// Unchanged routes carried over from V1
		healthGroup.GET("", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{"message": "API is running"})
		})

		healthGroup.GET("/health", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{"status": "OK"})
		})

		healthGroup.GET("/version", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{"version": serverVersion})
		})

		// NEW ROUTES specific to v2

		healthGroup.GET("/info", func(c *gin.Context) {
			cfg := config.Config()

			c.JSON(http.StatusOK, gin.H{
				"name":                  "skoreflow",
				"version":               serverVersion,
				"App Environment":       cfg.AppEnv,
				"DevelopmentRuntime":    cfg.DevelopmentRuntime,
				"Security":              cfg.Security,
				"Paths":                 cfg.Paths,
				"frontend":              cfg.Frontend,
				"microservices":         cfg.MicroServices,
				"microservices version": "Just for test version 2.3",
			})
		})
	}
}
