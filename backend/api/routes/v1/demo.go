// cspell:ignore gonic
package v1

import (
	"backend/internal/controllers"

	"github.com/gin-gonic/gin"
)

func RegisterDemoRoutes(rg *gin.RouterGroup, composerCtrl *controllers.ComposerController, scoreCtrl *controllers.ScoreController) {

	// demo routes
	demoGroup := rg.Group("/demo")
	{
		demoGroup.GET("/composers", composerCtrl.GetDemoComposersPage) // vitest
		demoGroup.GET("/composers/:id", composerCtrl.GetDemoComposer)  // vitest

		demoGroup.GET("/composers/:id/picture", composerCtrl.GetDemoComposerPicture)
		demoGroup.HEAD("/composers/:id/picture", composerCtrl.GetDemoComposerPicture)
		demoGroup.GET("/composers/:id/thumbnail", composerCtrl.GetDemoComposerThumbnail)
		demoGroup.HEAD("/composers/:id/thumbnail", composerCtrl.GetDemoComposerThumbnail)
	}
}
