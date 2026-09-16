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

		demoGroup.GET("/scores", scoreCtrl.GetDemoScoresPage) // vitest
		demoGroup.GET("/scores/:id", scoreCtrl.GetDemoScore)  // vitest

		demoGroup.GET("/scores/:id/file", scoreCtrl.GetDemoScoreFile)
		demoGroup.HEAD("/scores/:id/file", scoreCtrl.GetDemoScoreFile)
		demoGroup.GET("/scores/:id/thumbnail", scoreCtrl.GetDemoScoreThumbnail)
		demoGroup.HEAD("/scores/:id/thumbnail", scoreCtrl.GetDemoScoreThumbnail)

	}
}
