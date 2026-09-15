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
		// CRUD - Create operation
		scoreGroup.POST("/scores", scoreCtrl.CreateScore) // vitest

		// Search & listing
		scoreGroup.GET("/scores", scoreCtrl.GetScoresPage) // vitest
		scoreGroup.GET("/scores/:id", scoreCtrl.GetScore)  // vitest

		// Other CRUD operations
		scoreGroup.PUT("/scores/:id", scoreCtrl.UpdateScore) // vitest
		scoreGroup.DELETE("/scores/:id", scoreCtrl.DeleteScore)

		// Partial update (annotations only)
		scoreGroup.PATCH("/scores/:id/annotations", scoreCtrl.UpdateAnnotations) // vitest

		scoreGroup.GET("/scores/:id/file", scoreCtrl.GetScoreFile)
		scoreGroup.HEAD("/scores/:id/file", scoreCtrl.GetScoreFile)
		scoreGroup.GET("/scores/:id/thumbnail", scoreCtrl.GetScoreThumbnail)
		scoreGroup.HEAD("/scores/:id/thumbnail", scoreCtrl.GetScoreThumbnail)

	}
}
