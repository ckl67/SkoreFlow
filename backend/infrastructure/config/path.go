package config

import (
	"fmt"
	"path"
	"path/filepath"

	"backend/infrastructure/logger"
)

type Paths struct {
	Root       string // /app
	StorageRel string // storage relative path, e.g. "storage"
	StorageAbs string // /app/storage absolute path
	MSRel      string // Microservice relative path, e.g.
	MSAbs      string // /Microservice absolute path
}

// NewPaths constructs a Paths struct from the given ServerConfig.
func NewPaths(cfg ServerConfig) *Paths {
	if cfg.AppRoot == "" {
		logger.Main.Fatal("APP_ROOT is not set")
	}

	if !filepath.IsAbs(cfg.AppRoot) {
		logger.Main.Fatal("APP_ROOT must be absolute")
	}

	if cfg.StoragePath == "" {
		logger.Main.Fatal("STORAGE_PATH is not set")
	}

	if filepath.IsAbs(cfg.StoragePath) {
		logger.Main.Fatal("STORAGE_PATH must be relative")
	}

	if cfg.MicroService.MsRoot == "" {
		logger.Main.Fatal("MicroService.MsRoot is not set")
	}
	if filepath.IsAbs(cfg.MicroService.MsRoot) {
		logger.Main.Fatal("MicroService.MSRoot ( corresponding to the  Root of all MicroService path example : micro-service ) must be relative")
	}

	return &Paths{
		Root:       cfg.AppRoot,
		StorageRel: cfg.StoragePath,
		StorageAbs: filepath.Join(cfg.AppRoot, cfg.StoragePath),
		MSRel:      cfg.MicroService.MsRoot,
		MSAbs:      filepath.Join(cfg.AppRoot, cfg.MicroService.MsRoot),
	}
}

// StorageAbsPath returns the absolute path for a given relative path within the storage directory.
// fullPath := paths.StoragePath(sheet.FilePath)
// Example :
// rel = sheets/uploaded-sheets/user-1/mozart/prelude.pdf
// return =  /home/christian/SkoreFlow_Project/SkoreFlow/backend/storage/sheets/uploaded-sheets/user-1/mozart/prelude.pdf
func (p *Paths) StorageAbsPath(rel string) string {
	return filepath.Join(p.StorageAbs, rel)
}

// UserAvatarStorageRel constructs the relative storage path for user Avatar.
// Remark : path.Join : Not depending of the OS = always /  --  filepath.Join : depending of the OS / or \
func (p *Paths) UserAvatarStorageRel(userID uint32) string {
	return path.Join(
		"users",
		fmt.Sprintf("user-%d.png", userID),
	)
}

// ComposerStorageRel constructs the relative storage path for composers.
func (p *Paths) ComposerPicturePath(composerSafeName, ext string) string {
	filename := composerSafeName + ext
	return path.Join(
		"composers",
		composerSafeName,
		filename,
	)
}

// SheetPDFStorageRel constructs the relative storage path for an uploaded sheet PDF.
// Remark : path.Join : Not depending of the OS = always /  --  filepath.Join : depending of the OS / or \
func (p *Paths) SheetPDFStorageRel(userID uint32, composerSafeName, sheetSafeName string) string {
	return path.Join(
		"sheets/uploaded-sheets",
		fmt.Sprintf("user-%d", userID),
		composerSafeName,
		sheetSafeName+".pdf",
	)
}

// SheetThumbnailStorageRel constructs the relative storage path for a sheet thumbnail image.
// Remark : path.Join : Not depending of the OS = always /  --  filepath.Join : depending of the OS / or \
func (p *Paths) SheetThumbnailStorageRel(userID uint32, composerSafeName, sheetSafeName string) string {
	return path.Join(
		"sheets/thumbnails",
		fmt.Sprintf("user-%d", userID),
		composerSafeName,
		sheetSafeName+".png",
	)
}
