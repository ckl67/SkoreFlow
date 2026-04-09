package pdf

// ======================================================================================
// INFRASTRUCTURE     | utils/         | "Atomic" functions, "blind" to business logic.
//                    |                | (Disk I/O, network calls, file manipulation).
// ======================================================================================

import (
	"backend/infrastructure/config"
	"backend/infrastructure/logger"
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"path/filepath"
	"time"
)

// RequestToPdfToImage sends a PDF file to the Python microservice to generate an image thumbnail.
// - pdfPath: source PDF file path
// - thumbPath: destination image file path
// - logLevel: verbosity for microservice logging
// Returns true if the thumbnail was successfully generated.
func RequestToPdfToImage(pdfPath string, thumbPath string, logLevel string) bool {
	// 0. Prepare microservice URL from config
	msConfig := config.Config().MicroService
	url := fmt.Sprintf("http://localhost:%d/createthumbnail", msConfig.MsPort)

	// 1. Ensure absolute paths to avoid working directory issues
	absPdfPath, _ := filepath.Abs(pdfPath)
	absThumbPath, _ := filepath.Abs(thumbPath)

	// 2. Prepare JSON payload
	payload := map[string]string{
		"pdf_path":    absPdfPath,
		"output_path": absThumbPath,
		"log_level":   logLevel,
	}

	jsonData, err := json.Marshal(payload)
	if err != nil {
		logger.Sheet.Error("Failed to encode JSON for microservice: %v", err)
		return false
	}

	// 3. Send POST request to microservice
	client := http.Client{
		Timeout: 60 * time.Second, // PDF -> Image conversion may be heavy
	}

	resp, err := client.Post(url, "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		logger.Sheet.Error("Python microservice unreachable: %v", err)
		return false
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		logger.Sheet.Error("Microservice failed (Status: %d)", resp.StatusCode)
		return false
	}

	logger.Sheet.Debug("Thumbnail successfully generated: %s", absThumbPath)
	return true
}
