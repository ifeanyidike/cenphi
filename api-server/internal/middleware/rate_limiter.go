package middleware

import (
	"context"
	"fmt"
	"net"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/redis/go-redis/v9"
	"go.uber.org/zap"
)

// Config defines rate limiting configuration
type Config struct {
	Limit     int           `json:"limit"`
	Window    time.Duration `json:"window"`
	KeyPrefix string        `json:"key_prefix"`
	PerUser   bool          `json:"per_user"`
	Message   string        `json:"message"`
}

// Predefined configurations
var (
	DefaultAPI = Config{
		Limit:     100,
		Window:    time.Minute,
		KeyPrefix: "api",
		PerUser:   true,
		Message:   "Rate limit exceeded",
	}

	MediaUpload = Config{
		Limit:     20,
		Window:    time.Hour,
		KeyPrefix: "upload",
		PerUser:   true,
		Message:   "Upload rate limit exceeded",
	}

	// Regular AI operations (CPU-based, lighter processing)
	AIGeneration = Config{
		Limit:     50,
		Window:    time.Hour,
		KeyPrefix: "ai_regular",
		PerUser:   true,
		Message:   "AI generation rate limit exceeded",
	}

	// GPU-intensive AI operations (more expensive, stricter limits)
	AIGPUOperations = Config{
		Limit:     10,
		Window:    time.Hour,
		KeyPrefix: "ai_gpu",
		PerUser:   true,
		Message:   "AI GPU operation rate limit exceeded. These operations require significant resources.",
	}
)

// AI operation categories
var (
	// Regular AI operations (CPU-based, lighter processing)
	RegularAIOperations = map[string]bool{
		"brand_context": true,
		"transcription": true,
		"translation":   true,
		"sentiment":     true,
		"highlight":     true,
		"emotion":       true,
		"filler":        true,
		"polish":        true,
		"generation":    true,
	}

	// GPU-intensive operations (more expensive, stricter limits)
	GPUAIOperations = map[string]bool{
		"enhancement": true,
		"optimizer":   true,
		"narration":   true,
		"clipping":    true,
		"weaving":     true,
	}
)

type RateLimiter struct {
	redis  *redis.Client
	logger *zap.Logger
}

func NewRateLimiter(redisClient *redis.Client, logger *zap.Logger) *RateLimiter {
	return &RateLimiter{
		redis:  redisClient,
		logger: logger,
	}
}

// Middleware creates rate limiting middleware
func (rl *RateLimiter) Middleware(config Config) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Skip health checks
			if r.URL.Path == "/health" {
				next.ServeHTTP(w, r)
				return
			}

			allowed, remaining, resetTime, err := rl.checkLimit(r, config)
			if err != nil {
				rl.logger.Error("Rate limit check failed", zap.Error(err))
				// Fail open - allow request on Redis errors
				next.ServeHTTP(w, r)
				return
			}

			// Set rate limit headers
			w.Header().Set("X-RateLimit-Limit", strconv.Itoa(config.Limit))
			w.Header().Set("X-RateLimit-Remaining", strconv.Itoa(remaining))
			w.Header().Set("X-RateLimit-Reset", strconv.FormatInt(resetTime.Unix(), 10))

			if !allowed {
				rl.logger.Warn("Rate limit exceeded",
					zap.String("ip", getClientIP(r)),
					zap.String("user_agent", r.UserAgent()))

				w.Header().Set("Retry-After", strconv.FormatInt(int64(config.Window.Seconds()), 10))
				http.Error(w, config.Message, http.StatusTooManyRequests)
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}

