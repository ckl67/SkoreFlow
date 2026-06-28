package pdf

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

// -----------------------------------------------------------------------------
// RequestToPdfToImage
// Sends a PDF to Python microservice and returns success/failure
// -----------------------------------------------------------------------------

func RequestToPdfToImage(pdfPath string, thumbPath string, logLevel string) bool {

	// ---------------------------------------------------------
	// 0. Microservice URL (from config)
	// ---------------------------------------------------------
	// 0. Prepare microservice URL from config
	msConfig := config.Config().MicroService
	url := fmt.Sprintf(
		"%s/createthumbnail",
		msConfig.ThumbnailServiceURL,
	)

	// ---------------------------------------------------------
	// 1. Normalize paths (avoid relative path issues)
	// ---------------------------------------------------------
	absPdfPath, err := filepath.Abs(pdfPath)
	if err != nil {
		logger.Score.Error("failed to resolve pdf path: %v", err)
		return false
	}

	absThumbPath, err := filepath.Abs(thumbPath)
	if err != nil {
		logger.Score.Error("failed to resolve thumbnail path: %v", err)
		return false
	}

	// ---------------------------------------------------------
	// 2. Build payload
	// ---------------------------------------------------------
	payload := map[string]string{
		"pdf_path":    absPdfPath,
		"output_path": absThumbPath,
		"log_level":   logLevel,
	}

	jsonData, err := json.Marshal(payload)
	if err != nil {
		logger.Score.Error("failed to marshal JSON payload: %v", err)
		return false
	}

	// ---------------------------------------------------------
	// 3. HTTP client (timeout is critical for microservices)
	// ---------------------------------------------------------
	client := &http.Client{
		Timeout: 60 * time.Second,
	}

	req, err := http.NewRequest(
		http.MethodPost,
		url,
		bytes.NewBuffer(jsonData),
	)
	if err != nil {
		logger.Score.Error("failed to create request: %v", err)
		return false
	}

	req.Header.Set("Content-Type", "application/json")

	// ---------------------------------------------------------
	// 4. Execute request
	// ---------------------------------------------------------
	resp, err := client.Do(req)
	if err != nil {
		logger.Score.Error("microservice unreachable: %v", err)
		return false
	}
	defer resp.Body.Close()

	// ---------------------------------------------------------
	// 5. Status handling
	// ---------------------------------------------------------
	if resp.StatusCode != http.StatusOK {
		logger.Score.Error("microservice error status: %d", resp.StatusCode)
		return false
	}

	// ---------------------------------------------------------
	// 6. Optional: decode response (useful for debugging)
	// ---------------------------------------------------------
	var result struct {
		Status  string `json:"status"`
		Message string `json:"message"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&result); err == nil {
		logger.Score.Debug("thumbnail result: %s", result.Message)
	} else {
		logger.Score.Debug("thumbnail generated (no JSON response parsed)")
	}

	logger.Score.Debug("thumbnail successfully generated: %s", absThumbPath)

	return true
}
