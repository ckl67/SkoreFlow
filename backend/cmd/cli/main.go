package main

import (
	"backend/infrastructure/config"
	"backend/infrastructure/database"
	"flag"
	"fmt"

	"gorm.io/gorm"
)

// ===============================================================================================
//	cd backend/cmd/cli
// 	go build -o skoreflow-cli
//	Exemples d’utilisation :
//		./skoreflow-cli -version
//		./skoreflow-cli -list-users
//		./skoreflow-cli -reset-password user@example.com
// ===============================================================================================

// CLI Flags
var (
	listUsersFlag   = flag.Bool("list-users", false, "List all users in the database")
	resetUserFlag   = flag.String("reset-password", "", "Reset password for a user by email")
	showVersionFlag = flag.Bool("version", false, "Show CLI version")
)

const cliVersion = "0.1.0"

func main() {
	flag.Parse()

	if *showVersionFlag {
		fmt.Printf("skoreflow CLI version %s\n", cliVersion)
		return
	}

	cfg := config.Config()

	db := database.ConnectDB(cfg)

	if *listUsersFlag {
		listUsers(db)
		return
	}

	fmt.Println("No command provided. Use -h for help.")
}

// listUsers prints all users
func listUsers(db *gorm.DB) {
	var users []struct {
		ID    uint
		Email string
	}
	if err := db.Table("users").Select("id, email").Scan(&users).Error; err != nil {
		fmt.Printf("Error fetching users: %v\n", err)
		return
	}
	fmt.Println("Users:")
	for _, u := range users {
		fmt.Printf(" - %d: %s\n", u.ID, u.Email)
	}
}
