package v1

import (
	"backend/internal/controllers"
	"backend/middlewares"

	"github.com/gin-gonic/gin"
)

func RegisterComposerRoutes(rg *gin.RouterGroup, composerCtrl *controllers.ComposerController) {

	composerGroup := rg.Group("/")

	// protected routes
	composerGroup.Use(middlewares.AuthMiddleware())
	{
		composerGroup.POST("/composers", composerCtrl.CreateComposer)    // vitest
		composerGroup.PUT("/composers/:id", composerCtrl.UpdateComposer) // vitest
		composerGroup.DELETE("/composers/:id", composerCtrl.DeleteComposer)
		composerGroup.PUT("/composers/merge", composerCtrl.MergeComposers)

		composerGroup.GET("/composers", composerCtrl.GetComposersPage) // vitest
		composerGroup.GET("/composers/:id", composerCtrl.GetComposer)  // vitest

		composerGroup.GET("/composers/:id/picture", composerCtrl.GetComposerPicture)
		composerGroup.HEAD("/composers/:id/picture", composerCtrl.GetComposerPicture)
		composerGroup.GET("/composers/:id/thumbnail", composerCtrl.GetComposerThumbnail)
		composerGroup.HEAD("/composers/:id/thumbnail", composerCtrl.GetComposerThumbnail)
	}
}
