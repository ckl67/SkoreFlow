package api

import (
	"backend/infrastructure/config"
	"backend/infrastructure/database"
	"backend/infrastructure/logger"
	"backend/internal/domain"
)

// Type for seeding
type composers struct {
	Name  string
	Genre string
	Wiki  string
	Img   string
}

// Start orchestrates the application setup and launches the server.
// It handles configuration loading, database connection, and service bootstrapping.
func Start(version string) {
	cfg := config.Config()
	cfg.LogSafe()

	// 1. Infrastructure Setup -- Database Connection
	db := database.ConnectDB(cfg)

	// 2. Application Core Setup - Server instance (local scope, not global)
	appServer := Server{}
	appServer.Setup(version, db)

	// 3. Database Seeding

	// 3.1. admin
	appServer.seederService.User("admin", cfg.Admin.Email, cfg.Admin.Password, domain.RoleAdmin, "users/admin.png")

	// 3.2. Demo composers
	// Files stored in demo/composers/
	demoComposers := []composers{
		{"Wolfgang Amadeus Mozart Demo", "Classical period", "https://fr.wikipedia.org/wiki/Wolfgang_Amadeus_Mozart", "Mozart.png"},
		{"Ludwig van Beethoven Demo", "Classical period", "https://fr.wikipedia.org/wiki/Ludwig_van_Beethoven", "Beethoven.png"},
	}
	for _, c := range demoComposers {
		imgPath := ""
		if c.Img != "" {
			imgPath = "demo/composers/" + c.Img
		}
		if err := appServer.seederService.Composer(c.Name, c.Genre, c.Wiki, imgPath, true); err != nil {
			logger.Main.Fatal("Seed failed: %v", err)
		}
	}

	// 3.3 Demo Score
	// Files stored in demo/scores/

	// 4 Test Seeding
	if config.Config().DevelopmentRuntime.SeedData {
		// Users
		appServer.seederService.User("user1", "user1@test.com", "password123", domain.RoleUser, "users/default.png")
		appServer.seederService.User("user2", "user2@test.com", "password123", domain.RoleUser, "users/default.png")
		appServer.seederService.User("user3", "user3@test.com", "password123", domain.RoleUser, "users/default.png")
		appServer.seederService.User("moderator1", "moderator1@test.com", "password123", domain.RoleModerator, "users/moderator.png")
		appServer.seederService.User("moderator2", "moderator2@test.com", "password123", domain.RoleModerator, "users/moderator.png")

		// Composers
		// Files stored in ../testauto/backend/resources/composers/
		// Array (slice of structs) containing all your compositors
		// cspell:disable
		testComposers := []composers{
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

		// Loop that runs the seeder for each element
		for _, c := range testComposers {
			imgPath := ""
			if c.Img != "" {
				imgPath = "../testauto/backend/resources/composers/" + c.Img
			}
			if err := appServer.seederService.Composer(c.Name, c.Genre, c.Wiki, imgPath, false); err != nil {
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
