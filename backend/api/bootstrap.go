package api

import (
	"backend/infrastructure/config"
	"backend/infrastructure/database"
	"backend/infrastructure/logger"
	"backend/shared"
)

// Start orchestrates the application setup and launches the server.
// It handles configuration loading, database connection, and service bootstrapping.
func Start(version string) {
	// Log configuration details (redacted/safe version)
	cfg := config.Config()
	cfg.LogSafe()

	// 1. Infrastructure Setup -- Database Connection
	db := database.ConnectDB(cfg)

	// 2. Application Core Setup - Server instance (local scope, not global)
	appServer := Server{}
	appServer.Setup(version, db)

	// 3. Database Seeding
	// For users
	// 	file is not saved in the DataRoot Directory !
	// 	We will use ResolveAssetRoot returns the get the absolute path in the Assets, for displaying the file
	appServer.SeederService.User("admin", cfg.AdminEmail, cfg.AdminPassword, shared.RoleAdmin, "users/admin.png")

	if config.Config().TestMode {
		// Users
		appServer.SeederService.User("user1", "user1@test.com", "password123", shared.RoleUser, "users/default.png")
		appServer.SeederService.User("user2", "user2@test.com", "password123", shared.RoleUser, "users/default.png")
		appServer.SeederService.User("user3", "user3@test.com", "password123", shared.RoleUser, "users/default.png")
		appServer.SeederService.User("moderator1", "moderator1@test.com", "password123", shared.RoleModerator, "users/moderator.png")
		appServer.SeederService.User("moderator2", "moderator2@test.com", "password123", shared.RoleModerator, "users/moderator.png")

		// 1. Define the array (slice of structs) containing all your compositors
		composers := []struct {
			Name  string
			Genre string
			Wiki  string
			Img   string
		}{
			// cspell:disable
			{"Wolfgang Amadeus Mozart", "Classical period", "https://fr.wikipedia.org/wiki/Wolfgang_Amadeus_Mozart", "Mozart.png"},
			{"Ludwig van Beethoven", "Classical period", "https://fr.wikipedia.org/wiki/Ludwig_van_Beethoven", "Beethoven.png"},
			{"Supertramp", "Rock gradual, Pop, Art Rock, Blues-rock", "https://fr.wikipedia.org/wiki/Supertramp", "Supertramp.png"},
			{"NightWish", "Hard Rock, Art Rock", "https://fr.wikipedia.org/wiki/Nightwish", ""},
			{"Frédéric Chopin", "romantic", "https://fr.wikipedia.org/wiki/Fr%C3%A9d%C3%A9ric_Chopin", "Frédéric Chopin.png"},
			{"Pink Floyd", "rock progressive", "https://fr.wikipedia.org/wiki/Pink_Floyd", "Pink Floyd.jpeg"},
			{"Helloween", "hard Rock", "https://fr.wikipedia.org/wiki/Helloween", "Helloween.png"},
			{"Heino", "musique traditionnelle allemande", "https://fr.wikipedia.org/wiki/Heino_(chanteur)", "Heino.png"},
			{"Ernst Mosch", "musique traditionnelle allemande", "", ""},
			{"Barclay James Harvest", "rock", "https://fr.wikipedia.org/wiki/Barclay_James_Harvest", "BarclayJamesHarvest.png"},
			{"Iron Maiden", "hard rock", "https://fr.wikipedia.org/wiki/Iron_Maiden", "Iron Maiden.png"},
			{"Kamelot", "hard rock", "https://fr.wikipedia.org/wiki/Kamelot", "Kamelot.png"},
			{"AC/DC", "hard rock", "https://fr.wikipedia.org/wiki/AC/DC", "ACDC.png"},
			// cspell:enable
		}
		basePath := "../testauto/backend/resources/composers/"

		// 2. A single loop that runs the seeder for each element
		for _, c := range composers {
			imgPath := ""
			if c.Img != "" {
				imgPath = basePath + c.Img
			}

			if err := appServer.SeederService.Composer(c.Name, c.Genre, c.Wiki, imgPath); err != nil {
				logger.Main.Fatal("Seed failed: %v", err)
			}
		}

	}

	// 4. Port Configuration
	// Go Listening [Nginx / Reverse Proxy]
	addr := cfg.BackendListenAddress
	if addr == "" {
		addr = "0.0.0.0:8080"
	}

	// 5. Execution
	// We call ListenAndServe .
	appServer.ListenAndServe(addr)
}
