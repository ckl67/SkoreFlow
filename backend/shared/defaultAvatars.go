package shared

var defaultAvatars = map[string]string{
	"users/default.png":   "icons/default.png",
	"users/moderator.png": "icons/moderator.png",
	"users/admin.png":     "icons/admin.png",
}

// GetDefaultAvatar provides a secure way to read data
func GetDefaultAvatar(avatarKey string) (string, bool) {
	asset, ok := defaultAvatars[avatarKey]
	return asset, ok
}
