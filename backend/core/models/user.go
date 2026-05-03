package models

// ===============================================================================================
// Layer              | Component      | Business Role
// -------------------|----------------|----------------------------------------------------------
// PERSISTENCE        | models/        | Handles database operations only (SQL via GORM).
// ===============================================================================================

import (
	"strings"
	"time"

	"backend/auth"

	"gorm.io/gorm"
)

// User represents a system user entity stored in the database.

type User struct {
	ID                  uint32    `gorm:"primaryKey;autoIncrement" json:"id"`
	Username            string    `gorm:"size:100;not null;uniqueIndex" json:"username"`
	Email               string    `gorm:"size:100;not null;uniqueIndex" json:"email"`
	Password            string    `gorm:"size:255;not null" json:"-"` // Excluded from JSON output
	PasswordReset       string    `gorm:"size:255" json:"-"`          // Password reset token Excluded too !
	PasswordResetExpire time.Time `json:"-"`                          // Token expiration time Excluded !
	Avatar              string    `gorm:"size:255" json:"avatar"`
	Role                int       `gorm:"default:0" json:"role"` // 0 = standard user
	IsVerified          bool      `gorm:"default:false" json:"isVerified"`
	CreatedAt           time.Time `json:"createdAt"`
	UpdatedAt           time.Time `json:"updatedAt"`
}

// Create inserts a new user record into the database.
func (u *User) Create(db *gorm.DB) error {
	return db.Create(u).Error
}

// FindByEmail retrieves a user by their email address.
func (u *User) FindByEmail(db *gorm.DB, email string) error {
	return db.Where("email = ?", email).First(u).Error
}

// FindByToken retrieves a user using a password reset token.
func (u *User) FindByToken(db *gorm.DB, token string) error {
	return db.Where("password_reset = ?", token).First(u).Error
}

// ExistsByEmail checks whether a user exists with the given email.
// Returns true if found, false otherwise.
func (u *User) ExistsByEmail(db *gorm.DB, email string) (bool, error) {
	var count int64
	err := db.Model(&User{}).Where("email = ?", email).Count(&count).Error
	return count > 0, err
}

// ExistsByUserName checks whether a user exists with the given username.
// Returns true if found, false otherwise.
func (u *User) ExistsByUserName(db *gorm.DB, username string) (bool, error) {
	var count int64
	err := db.Model(&User{}).Where("username = ?", username).Count(&count).Error
	return count > 0, err
}

// FindByID retrieves a user by their unique identifier.
func (u *User) FindByID(db *gorm.DB, id uint32) error {
	return db.First(u, id).Error
}

// Delete permanently removes the user from the database.
// Uses Unscoped() to bypass soft delete if enabled.
func (u *User) Delete(db *gorm.DB) (int64, error) {
	result := db.Unscoped().Delete(u)
	return result.RowsAffected, result.Error
}

// Update performs a full update of the user using db.Save().
// All fields are overwritten, including zero values.
// The struct must be fully populated before calling this method.
func (u *User) Update(db *gorm.DB) error {
	return db.Save(u).Error
}

// Save persists the current state of the user in the database.
// Equivalent to Update(), kept for semantic clarity.
func (u *User) Save(db *gorm.DB) error {
	return db.Save(u).Error
}

// GeneratePasswordResetToken generates a secure token and sets its expiration time.
// Updates : PasswordReset=token and PasswordResetExpire
// Token is valid for 1 hour.
func (u *User) GeneratePasswordResetToken() error {
	token, err := auth.CreateSecureToken(40)
	if err != nil {
		return err
	}

	u.PasswordReset = token
	u.PasswordResetExpire = time.Now().Add(time.Hour)
	return nil
}

// NormalizeEmail trims whitespace and converts the email to lowercase.
// Ensures consistent email storage and comparison.
func (u *User) NormalizeEmail() {
	u.Email = strings.ToLower(strings.TrimSpace(u.Email))
}

// GetAllUsers retrieves up to 100 users from the database.
// Intended for admin or debugging purposes.
func GetAllUsers(db *gorm.DB) ([]User, error) {
	var users []User
	err := db.Limit(100).Find(&users).Error
	return users, err
}

// List retrieves users with pagination
func (c *User) List(db *gorm.DB, pagination *Pagination, userID uint32) (*Pagination, error) {
	var users []*User

	// Base query
	query := db.Model(&User{})

	// Execute query with pagination
	err := query.Scopes(paginate(pagination, query)).Find(&users).Error
	if err != nil {
		return nil, err
	}

	pagination.Rows = users
	return pagination, nil
}
