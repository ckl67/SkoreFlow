package middlewares

import (
	"backend/infrastructure/config"
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"golang.org/x/time/rate"
)

// client defines a structure to track a specific user's rate limit and activity.
type client struct {
	limiter  *rate.Limiter // The token bucket limiter for this specific IP
	lastSeen time.Time     // Timestamp to potentially cleanup inactive clients later
}

var (
	// clients stores a mapping of IP addresses to their respective limiter data.
	clients = make(map[string]*client)
	// mu is a Mutex to prevent race conditions as multiple goroutines access the map concurrently.
	mu sync.Mutex
)

// RateLimiter middleware handles incoming requests and limits them based on IP.
func RateLimiter(rps rate.Limit, burst int) gin.HandlerFunc {
	return func(c *gin.Context) {

		// 🔥 Bypass the limiter logic if the environment is set to "test".
		// to avoid blocking in vitest !
		if config.Config().ProtectionLevel == "none" {
			c.Next()
			return
		}

		// Retrieve the client's public IP address.
		ip := c.ClientIP()

		// Lock the mutex before reading/writing to the shared 'clients' map.
		mu.Lock()
		cl, exists := clients[ip]

		// If the IP is not in our map, initialize a new limiter for it.
		if !exists {
			cl = &client{
				// rate.NewLimiter defines how many events (rps) are allowed and the bucket size (burst).
				limiter:  rate.NewLimiter(rps, burst),
				lastSeen: time.Now(),
			}
			clients[ip] = cl
		}

		// Update the last activity timestamp and release the lock immediately.
		cl.lastSeen = time.Now()
		mu.Unlock()

		// Check if the client is allowed to perform the action (consumes a token).
		if !cl.limiter.Allow() {
			// If the bucket is empty, return a 429 Too Many Requests error.
			c.JSON(http.StatusTooManyRequests, gin.H{
				"success": false,
				"error": gin.H{
					"message": "Too many requests",
				},
			})
			// Stop the execution of the current request handlers.
			c.Abort()
			return
		}

		// Proceed to the next handler if the request is within limits.
		c.Next()
	}
}
