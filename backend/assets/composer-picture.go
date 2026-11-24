package assets

var defaultComposerPicture = map[string]string{
	//	     Database 										Project Root
	"composers/default.png": "composers/default.jpg",
}

var defaultComposerThumbnail = map[string]string{
	//	     Database 										Project Root
	"composers/default.png": "composers/default-thumbnail.jpg",
}

// GetDefaultComposerPicture provides a secure way to read data
func GetDefaultComposerPicture(composerKey string) (string, bool) {
	asset, ok := defaultComposerPicture[composerKey]
	//logger.Composer.Debug("(GetDefaultComposerPicture) composerKey=%s asset=%s", composerKey, asset)
	return asset, ok
}

// GetDefaultComposerPicture provides a secure way to read data
func GetDefaultComposerThumbnail(composerKey string) (string, bool) {
	asset, ok := defaultComposerThumbnail[composerKey]
	//logger.Composer.Debug("(GetDefaultComposerPicture) composerKey=%s asset=%s", composerKey, asset)
	return asset, ok
}
