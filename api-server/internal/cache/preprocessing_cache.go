// api-server/internal/cache/preprocessing_cache.go
package cache

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/google/uuid"
	"go.uber.org/zap"
)

// BaseProcessedAsset represents a preprocessed testimonial ready for platform derivation
type BaseProcessedAsset struct {
	TestimonialID      uuid.UUID              `json:"testimonial_id"`
	ProcessedURL       string                 `json:"processed_url"`        // Cloud storage URL of base processed video
	ProcessedAt        time.Time              `json:"processed_at"`
	Duration           float64                `json:"duration"`
	Width              int                    `json:"width"`
	Height             int                    `json:"height"`
	HasNoiseRemoval    bool                   `json:"has_noise_removal"`
	HasColorCorrection bool                   `json:"has_color_correction"`
	HasNormalization   bool                   `json:"has_normalization"`
	TranscriptSegments []TranscriptSegment    `json:"transcript_segments"`
	Metadata           map[string]interface{} `json:"metadata"`
}

// TranscriptSegment represents a single transcript segment
type TranscriptSegment struct {
	StartTime float64 `json:"start_time"`
	EndTime   float64 `json:"end_time"`
	Text      string  `json:"text"`
}

// PreprocessingCache manages cached base processed assets
type PreprocessingCache struct {
	redis  *RedisCache
	logger *zap.Logger
}

// NewPreprocessingCache creates a new preprocessing cache
func NewPreprocessingCache(redis *RedisCache, logger *zap.Logger) *PreprocessingCache {
	return &PreprocessingCache{
		redis:  redis,
		logger: logger,
	}
}

// GetBaseAsset retrieves a cached base processed asset
func (pc *PreprocessingCache) GetBaseAsset(ctx context.Context, testimonialID uuid.UUID) (*BaseProcessedAsset, bool) {
	cacheKey := pc.getBaseAssetKey(testimonialID)

	var asset BaseProcessedAsset
	err := pc.redis.Get(ctx, cacheKey, &asset)
	if err != nil {
		// Cache miss or error
		return nil, false
	}

	pc.logger.Info("Cache hit for base processed asset",
		zap.String("testimonial_id", testimonialID.String()),
		zap.String("processed_url", asset.ProcessedURL))

	return &asset, true
}

// SetBaseAsset caches a base processed asset
func (pc *PreprocessingCache) SetBaseAsset(ctx context.Context, asset *BaseProcessedAsset) error {
	cacheKey := pc.getBaseAssetKey(asset.TestimonialID)

	// Cache for 24 hours
	ttl := 24 * time.Hour

	err := pc.redis.SetWithTTL(ctx, cacheKey, asset, ttl)
	if err != nil {
		return fmt.Errorf("failed to cache base asset: %w", err)
	}

	pc.logger.Info("Cached base processed asset",
		zap.String("testimonial_id", asset.TestimonialID.String()),
		zap.String("cache_key", cacheKey),
		zap.Duration("ttl", ttl))

	return nil
}

// InvalidateBaseAsset removes a cached base asset (e.g., when testimonial is updated)
func (pc *PreprocessingCache) InvalidateBaseAsset(ctx context.Context, testimonialID uuid.UUID) error {
	cacheKey := pc.getBaseAssetKey(testimonialID)

	err := pc.redis.Delete(ctx, cacheKey)
	if err != nil {
		return fmt.Errorf("failed to invalidate base asset: %w", err)
	}

	pc.logger.Info("Invalidated base processed asset",
		zap.String("testimonial_id", testimonialID.String()))

	return nil
}

// GetPlatformDerivative retrieves a cached platform-specific derivative
func (pc *PreprocessingCache) GetPlatformDerivative(ctx context.Context, testimonialID uuid.UUID, platform string, aspectRatio string) (*PlatformDerivative, bool) {
	cacheKey := pc.getDerivativeKey(testimonialID, platform, aspectRatio)

	var derivative PlatformDerivative
	err := pc.redis.Get(ctx, cacheKey, &derivative)
	if err != nil {
		return nil, false
	}

	pc.logger.Info("Cache hit for platform derivative",
		zap.String("testimonial_id", testimonialID.String()),
		zap.String("platform", platform),
		zap.String("aspect_ratio", aspectRatio))

	return &derivative, true
}

// SetPlatformDerivative caches a platform-specific derivative
func (pc *PreprocessingCache) SetPlatformDerivative(ctx context.Context, derivative *PlatformDerivative) error {
	cacheKey := pc.getDerivativeKey(derivative.TestimonialID, derivative.Platform, derivative.AspectRatio)

	// Cache for 12 hours (shorter than base asset)
	ttl := 12 * time.Hour

	err := pc.redis.SetWithTTL(ctx, cacheKey, derivative, ttl)
	if err != nil {
		return fmt.Errorf("failed to cache platform derivative: %w", err)
	}

	pc.logger.Info("Cached platform derivative",
		zap.String("testimonial_id", derivative.TestimonialID.String()),
		zap.String("platform", derivative.Platform),
		zap.Duration("ttl", ttl))

	return nil
}

// PlatformDerivative represents a platform-specific optimized video
type PlatformDerivative struct {
	TestimonialID uuid.UUID              `json:"testimonial_id"`
	Platform      string                 `json:"platform"`
	AspectRatio   string                 `json:"aspect_ratio"`
	OutputURL     string                 `json:"output_url"`
	ProcessedAt   time.Time              `json:"processed_at"`
	Duration      float64                `json:"duration"`
	Width         int                    `json:"width"`
	Height        int                    `json:"height"`
	Metadata      map[string]interface{} `json:"metadata"`
}

// Helper methods for cache key generation
func (pc *PreprocessingCache) getBaseAssetKey(testimonialID uuid.UUID) string {
	return fmt.Sprintf("base_processed:%s", testimonialID.String())
}

func (pc *PreprocessingCache) getDerivativeKey(testimonialID uuid.UUID, platform, aspectRatio string) string {
	return fmt.Sprintf("platform_derivative:%s:%s:%s", testimonialID.String(), platform, aspectRatio)
}

// GetCacheStats returns statistics about cached assets
func (pc *PreprocessingCache) GetCacheStats(ctx context.Context) (map[string]int, error) {
	stats := make(map[string]int)

	// Count base assets
	baseKeys, err := pc.redis.GetKeys(ctx, "base_processed:*")
	if err != nil {
		return nil, fmt.Errorf("failed to get base asset keys: %w", err)
	}
	stats["base_assets"] = len(baseKeys)

	// Count derivatives
	derivativeKeys, err := pc.redis.GetKeys(ctx, "platform_derivative:*")
	if err != nil {
		return nil, fmt.Errorf("failed to get derivative keys: %w", err)
	}
	stats["derivatives"] = len(derivativeKeys)

	return stats, nil
}

// SerializeAsset serializes a base asset to JSON
func (pc *PreprocessingCache) SerializeAsset(asset *BaseProcessedAsset) ([]byte, error) {
	return json.Marshal(asset)
}

// DeserializeAsset deserializes a base asset from JSON
func (pc *PreprocessingCache) DeserializeAsset(data []byte) (*BaseProcessedAsset, error) {
	var asset BaseProcessedAsset
	err := json.Unmarshal(data, &asset)
	if err != nil {
		return nil, fmt.Errorf("failed to deserialize asset: %w", err)
	}
	return &asset, nil
}
