package filedir

// ======================================================================================
// INFRASTRUCTURE     | utils/         | "Atomic" functions, "blind" to business logic.
//                    |                | (Disk I/O, network calls, file manipulation).
// ======================================================================================

import (
	"errors"
	"fmt"
	"io"
	"mime/multipart"
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

// OsCreateFile writes a multipart file to disk without additional checks.
func OsCreateFile(fullpath string, file multipart.File) error {
	f, err := os.OpenFile(fullpath, os.O_WRONLY|os.O_CREATE, 0o666)
	if err != nil {
		return err
	}
	defer f.Close()

	_, err = io.Copy(f, file)
	return err
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

// SaveFileToDisk writes a multipart file to disk, flushes buffers, and closes file explicitly.
// Critical for ensuring external services (Python microservice) read complete files.
func SaveFileToDisk(fullpath string, file multipart.File) error {
	out, err := os.Create(fullpath)
	if err != nil {
		return err
	}

	if _, err := io.Copy(out, file); err != nil {
		out.Close()
		return err
	}

	if err := out.Sync(); err != nil {
		out.Close()
		return err
	}

	return out.Close()
}

// SaveFile saves a file from FileHeader to disk safely.
// - Ensures directory exists
// - otherwise will create the full path
// - Validates file size (<2MB)
// - Flushes content to disk
func SaveFile(fileHeader *multipart.FileHeader, fullPath string) error {
	src, err := fileHeader.Open()
	if err != nil {
		return err
	}
	defer src.Close()

	dir := filepath.Dir(fullPath)
	if err := os.MkdirAll(dir, os.ModePerm); err != nil {
		return fmt.Errorf("unable to create directory tree %s: %v", fullPath, err)
	}

	if fileHeader.Size > 2<<20 { // 2MB
		return errors.New("file too large")
	}

	dst, err := os.Create(fullPath)
	if err != nil {
		return err
	}

	if _, err := io.Copy(dst, src); err != nil {
		dst.Close()
		return err
	}

	if err := dst.Sync(); err != nil {
		dst.Close()
		return err
	}

	return dst.Close()
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
