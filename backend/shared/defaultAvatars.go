package shared

import "backend/infrastructure/logger"

var defaultAvatars = map[string]string{
	//	Database 							Project Root
	// 										backend/assets/users
	"users/default.png":   "users/default.png",
	"users/moderator.png": "users/moderator.png",
	"users/admin.png":     "users/admin.png",
}

// GetDefaultAvatar provides a secure way to read data
func GetDefaultAvatar(avatarKey string) (string, bool) {
	asset, ok := defaultAvatars[avatarKey]
	logger.User.Debug("(GetDefaultAvatar) avatarKey=%s asset=%s", avatarKey, asset)
	return asset, ok
}
