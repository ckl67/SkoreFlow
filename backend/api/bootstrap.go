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

type scores struct {
	ComposerName      string
	ScoreName         string
	ReleaseDate       string
	Tags              string
	Categories        string
	InformationText   string
	Annotations       string
	PartitionFileName string
	UserID            []int32
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
	// ====>> Files stored in demo/composers/
	// cspell:disable
	demoComposers := []composers{
		{"Wolfgang Amadeus Mozart Demo", "Classical period", "https://fr.wikipedia.org/wiki/Wolfgang_Amadeus_Mozart", "Mozart.png"},
		{"Ludwig van Beethoven Demo", "Classical period", "https://fr.wikipedia.org/wiki/Ludwig_van_Beethoven", "Beethoven.png"},
	}
	// cspell:enable
	for _, c := range demoComposers {
		imgPath := ""
		if c.Img != "" {
			imgPath = "demo/composers/" + c.Img
		}
		if err := appServer.seederService.SeederComposer(c.Name, c.Genre, c.Wiki, imgPath, true); err != nil {
			logger.Composer.Fatal("Seed failed: %v", err)
		}
	}

	// Scores
	// ====>> Files stored in demo/scores/
	// cspell:disable
	demoScores := []scores{
		{"Wolfgang Amadeus Mozart Demo", "La Marche Turque Demo", "1965", "This is a Tag Demo", "This is a Category Demo", "This is an Information Demo", "This is a Annotation Demo", "Amadeus Mozart/La Marche Turque.pdf", []int32{1}},
		{"Wolfgang Amadeus Mozart Demo", "Valse Favorite Demo", "1870", "This is a Tag Demo", "This is a Category Demo", "This is an Information Demo", "This is a Annotation Demo", "Amadeus Mozart/Valse favorite.pdf", []int32{1}},
	}
	// cspell:enable

	// Loop that runs the seeder for each element
	for _, c := range demoScores {
		partitionPath := ""
		if c.PartitionFileName != "" {
			partitionPath = "demo/scores/" + c.PartitionFileName
		}

		logger.Score.Info("Score seeder for %s", c.ScoreName)
		for _, user_id := range c.UserID {
			logger.Score.Info("   - Loop User : UserID: %d", user_id)
			if err := appServer.seederService.SeederScore(c.ComposerName, c.ScoreName, c.ReleaseDate, c.Tags, c.Categories, c.InformationText, c.Annotations, partitionPath, true, user_id); err != nil {
				logger.Score.Fatal("Seed failed: %v", err)
			}
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
			{"Paul de Senneville", "romantic", "https://fr.wikipedia.org/wiki/Paul_de_Senneville", ""},
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
			if err := appServer.seederService.SeederComposer(c.Name, c.Genre, c.Wiki, imgPath, false); err != nil {
				logger.Composer.Fatal("Seed failed: %v", err)
			}
		}

		// Scores
		// Files stored in ../testauto/backend/resources/scores/
		// cspell:disable
		// UserID : 1=admin, 2=user1; 3=user2
		// cspell:disable
		testScores := []scores{
			// -------------------------------------------------------------------------
			// Wolfgang Amadeus Mozart
			// -------------------------------------------------------------------------
			{
				"Wolfgang Amadeus Mozart",
				"La Marche Turque",
				"1783",
				"Mozart;Piano;Classical",
				"Classical;Piano",
				"Rondo alla turca, third movement of Piano Sonata No. 11 in A major, K. 331.",
				"Solo piano",
				"Amadeus Mozart/La Marche Turque.pdf",
				[]int32{1, 2, 5},
			},
			{
				"Wolfgang Amadeus Mozart",
				"Valse favorite",
				"1780",
				"Mozart;Waltz;Piano",
				"Classical;Piano",
				"A piano piece attributed to Wolfgang Amadeus Mozart.",
				"Solo piano",
				"Amadeus Mozart/Valse favorite.pdf",
				[]int32{3, 2},
			},

			// -------------------------------------------------------------------------
			// Frédéric Chopin
			// -------------------------------------------------------------------------
			{
				"Frédéric Chopin",
				"Nocturne Opus 9 N°2",
				"1832",
				"Chopin;Nocturne;Piano;Romantic",
				"Romantic;Piano",
				"Nocturne in E-flat major, Op. 9 No. 2.",
				"Solo piano",
				"Frédéric Chopin/Nocturne Opus 9 N°2.pdf",
				[]int32{4, 5, 2},
			},

			// -------------------------------------------------------------------------
			// Ludwig van Beethoven
			// -------------------------------------------------------------------------
			{
				"Ludwig van Beethoven",
				"Adagio Pathétique",
				"1798",
				"Beethoven;Piano;Classical",
				"Classical;Piano",
				"Adagio cantabile from Piano Sonata No. 8 in C minor, Op. 13, Pathétique.",
				"Solo piano",
				"Ludwig Van Beethoven/Adagio Pathétique.pdf",
				[]int32{3, 4},
			},
			{
				"Ludwig van Beethoven",
				"La Lettre à Elise",
				"1810",
				"Beethoven;Piano;Romantic",
				"Classical;Piano",
				"Bagatelle in A minor, WoO 59, commonly known as Für Elise.",
				"Solo piano",
				"Ludwig Van Beethoven/La Lettre à Elise.pdf",
				[]int32{4, 5},
			},
			{
				"Ludwig van Beethoven",
				"Sonate No. 14 - Clair de lune",
				"1801",
				"Beethoven;Piano;Sonata;Classical",
				"Classical;Piano;Sonata",
				"Piano Sonata No. 14 in C-sharp minor, Op. 27 No. 2, commonly known as the Moonlight Sonata.",
				"Solo piano",
				"Ludwig Van Beethoven/Sonate No. 14 - Clair de lune.pdf",
				[]int32{1, 2, 3},
			},

			// -------------------------------------------------------------------------
			// Paul de Senneville
			// -------------------------------------------------------------------------
			{
				"Paul de Senneville",
				"Balade Pour Adeline",
				"1976",
				"Paul de Senneville;Piano;Ballad",
				"Contemporary;Piano",
				"Ballade pour Adeline, a piano composition written by Paul de Senneville.",
				"Solo piano",
				"Paul de Senneville/Balade Pour Adeline.pdf",
				[]int32{4, 5, 6},
			},

			// -------------------------------------------------------------------------
			// Supertramp
			// -------------------------------------------------------------------------
			{
				"Supertramp",
				"Logical Song",
				"1979",
				"Supertramp;Rock;Progressive Rock",
				"Rock;Progressive Rock",
				"The Logical Song from the album Breakfast in America.",
				"Piano;Band",
				"Supertramp/Logical Song.pdf",
				[]int32{1, 4},
			},
			{
				"Supertramp",
				"Logical Song New",
				"1979",
				"Supertramp;Rock;Progressive Rock",
				"Rock;Progressive Rock",
				"Alternative arrangement of The Logical Song from the album Breakfast in America.",
				"Piano;Band",
				"Supertramp/Logical Song New.pdf",
				[]int32{4, 5},
			},
			{
				"Supertramp",
				"School",
				"1975",
				"Supertramp;Rock;Progressive Rock",
				"Rock;Progressive Rock",
				"School from the album Crime of the Century.",
				"Piano;Band",
				"Supertramp/School.pdf",
				[]int32{2, 4, 5, 6},
			},

			// -------------------------------------------------------------------------
			// Supertramp
			// Used for deletion tests
			// -------------------------------------------------------------------------
			{
				"Supertramp",
				"Logical Song To delete",
				"1979",
				"Supertramp;Rock;Progressive Rock",
				"Rock;Progressive Rock",
				"Test score intended to be deleted by automated tests.",
				"Test data",
				"SupertrampToDelete/Logical Song.pdf",
				[]int32{1, 6},
			},
		}
		// cspell:enable

		// Loop that runs the seeder for each element
		for _, c := range testScores {
			partitionPath := ""
			if c.PartitionFileName != "" {
				partitionPath = "../testauto/backend/resources/scores/" + c.PartitionFileName
			}
			logger.Score.Info("Score seeder for %s", c.ScoreName)
			for _, user_id := range c.UserID {
				logger.Score.Info("   - Loop User : UserID: %d", user_id)
				if err := appServer.seederService.SeederScore(c.ComposerName, c.ScoreName, c.ReleaseDate, c.Tags, c.Categories, c.InformationText, c.Annotations, partitionPath, false, user_id); err != nil {
					logger.Score.Fatal("Seed failed: %v", err)
				}
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
