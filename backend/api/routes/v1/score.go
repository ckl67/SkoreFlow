package v1

import (
	"backend/internal/controllers"
	"backend/middlewares"

	"github.com/gin-gonic/gin"
)

func RegisterScoreRoutes(rg *gin.RouterGroup, scoreCtrl *controllers.ScoreController) {

	scoreGroup := rg.Group("/")
	// protected routes
	scoreGroup.Use(middlewares.AuthMiddleware())
	{
		// Upload
		scoreGroup.POST("/scores", scoreCtrl.CreateScore)

		// Search & listing
		scoreGroup.GET("/scores", scoreCtrl.GetScoresPage)

		// CRUD operations
		scoreGroup.GET("/scores/:id", scoreCtrl.GetScore)
		scoreGroup.PUT("/scores/:id", scoreCtrl.UpdateScore)
		scoreGroup.DELETE("/scores/:id", scoreCtrl.DeleteScore)

		// Partial update (annotations only)
		scoreGroup.PATCH("/scores/:id/annotations", scoreCtrl.UpdateAnnotations)
	}
}
