// cspell:ignore gonic
package v1

import (
	"backend/internal/controllers"
	"backend/middlewares"

	"github.com/gin-gonic/gin"
)

func RegisterUserRoutes(rg *gin.RouterGroup, userCtrl *controllers.UserController) {

	// User self-management
	userGroup := rg.Group("/")
	// protected routes
	userGroup.Use(middlewares.AuthMiddleware())
	{
		// Return Json
		userGroup.GET("/me", userCtrl.GetProfile)             // vitest
		userGroup.PUT("/me/profile", userCtrl.UpdateProfile)  // vitest
		userGroup.PUT("/me/mail", userCtrl.UpdateMail)        // vitest
		userGroup.POST("/me/avatar", userCtrl.UploadAvatar)   // vitest
		userGroup.DELETE("/me/avatar", userCtrl.DeleteAvatar) // vitest

		// Return Data
		userGroup.GET("/me/avatar", userCtrl.GetAvatar)  //
		userGroup.HEAD("/me/avatar", userCtrl.GetAvatar) //

		// -----------------------------------------------------
	}
}
