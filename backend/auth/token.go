package auth

// ===============================================================================================
// Package auth provides low-level JWT utilities.
// Responsibility:
// - Generate JWT tokens
// - Validate and parse JWT tokens
// - Extract metadata (user_id, role) from tokens
//
// Constraints:
// - No database access
// - No business logic
// - Purely stateless and technical layer
// ===============================================================================================

import (
	"crypto/rand"
	"encoding/base64"
	"fmt"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

// CreateToken generates a signed JWT containing user identity and role.
// Includes:
// - user_id
// - role
// - expiration (7 days)
func CreateToken(userID uint32, role int, apiSecret string) (string, error) {
	claims := jwt.MapClaims{
		"authorized": true,
		"user_id":    userID,
		"role":       role,
		"exp":        time.Now().Add(168 * time.Hour).Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(apiSecret))
}

// ExtractTokenID extracts the user_id from a valid JWT.
// Returns an error if the token is invalid or malformed.
func ExtractTokenID(tokenString, apiSecret string) (uint32, error) {
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		// Ensure expected signing method
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(apiSecret), nil
	})
	if err != nil {
		return 0, err
	}

	// Extract claims
	if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
		uidFloat, ok := claims["user_id"].(float64)
		if !ok {
			return 0, fmt.Errorf("user_id not found in token")
		}
		return uint32(uidFloat), nil
	}

	return 0, fmt.Errorf("invalid token claims")
}

// ExtractTokenMetadata extracts both user_id and role from a valid JWT.
// Note:
// - Numeric values are decoded as float64 by JWT
func ExtractTokenMetadata(tokenString, apiSecret string) (uint32, int, error) {
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		// Ensure expected signing method
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(apiSecret), nil
	})
	if err != nil {
		return 0, 0, err
	}

	// Extract claims
	if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
		uidFloat, okID := claims["user_id"].(float64)
		roleFloat, okRole := claims["role"].(float64)

		if !okID || !okRole {
			return 0, 0, fmt.Errorf("token payload missing metadata")
		}

		return uint32(uidFloat), int(roleFloat), nil
	}

	return 0, 0, fmt.Errorf("invalid token claims")
}

// CreateSecureToken generates a cryptographically secure random token.
// Typically used for password reset or email confirmation flows.
func CreateSecureToken(n int) (string, error) {
	b := make([]byte, n)

	_, err := rand.Read(b)
	if err != nil {
		return "", err
	}

	return base64.URLEncoding.EncodeToString(b), nil
}

// ExtractToken retrieves a token from the incoming request.
// Priority:
// 1. Query parameter (?token=...) — useful for direct links (email, files)
// 2. Authorization header (Bearer token)
func ExtractToken(c *gin.Context) string {
	// 1. Query parameter (highest priority)
	if token := c.Query("token"); token != "" {
		return token
	}

	// 2. Authorization header
	bearerToken := c.GetHeader("Authorization")
	strArr := strings.Split(bearerToken, " ")

	// Expected format: "Bearer <token>"
	if len(strArr) == 2 && strings.ToLower(strArr[0]) == "bearer" {
		return strArr[1]
	}

	return ""
}
