package shared

var defaultComposerPicture = map[string]string{
	//	     Database 										Project Root
	// composers/mozart/picture.png             N.C.
	// 		composers/default.png				backend/assets/composers/default.png
	"composers/default.png": "composers/default.png",
}

// GetDefaultComposerPicture provides a secure way to read data
func GetDefaultComposerPicture(composerKey string) (string, bool) {
	asset, ok := defaultComposerPicture[composerKey]
	//logger.Composer.Debug("(GetDefaultComposerPicture) composerKey=%s asset=%s", composerKey, asset)
	return asset, ok
}

// GetDefaultComposerPicture provides a secure way to read data
func GetDefaultComposerThumbnail(composerKey string) (string, bool) {
	asset, ok := defaultComposerPicture[composerKey]
	//logger.Composer.Debug("(GetDefaultComposerPicture) composerKey=%s asset=%s", composerKey, asset)
	return asset, ok
}
