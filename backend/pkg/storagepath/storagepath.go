package storagepath

import (
	"fmt"
	"path/filepath"

	"backend/infrastructure/logger"
)

type Paths struct {
	AppRoot  string // Source code / static resources
	DataRoot string // Writable application data
}

// NewPaths constructs a Paths struct
func NewPaths(appRoot string, dataRoot string) *Paths {
	if appRoot == "" {
		logger.Main.Fatal("PROJECT_ROOT is not set")
	}

	if !filepath.IsAbs(appRoot) {
		logger.Main.Fatal("PROJECT_ROOT must be absolute")
	}

	if dataRoot == "" {
		logger.Main.Fatal("DATA_ROOT is not set")
	}

	if !filepath.IsAbs(dataRoot) {
		logger.Main.Fatal("DATA_ROOT must be absolute")
	}

	return &Paths{
		AppRoot:  appRoot,
		DataRoot: dataRoot,
	}
}

// ComposerPictureRel constructs the relative storage path for composers.
// composers
// │   ├── beethoven
// │   │   └── picture.png
func (p *Paths) ComposerPictureRel(composerSafeName, ext string) string {
	filename := "picture" + ext
	return filepath.Join(
		"composers",
		composerSafeName,
		filename,
	)
}

// composers
// │   ├── beethoven
// │   │   └── thumbnail.png
func (p *Paths) ComposerPictureThumbnailRel(composerSafeName, ext string) string {
	filename := "thumbnail" + ext
	return filepath.Join(
		"composers",
		composerSafeName,
		filename,
	)
}

// UserAvatarRel constructs the relative storage path for user Avatar Picture
// user
func (p *Paths) UserAvatarRel(userID uint32) string {
	return filepath.Join(
		"users",
		fmt.Sprintf("user-%d.png", userID),
	)
}

// ScorePdfRel constructs the relative storage path for an uploaded score PDF.
func (p *Paths) ScorePdfRel(userID uint32, composerSafeName, scoreSafeName string) string {
	return filepath.Join(
		"scores/uploaded",
		fmt.Sprintf("user-%d", userID),
		composerSafeName,
		scoreSafeName+".pdf",
	)
}

// ScoreThumbnailRel constructs the relative storage path for a score thumbnail image.
// Remark : path.Join : Not depending of the OS = always /  --  filepath.Join : depending of the OS / or \
func (p *Paths) ScoreThumbnailRel(userID uint32, composerSafeName, scoreSafeName string) string {
	return filepath.Join(
		"scores/thumbnails",
		fmt.Sprintf("user-%d", userID),
		composerSafeName,
		scoreSafeName+".png",
	)
}

// ResolveDataRoot returns the absolute path for a given relative path
//
//	 Example
//				paths.ResolveDataRoot( "composers/mozart/picture.png")
//			returns
//				/opt/render/project/src/backend/storage/composers/mozart/picture.png
func (p *Paths) ResolveDataRoot(rel string) string {
	return filepath.Join(p.DataRoot, rel)
}

// ResolveAssetRoot returns the absolute path for a given relative path
// ResolveAssetRoot() is used to... Convert
//
//	users/default.png to
//	/home/christian/.../backend/assets/users/default.png
//
// only when you need to open the file.
func (p *Paths) ResolveAssetRoot(rel string) string {
	logger.User.Debug("Path Found : %s", filepath.Join(p.AppRoot, "assets", rel))
	return filepath.Join(p.AppRoot, "assets", rel)
}
