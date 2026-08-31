// cspell:ignore gonic webp
package media

var AllowedImageExt = map[string]bool{
	".jpg":  true,
	".jpeg": true,
	".png":  true,
	".webp": true,
}

var AllowedScoreFileExt = map[string]bool{
	".pdf": true,
}
