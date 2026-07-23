package media

import (
	"backend/infrastructure/config"
	"backend/infrastructure/logger"
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"path/filepath"
	"time"
)

// -----------------------------------------------------------------------------
// RequestThumbnail
// Sends a file to Python microservice and returns success/failure
// -----------------------------------------------------------------------------

func RequestThumbnail(inputPath string, outputPath string, maxSize int, logLevel string) bool {

	// ---------------------------------------------------------
	// 0. Microservice URL (from config)
	// ---------------------------------------------------------
	// 0. Prepare microservice URL from config
	msConfig := config.Config().MicroService
	url := fmt.Sprintf(
		"%s/thumbnail/create",
		msConfig.ThumbnailServiceURL,
	)

	// ---------------------------------------------------------
	// 1. Normalize paths (avoid relative path issues)
	// ---------------------------------------------------------
	absInputPath, err := filepath.Abs(inputPath)
	if err != nil {
		logger.MicroService.Error("failed to resolve pdf path: %v", err)
		return false
	}

	absOutputPath, err := filepath.Abs(outputPath)
	if err != nil {
		logger.MicroService.Error("failed to resolve thumbnail path: %v", err)
		return false
	}

	// ---------------------------------------------------------
	// 2. Build payload
	// ---------------------------------------------------------
	payload := map[string]any{
		"input_path":  absInputPath,
		"output_path": absOutputPath,
		"max_size":    maxSize,
		"log_level":   logLevel,
	}

	jsonData, err := json.Marshal(payload)
	if err != nil {
		logger.MicroService.Error("failed to marshal JSON payload: %v", err)
		return false
	}

	// ---------------------------------------------------------
	// 3. HTTP client (timeout is critical for microservices)
	// ---------------------------------------------------------
	client := &http.Client{
		Timeout: 60 * time.Second,
	}

	// Call the service
	req, err := http.NewRequest(
		http.MethodPost,
		url,
		bytes.NewBuffer(jsonData),
	)
	if err != nil {
		logger.MicroService.Error("failed to create request: %v", err)
		return false
	}

	req.Header.Set("Content-Type", "application/json")

	// ---------------------------------------------------------
	// 4. Execute request
	// ---------------------------------------------------------
	resp, err := client.Do(req)
	if err != nil {
		logger.MicroService.Error("microservice unreachable: %v", err)
		return false
	}
	defer resp.Body.Close()

	// ---------------------------------------------------------
	// 5. Status handling
	// ---------------------------------------------------------
	body, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != http.StatusOK {
		logger.MicroService.Error(
			"thumbnail microservice (%d): %s",
			resp.StatusCode,
			string(body),
		)
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
		logger.MicroService.Debug("thumbnail result: %s", result.Message)
		return false
	}

	logger.MicroService.Debug("thumbnail successfully generated: %s", absOutputPath)

	return true
}
