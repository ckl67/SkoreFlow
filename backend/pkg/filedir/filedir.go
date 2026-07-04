package filedir

// ======================================================================================
// INFRASTRUCTURE     | utils/         | "Atomic" functions, "blind" to business logic.
//                    |                | (Disk I/O, network calls, file manipulation).
// ======================================================================================

import (
	"fmt"
	"io"
	"os"
	"path/filepath"

	"backend/infrastructure/logger"
)

// RemoveFileIfExists deletes a file if it exists.
// - Logs a warning if file does not exist.
// - Returns an error if deletion fails.
// - Logs debug message on successful deletion.
func RemoveFileIfExists(path string) error {
	if path == "" {
		return nil
	}

	err := os.Remove(path)
	if err != nil {
		if os.IsNotExist(err) {
			logger.Score.Debug("File not found (nothing to delete): %s", path)
			return nil
		}
		logger.Score.Warn("Failed to delete file %s: %v", path, err)
		return err
	}

	logger.Score.Debug("File deleted: %s", path)
	return nil
}

// CreateDir creates a directory and all necessary parent directories.
// Safe to call even if directories already exist.
func CreateDir(path string) error {
	err := os.MkdirAll(path, os.ModePerm)
	if err != nil {
		return fmt.Errorf("unable to create directory tree %s: %v", path, err)
	}
	return nil
}

// CleanEmptyDirs recursively removes empty directories.
// Stops at root or when folder is not empty.
func CleanEmptyDirs(dirPath string) {
	if dirPath == "" || dirPath == "." || dirPath == "/" {
		return
	}

	files, err := os.ReadDir(dirPath)
	if err != nil {
		if os.IsNotExist(err) {
			return
		}
		logger.Score.Warn("Cannot read directory %s: %v", dirPath, err)
		return
	}

	if len(files) == 0 {
		if err := os.Remove(dirPath); err == nil {
			logger.Score.Debug("Empty directory removed: %s", dirPath)
			CleanEmptyDirs(filepath.Dir(dirPath)) // clean parent
		}
	}
}

// SaveFile saves file to disk safely.
func SaveFile(fullPath string, src io.Reader) error {
	dir := filepath.Dir(fullPath)

	if err := os.MkdirAll(dir, os.ModePerm); err != nil {
		return fmt.Errorf("unable to create directory tree %s: %v", fullPath, err)
	}

	out, err := os.Create(fullPath)
	if err != nil {
		return err
	}
	defer out.Close()

	if _, err := io.Copy(out, src); err != nil {
		return err
	}

	return out.Sync()
}

// CreateDirTree will create the full path
// Example : CreateDirTree("data/users/exports/excel")
// Will check if data exist, if not it will create it .. and so one
func CreateDirTree(fullPath string) error {
	dir := filepath.Dir(fullPath)

	if err := os.MkdirAll(dir, os.ModePerm); err != nil {
		return fmt.Errorf("unable to create directory tree %s: %v", fullPath, err)
	}

	return nil
}
