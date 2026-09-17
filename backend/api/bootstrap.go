//cspell:ignore datatypes
package api

import (
	"backend/infrastructure/config"
	"backend/infrastructure/database"
	"backend/infrastructure/logger"
	"backend/internal/domain"

	"gorm.io/datatypes"
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
	Annotations       datatypes.JSON
	PartitionFileName string
	UserID            []uint32
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

	// --------------------------- ADMIN and DEMO ----------------------------
	//	                  		USERS
	//	                  		  │
	//	        ┌───────────────┴─────────┐
	//	        │               			    │
	//	      admin             			   demo
	//	        │               			    │
	//	   data normal          			 data demo
	//	        │                 			  │
	//	        ▼                 			  ▼
	//	     /scores            		/demo/scores
	//	   uid connected   			 no authentication needed
	//   admin = user id : 1 			demo = user id : 2
	// -------------------------------------------------------------------------
	appServer.seederService.User("admin", cfg.Admin.Email, cfg.Admin.Password, domain.RoleAdmin, "users/admin.png")
	appServer.seederService.User("demo", "", "", domain.RoleUser, "users/default.png")

	// ----------------------------- DEMO ----------------------------
	// Demo composers
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

	const demoAnnotations = `[
  {
    "id": "annotation-124",
    "page": 3,
    "type": "rectangle",
    "geometry": {
      "x": 120,
      "y": 180,
      "width": 150,
      "height": 60
    },
    "style": {
      "color": "#ff0000",
      "strokeWidth": 2
    }
  }]`

	// cspell:disable
	demoScores := []scores{
		{"Wolfgang Amadeus Mozart Demo", "La Marche Turque Demo", "1965", "Piano", "Classical", "This is an Information Demo", datatypes.JSON(demoAnnotations), "Amadeus Mozart/La Marche Turque.pdf", []uint32{config.UidDemo}},
		{"Wolfgang Amadeus Mozart Demo", "Valse Favorite Demo", "1870", "Piano", "Classical", "This is an Information Demo", datatypes.JSON(demoAnnotations), "Amadeus Mozart/Valse favorite.pdf", []uint32{config.UidDemo}},
		{"Ludwig van Beethoven Demo", "Adagio Pathétique Demo", "1798", "Piano", "Classical", "Adagio cantabile from Piano Sonata No. 8 in C minor, Op. 13, Pathétique.", datatypes.JSON(demoAnnotations), "Ludwig Van Beethoven/Adagio Pathétique.pdf", []uint32{config.UidDemo}},
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
			logger.Score.Info("   - created for user : %d", user_id)
			if err := appServer.seederService.SeederScore(c.ComposerName, c.ScoreName, c.ReleaseDate, c.Tags, c.Categories, c.InformationText, c.Annotations, partitionPath, true, user_id); err != nil {
				logger.Score.Fatal("Seed failed: %v", err)
			}
		}
	}

	// ----------------------------- TEST  ----------------------------

	const (
		uidAdmin      uint32 = 1
		uidDemo       uint32 = 2
		uidUser1      uint32 = 3
		uidUser2      uint32 = 4
		uidUser3      uint32 = 5
		uidUser6      uint32 = 6
		uidModerator1 uint32 = 7
		uidModerator2 uint32 = 8
	)

	if config.Config().DevelopmentRuntime.SeedData {
		// Users
		appServer.seederService.User("user1", "user1@test.com", "password123", domain.RoleUser, "users/default.png")
		appServer.seederService.User("user2", "user2@test.com", "password123", domain.RoleUser, "users/default.png")
		appServer.seederService.User("user3", "user3@test.com", "password123", domain.RoleUser, "users/default.png")
		appServer.seederService.User("user6", "user6@test.com", "password123", domain.RoleUser, "users/default.png")
		appServer.seederService.User("moderator1", "moderator1@test.com", "password123", domain.RoleModerator, "users/moderator.png")
		appServer.seederService.User("moderator2", "moderator2@test.com", "password123", domain.RoleModerator, "users/moderator.png")

		// Composers
		// Files stored in ../testauto/backend/resources/composers/
		// Array (slice of structs) containing all your compositors
		// cspell:disable
		testComposers := []composers{
			{"Wolfgang Amadeus Mozart", "Classical period", "https://fr.wikipedia.org/wiki/Wolfgang_Amadeus_Mozart", "Mozart.png"},
			{"Ludwig van Beethoven", "Classical period", "https://fr.wikipedia.org/wiki/Ludwig_van_Beethoven", "Beethoven.png"},
			{"Beethoven Son", "Fack", "", ""},
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

		const testAnnotations = `[
			{
				"id": "annotation-122",
				"page": 3,
				"type": "rectangle",
				"geometry": {
					"x": 120,
					"y": 180,
					"width": 150,
					"height": 60
				},
				"style": {
					"color": "#ff0000",
					"strokeWidth": 2
				}
			},
			{
			"id": "annotation-123",
			"page": 3,
			"type": "circle",
			"geometry": {
				"x": 150,
				"y": 200,
				"radius": 20
			},
			"style": {
				"color": "#ff0000",
				"strokeWidth": 2,
				"opacity": 1
			}
		}
	]`

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
				datatypes.JSON(testAnnotations),
				"Amadeus Mozart/La Marche Turque.pdf",
				[]uint32{uidUser1, uidUser2, uidUser6},
			},
			{
				"Wolfgang Amadeus Mozart",
				"Valse favorite",
				"1780",
				"Mozart;Waltz;Piano",
				"Classical;Piano",
				"A piano piece attributed to Wolfgang Amadeus Mozart.",
				datatypes.JSON(testAnnotations),
				"Amadeus Mozart/Valse favorite.pdf",
				[]uint32{uidUser1, uidUser2, uidUser3},
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
				datatypes.JSON(testAnnotations),
				"Frédéric Chopin/Nocturne Opus 9 N°2.pdf",
				[]uint32{uidUser1, uidUser3, uidUser6},
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
				datatypes.JSON(testAnnotations),
				"Ludwig Van Beethoven/Adagio Pathétique.pdf",
				[]uint32{uidUser1, uidUser2, uidUser3},
			},
			{
				"Ludwig van Beethoven",
				"La Lettre à Elise",
				"1810",
				"Beethoven;Piano;Romantic",
				"Classical;Piano",
				"Bagatelle in A minor, WoO 59, commonly known as Für Elise.",
				datatypes.JSON(testAnnotations),
				"Ludwig Van Beethoven/La Lettre à Elise.pdf",
				[]uint32{uidUser2, uidUser3},
			},
			{
				"Ludwig van Beethoven",
				"Sonate No. 14 - Clair de lune",
				"1801",
				"Beethoven;Piano;Sonata;Classical",
				"Classical;Piano;Sonata",
				"Piano Sonata No. 14 in C-sharp minor, Op. 27 No. 2, commonly known as the Moonlight Sonata.",
				datatypes.JSON(testAnnotations),
				"Ludwig Van Beethoven/Sonate No. 14 - Clair de lune.pdf",
				[]uint32{uidUser1, uidUser2, uidUser3},
			},

			// -------------------------------------------------------------------------
			// Beethoven Son (Fack)
			// -------------------------------------------------------------------------
			{
				"Beethoven Son",
				"Adagio Pathétique - Fack",
				"1798",
				"Beethoven;Piano;Classical",
				"Classical;Piano",
				"Cello Facke",
				datatypes.JSON(testAnnotations),
				"Ludwig Van Beethoven/Adagio Pathétique.pdf",
				[]uint32{uidUser1},
			},

			{
				"Beethoven Son",
				"Sonate No. 14 - Clair de lune - Fack",
				"1801",
				"Beethoven;Piano;Sonata;Classical",
				"Classical;Piano;Sonata",
				"Piano Fack",
				datatypes.JSON(testAnnotations),
				"Ludwig Van Beethoven/Sonate No. 14 - Clair de lune.pdf",
				[]uint32{uidUser1},
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
				datatypes.JSON(testAnnotations),
				"Paul de Senneville/Balade Pour Adeline.pdf",
				[]uint32{uidUser1, uidModerator1, uidModerator2},
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
				datatypes.JSON(testAnnotations),
				"Supertramp/Logical Song.pdf",
				[]uint32{uidUser1, uidUser2},
			},
			{
				"Supertramp",
				"Logical Song New",
				"1979",
				"Supertramp;Rock;Progressive Rock",
				"Rock;Progressive Rock",
				"Alternative arrangement of The Logical Song from the album Breakfast in America.",
				datatypes.JSON(testAnnotations),
				"Supertramp/Logical Song New.pdf",
				[]uint32{uidUser2},
			},
			{
				"Supertramp",
				"School",
				"1975",
				"Supertramp;Rock;Progressive Rock",
				"Rock;Progressive Rock",
				"School from the album Crime of the Century.",
				datatypes.JSON(testAnnotations),
				"Supertramp/School.pdf",
				[]uint32{uidUser1, uidUser3},
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
				datatypes.JSON(testAnnotations),
				"Supertramp/Logical Song to-delete.pdf",
				[]uint32{uidUser1, uidUser3},
			},
			{
				"Supertramp",
				"School to delete",
				"1975",
				"Supertramp;Rock;Progressive Rock",
				"Rock;Progressive Rock",
				"School from the album Crime of the Century.",
				datatypes.JSON(testAnnotations),
				"Supertramp/School to-delete.pdf",
				[]uint32{uidUser1, uidUser2, uidUser3},
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
				logger.Score.Info("   - created for user : %d", user_id)
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