// checkLimit performs the rate limit check using Redis pipeline
func (rl *RateLimiter) checkLimit(r *http.Request, config Config) (bool, int, time.Time, error) {
	now := time.Now()
	window := now.Truncate(config.Window)
	resetTime := window.Add(config.Window)

	key := rl.buildKey(r, config, window)

	// Use Redis pipeline for atomic operations
	pipe := rl.redis.Pipeline()

	// Increment counter
	incrCmd := pipe.Incr(r.Context(), key)

	// Set expiration if this is the first increment
	pipe.Expire(r.Context(), key, config.Window)

	// Execute pipeline
	_, err := pipe.Exec(r.Context())
	if err != nil {
		return false, 0, resetTime, fmt.Errorf("failed to execute rate limit pipeline: %w", err)
	}

	// Get current count
	current := int(incrCmd.Val())

	// Check if limit exceeded
	if current > config.Limit {
		return false, 0, resetTime, nil
	}

	remaining := config.Limit - current
	if remaining < 0 {
		remaining = 0
	}

	return true, remaining, resetTime, nil
}

// buildKey creates a consistent rate limit key
func (rl *RateLimiter) buildKey(r *http.Request, config Config, window time.Time) string {
	var identifier string

	if config.PerUser {
		if userID := getUserID(r); userID != "" {
			identifier = "user:" + userID
		} else {
			identifier = "ip:" + getClientIP(r)
		}
	} else {
		identifier = "ip:" + getClientIP(r)
	}

	return fmt.Sprintf("%s:%s:%d", config.KeyPrefix, identifier, window.Unix())
}

// getUserID extracts user ID from context
func getUserID(r *http.Request) string {
	if userID, ok := r.Context().Value("user_id").(string); ok {
		return userID
	}

	// Try Firebase claims as fallback
	if claims, ok := r.Context().Value("firebase_claims").(map[string]interface{}); ok {
		if uid, ok := claims["uid"].(string); ok {
			return uid
		}
	}

	return ""
}

// getClientIP extracts real client IP with proper IPv6 support
func getClientIP(r *http.Request) string {
	// Check forwarded headers
	if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
		ips := strings.Split(xff, ",")
		ip := strings.TrimSpace(ips[0])
		if net.ParseIP(ip) != nil {
			return ip
		}
	}

	if xri := r.Header.Get("X-Real-IP"); xri != "" {
		if net.ParseIP(xri) != nil {
			return xri
		}
	}

	// Parse RemoteAddr (handles IPv6)
	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		return r.RemoteAddr
	}
	return host
}

// ClearLimit clears rate limit for identifier
func (rl *RateLimiter) ClearLimit(ctx context.Context, identifier, prefix string) error {
	pattern := fmt.Sprintf("%s:%s:*", prefix, identifier)

	keys, err := rl.redis.Keys(ctx, pattern).Result()
	if err != nil {
		return fmt.Errorf("failed to get keys: %w", err)
	}

	if len(keys) > 0 {
		_, err = rl.redis.Del(ctx, keys...).Result()
		if err != nil {
			return fmt.Errorf("failed to delete keys: %w", err)
		}
	}

	return nil
}

// GetRateLimitStatus returns current rate limit status for a key
func (rl *RateLimiter) GetRateLimitStatus(ctx context.Context, key string, config Config) (count int, remaining int, resetTime time.Time, err error) {
	current, err := rl.redis.Get(ctx, key).Int()
	if err != nil {
		if err == redis.Nil {
			// Key doesn't exist, so no requests made
			return 0, config.Limit, time.Now().Truncate(config.Window).Add(config.Window), nil
		}
		return 0, 0, time.Time{}, fmt.Errorf("failed to get rate limit status: %w", err)
	}

	remaining = config.Limit - current
	if remaining < 0 {
		remaining = 0
	}

	window := time.Now().Truncate(config.Window)
	resetTime = window.Add(config.Window)

	return current, remaining, resetTime, nil
}

// Convenience methods for common configurations
func (rl *RateLimiter) APIMiddleware() func(http.Handler) http.Handler {
	return rl.Middleware(DefaultAPI)
}

func (rl *RateLimiter) UploadMiddleware() func(http.Handler) http.Handler {
	return rl.Middleware(MediaUpload)
}

// AI operation middlewares
func (rl *RateLimiter) AIGenerationMiddleware() func(http.Handler) http.Handler {
	return rl.Middleware(AIGeneration)
}

func (rl *RateLimiter) AIGPUMiddleware() func(http.Handler) http.Handler {
	return rl.Middleware(AIGPUOperations)
}

