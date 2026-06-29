package health

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

// MicroserviceHealth represents expected response
type MicroserviceHealth struct {
	Status string `json:"status"`
}

// CheckThumbnailService verifies that Python service is alive
func CheckThumbnailService(url string) error {

	client := http.Client{
		Timeout: 2 * time.Second,
	}

	req, err := http.NewRequestWithContext(
		context.Background(),
		http.MethodGet,
		url,
		nil,
	)
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("microservice/thumbnail unreachable: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("microservice/thumbnail unhealthy: status=%d", resp.StatusCode)
	}

	var result MicroserviceHealth
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return fmt.Errorf("invalid health response: %w", err)
	}

	if result.Status != "ok" {
		return fmt.Errorf("microservice/thumbnail not ready (status=%s)", result.Status)
	}

	return nil
}