// SmartAIMiddleware automatically selects the appropriate rate limit based on operation type
func (rl *RateLimiter) SmartAIMiddleware() func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			operation := rl.extractAIOperation(r)

			var config Config
			if GPUAIOperations[operation] {
				config = AIGPUOperations
				rl.logger.Debug("Using GPU AI rate limit", zap.String("operation", operation))
			} else if RegularAIOperations[operation] {
				config = AIGeneration
				rl.logger.Debug("Using regular AI rate limit", zap.String("operation", operation))
			} else {
				// Unknown operation, use regular AI limits as fallback
				config = AIGeneration
				rl.logger.Debug("Using fallback AI rate limit", zap.String("operation", operation))
			}

			// Apply the selected rate limit
			middleware := rl.Middleware(config)
			middleware(next).ServeHTTP(w, r)
		})
	}
}

// extractAIOperation extracts the AI operation type from the request
func (rl *RateLimiter) extractAIOperation(r *http.Request) string {
	// Try to get from query parameter first
	if op := r.URL.Query().Get("operation"); op != "" {
		return op
	}

	// Try to get from form data
	if op := r.FormValue("operation"); op != "" {
		return op
	}

	// Try to get from header
	if op := r.Header.Get("X-AI-Operation"); op != "" {
		return op
	}

	// Try to extract from URL path (e.g., /ai/enhancement, /ai/transcription)
	pathParts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
	if len(pathParts) >= 2 && pathParts[0] == "ai" {
		return pathParts[1]
	}

	// Default fallback
	return "unknown"
}

// Helper function to check if an operation is GPU-intensive
func IsGPUOperation(operation string) bool {
	return GPUAIOperations[operation]
}

// Helper function to check if an operation is a regular AI operation
func IsRegularAIOperation(operation string) bool {
	return RegularAIOperations[operation]
}

// GetConfigForOperation returns the appropriate config for an AI operation
func GetConfigForOperation(operation string) Config {
	if GPUAIOperations[operation] {
		return AIGPUOperations
	} else if RegularAIOperations[operation] {
		return AIGeneration
	}
	return AIGeneration // fallback to regular AI limits
}

// SetAIOperationCategory allows you to dynamically add new operations
func SetAIOperationCategory(operation string, isGPU bool) {
	if isGPU {
		GPUAIOperations[operation] = true
		delete(RegularAIOperations, operation)
	} else {
		RegularAIOperations[operation] = true
		delete(GPUAIOperations, operation)
	}
}

// GetAIOperationStats returns statistics about AI operations
func (rl *RateLimiter) GetAIOperationStats(ctx context.Context, userID string) (map[string]interface{}, error) {
	now := time.Now()

	// Get regular AI usage
	regularWindow := now.Truncate(AIGeneration.Window)
	regularKey := fmt.Sprintf("%s:user:%s:%d", AIGeneration.KeyPrefix, userID, regularWindow.Unix())
	regularCount, regularRemaining, regularReset, err := rl.GetRateLimitStatus(ctx, regularKey, AIGeneration)
	if err != nil {
		return nil, err
	}

	// Get GPU AI usage
	gpuWindow := now.Truncate(AIGPUOperations.Window)
	gpuKey := fmt.Sprintf("%s:user:%s:%d", AIGPUOperations.KeyPrefix, userID, gpuWindow.Unix())
	gpuCount, gpuRemaining, gpuReset, err := rl.GetRateLimitStatus(ctx, gpuKey, AIGPUOperations)
	if err != nil {
		return nil, err
	}

	return map[string]interface{}{
		"regular_ai": map[string]interface{}{
			"used":      regularCount,
			"remaining": regularRemaining,
			"limit":     AIGeneration.Limit,
			"reset":     regularReset.Unix(),
		},
		"gpu_ai": map[string]interface{}{
			"used":      gpuCount,
			"remaining": gpuRemaining,
			"limit":     AIGPUOperations.Limit,
			"reset":     gpuReset.Unix(),
		},
	}, nil
}
