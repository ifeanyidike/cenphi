// internal/service/testimonial_service.go
package services

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/ifeanyidike/cenphi/internal/ai"
	"github.com/ifeanyidike/cenphi/internal/middleware"
	"github.com/ifeanyidike/cenphi/internal/models"
	"github.com/ifeanyidike/cenphi/internal/repositories"
	"github.com/ifeanyidike/cenphi/internal/storage"
	"github.com/ifeanyidike/cenphi/internal/vector_store"
	"github.com/ifeanyidike/cenphi/pb"
	"github.com/redis/go-redis/v9"
	"go.uber.org/zap"
)

type TestimonialService struct {
	repo               repositories.TestimonialRepository
	userRepo           repositories.UserRepository
	storageService     *storage.StorageFactory
	vectorStoreService *vector_store.VectorStoreService
	mediaIntelligence  ai.MediaIntelligence
	db                 *sql.DB
	redis              *redis.Client
	logger             *zap.Logger
}

func NewTestimonialService(
	repo repositories.TestimonialRepository,
	userRepo repositories.UserRepository,
	storageService *storage.StorageFactory,
	vectorStoreService *vector_store.VectorStoreService,
	mediaIntelligence ai.MediaIntelligence,
	db *sql.DB,
	redis *redis.Client,
	logger *zap.Logger,
) TestimonialService {
	return TestimonialService{
		repo:               repo,
		userRepo:           userRepo,
		storageService:     storageService,
		vectorStoreService: vectorStoreService,
		mediaIntelligence:  mediaIntelligence,
		db:                 db,
		redis:              redis,
		logger:             logger,
	}
}

func (s *TestimonialService) GetTestimonialByID(ctx context.Context, id uuid.UUID) (*models.Testimonial, error) {
	uid, err := middleware.GetUserFromContext(ctx)
	if err != nil {
		return nil, fmt.Errorf("user is not authorized to acccess resource %w", err)
	}

	workspaceID, err := s.userRepo.GetWorkspaceIDByUID(ctx, uid, s.db)
	if err != nil {
		return nil, fmt.Errorf("failed to get the workspace ID %w", err)
	}

	// Try to get from cache first
	cacheKey := fmt.Sprintf("testimonial:%s:%s", workspaceID.String(), id.String())
	cached, err := s.getTestimonialFromCache(ctx, cacheKey)
	if err == nil {
		s.logger.Debug("Cache hit for testimonial", zap.String("id", id.String()))
		return cached, nil
	}

	fmt.Println("workspace id after", workspaceID)

	testimonial, err := s.repo.FetchByTestimonialAndWorkspaceID(context.Background(), id, workspaceID, s.db)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("testimonial not found")
		}
		s.logger.Error("Failed to get testimonial", zap.Error(err), zap.String("id", id.String()))
		return nil, fmt.Errorf("failed to get testimonial: %w", err)
	}

	// Cache the testimonial for 5 minutes
	if err := s.cacheTestimonial(ctx, cacheKey, testimonial, 5*time.Minute); err != nil {
		s.logger.Warn("Failed to cache testimonial", zap.Error(err), zap.String("id", id.String()))
	}

	return testimonial, nil
}

func (s *TestimonialService) GetTestimonialsByWorkspace(ctx context.Context, filter models.TestimonialFilter) ([]models.Testimonial, error) {
	// Set default limit if not provided
	s.logger.Info("🔍 Starting GetTestimonialsByWorkspace")

	uid, err := middleware.GetUserFromContext(ctx)
	if err != nil {
		s.logger.Error("❌ Failed to get user from context", zap.Error(err))
		return nil, fmt.Errorf("user is not authorized to access resource: %w", err)
	}

	s.logger.Info("✅ Got user from context", zap.String("uid", uid))

	s.logger.Info("🔍 About to call GetWorkspaceIDByUID")
	workspaceID, err := s.userRepo.GetWorkspaceIDByUID(ctx, uid, s.db)
	if err != nil {
		s.logger.Error("❌ GetWorkspaceIDByUID failed", zap.String("uid", uid), zap.Error(err))
		return nil, fmt.Errorf("failed to get the workspace ID: %w", err)
	}

	s.logger.Info("✅ Got workspace ID", zap.String("workspace_id", workspaceID.String()))

	if filter.Limit == 0 {
		filter.Limit = 50
	}

	// Try to get from cache first (only for lightweight queries without artifacts)
	var cacheKey string
	if filter.ExcludeArtifacts {
		// Generate cache key based on filter parameters
		cacheKey = fmt.Sprintf("testimonials:list:%s:exclude_artifacts:limit_%d:offset_%d",
			workspaceID.String(), filter.Limit, filter.Offset)

		// Try cache
		cached, err := s.getTestimonialsListFromCache(ctx, cacheKey)
		if err == nil {
			s.logger.Debug("Cache hit for testimonials list",
				zap.String("workspace_id", workspaceID.String()),
				zap.Int("count", len(cached)))
			return cached, nil
		}
	}

	testimonials, err := s.repo.FetchByWorkspaceID(ctx, workspaceID, filter, s.db)
	if err != nil {
		s.logger.Error("Failed to get testimonials for workspace",
			zap.Error(err),
			zap.String("workspace_id", workspaceID.String()))
		return nil, fmt.Errorf("failed to get testimonials: %w", err)
	}

	// Cache lightweight results for 3 minutes
	if filter.ExcludeArtifacts && cacheKey != "" {
		if err := s.cacheTestimonialsList(ctx, cacheKey, testimonials, 3*time.Minute); err != nil {
			s.logger.Warn("Failed to cache testimonials list",
				zap.Error(err),
				zap.String("workspace_id", workspaceID.String()))
		}
	}

	return testimonials, nil
}

func (s *TestimonialService) UpdateTestimonial(ctx context.Context, testimonial *models.Testimonial) error {
	// Validate required fields
	if err := s.validateTestimonial(testimonial); err != nil {
		return fmt.Errorf("validation failed: %w", err)
	}

	testimonial.UpdatedAt = time.Now()

	err := s.repo.Update(ctx, testimonial, testimonial.ID, s.db)
	if err != nil {
		s.logger.Error("Failed to update testimonial", zap.Error(err))
		return fmt.Errorf("failed to update testimonial: %w", err)
	}

	// Invalidate caches
	s.invalidateTestimonialCaches(ctx, testimonial.WorkspaceID, testimonial.ID)

	s.logger.Info("Testimonial updated successfully", zap.String("id", testimonial.ID.String()))
	return nil
}

func (s *TestimonialService) DeleteTestimonial(ctx context.Context, id uuid.UUID) error {
	// Check if testimonial exists and get full data for vector store cleanup
	testimonial, err := s.GetTestimonialByID(ctx, id)
	if err != nil {
		return err
	}

	// Delete from vector store first (before deleting from database)
	if s.vectorStoreService != nil {
		err = s.vectorStoreService.DeleteTestimonialFromVectorStore(ctx, testimonial)
		if err != nil {
			s.logger.Warn("Failed to delete testimonial from vector store, continuing with database deletion",
				zap.String("testimonial_id", id.String()),
				zap.Error(err))
			// Don't return error to prevent blocking testimonial deletion
		}
	}

	// Delete from database
	err = s.repo.Delete(ctx, id, s.db)
	if err != nil {
		s.logger.Error("Failed to delete testimonial", zap.Error(err))
		return fmt.Errorf("failed to delete testimonial: %w", err)
	}

	// Invalidate caches
	s.invalidateTestimonialCaches(ctx, testimonial.WorkspaceID, id)

	s.logger.Info("Testimonial deleted successfully", zap.String("id", id.String()))
	return nil
}

func (s *TestimonialService) SearchTestimonials(ctx context.Context, workspaceID uuid.UUID, query string, filter models.TestimonialFilter) ([]*models.Testimonial, error) {
	if query == "" {
		return nil, fmt.Errorf("search query cannot be empty")
	}

	// Set default limit if not provided
	if filter.Limit == 0 {
		filter.Limit = 50
	}

	testimonials, err := s.repo.Search(ctx, workspaceID, query, filter, s.db)
	if err != nil {
		s.logger.Error("Failed to search testimonials",
			zap.Error(err),
			zap.String("workspace_id", workspaceID.String()),
			zap.String("query", query))
		return nil, err
	}

	return testimonials, nil
}

func (s *TestimonialService) BulkDelete(ctx context.Context, testimonialIDs []uuid.UUID) error {
	if len(testimonialIDs) == 0 {
		return fmt.Errorf("no testimonial IDs provided")
	}

	// Get workspace ID for cache invalidation
	uid, err := middleware.GetUserFromContext(ctx)
	if err == nil {
		workspaceID, err := s.userRepo.GetWorkspaceIDByUID(ctx, uid, s.db)
		if err == nil {
			// Invalidate all list caches for this workspace
			pattern := fmt.Sprintf("testimonials:list:%s:*", workspaceID.String())
			iter := s.redis.Scan(ctx, 0, pattern, 0).Iterator()
			for iter.Next(ctx) {
				if err := s.redis.Del(ctx, iter.Val()).Err(); err != nil {
					s.logger.Warn("Failed to delete cached key",
						zap.Error(err),
						zap.String("key", iter.Val()))
				}
			}

			// Invalidate individual testimonial caches
			for _, id := range testimonialIDs {
				cacheKey := fmt.Sprintf("testimonial:%s:%s", workspaceID.String(), id.String())
				if err := s.redis.Del(ctx, cacheKey).Err(); err != nil {
					s.logger.Warn("Failed to invalidate testimonial cache",
						zap.Error(err),
						zap.String("cache_key", cacheKey))
				}
			}
		}
	}

	err = s.repo.BulkDelete(ctx, testimonialIDs, s.db)
	if err != nil {
		s.logger.Error("Failed to bulk delete testimonials",
			zap.Error(err),
			zap.Int("count", len(testimonialIDs)))
		return err
	}

	s.logger.Info("Testimonials deleted successfully",
		zap.Int("count", len(testimonialIDs)))

	return nil
}

// Helper Methods
func (s *TestimonialService) validateTestimonial(testimonial *models.Testimonial) error {
	if testimonial.WorkspaceID == uuid.Nil {
		return fmt.Errorf("workspace_id is required")
	}

	if testimonial.Type == "" {
		return fmt.Errorf("type is required")
	}

	if err := s.validateType(testimonial.Type); err != nil {
		return err
	}

	if testimonial.Status != "" {
		if err := s.validateStatus(testimonial.Status); err != nil {
			return err
		}
	}

	if testimonial.Rating != nil && (*testimonial.Rating < 1 || *testimonial.Rating > 5) {
		return fmt.Errorf("rating must be between 1 and 5")
	}

	// Type-specific validation
	switch testimonial.Type {
	case "text":
		if testimonial.Content == nil || *testimonial.Content == "" {
			return fmt.Errorf("content is required for text testimonials")
		}
	case "video", "audio":
		if testimonial.MediaURL == nil || *testimonial.MediaURL == "" {
			return fmt.Errorf("media_url is required for %s testimonials", testimonial.Type)
		}
	}

	return nil
}

func (s *TestimonialService) validateType(testimonialType string) error {
	validTypes := []string{"text", "video", "audio"}
	for _, validType := range validTypes {
		if testimonialType == validType {
			return nil
		}
	}
	return fmt.Errorf("invalid type: must be one of %v", validTypes)
}

func (s *TestimonialService) validateStatus(status string) error {
	validStatuses := []string{"draft", "published", "archived", "processing"}
	for _, validStatus := range validStatuses {
		if status == validStatus {
			return nil
		}
	}
	return fmt.Errorf("invalid status: must be one of %v", validStatuses)
}

// UploadToVectorStore uploads a testimonial to the vector store
func (s *TestimonialService) UploadToVectorStore(ctx context.Context, testimonial *models.Testimonial) error {
	if s.vectorStoreService == nil {
		return fmt.Errorf("vector store service not available")
	}

	err := s.vectorStoreService.UploadTestimonialToVectorStore(ctx, testimonial)
	if err != nil {
		s.logger.Error("Failed to upload testimonial to vector store",
			zap.Error(err),
			zap.String("testimonial_id", testimonial.ID.String()))
		return fmt.Errorf("failed to upload testimonial to vector store: %w", err)
	}

	s.logger.Info("Testimonial uploaded to vector store successfully",
		zap.String("testimonial_id", testimonial.ID.String()))
	return nil
}

// invalidateTestimonialCaches invalidates all caches related to a testimonial
func (s *TestimonialService) invalidateTestimonialCaches(ctx context.Context, workspaceID, testimonialID uuid.UUID) {
	// Invalidate specific testimonial cache
	cacheKey := fmt.Sprintf("testimonial:%s:%s", workspaceID.String(), testimonialID.String())
	if err := s.redis.Del(ctx, cacheKey).Err(); err != nil {
		s.logger.Warn("Failed to invalidate testimonial cache",
			zap.Error(err),
			zap.String("cache_key", cacheKey))
	}

	// Invalidate all list caches for this workspace
	pattern := fmt.Sprintf("testimonials:list:%s:*", workspaceID.String())
	iter := s.redis.Scan(ctx, 0, pattern, 0).Iterator()
	for iter.Next(ctx) {
		if err := s.redis.Del(ctx, iter.Val()).Err(); err != nil {
			s.logger.Warn("Failed to delete cached key",
				zap.Error(err),
				zap.String("key", iter.Val()))
		}
	}
	if err := iter.Err(); err != nil {
		s.logger.Warn("Failed to invalidate testimonials list cache pattern",
			zap.Error(err),
			zap.String("pattern", pattern))
	}
}

// getTestimonialFromCache retrieves a single testimonial from cache
func (s *TestimonialService) getTestimonialFromCache(ctx context.Context, key string) (*models.Testimonial, error) {
	val, err := s.redis.Get(ctx, key).Result()
	if err != nil {
		return nil, err
	}

	var testimonial models.Testimonial
	if err := json.Unmarshal([]byte(val), &testimonial); err != nil {
		return nil, fmt.Errorf("failed to unmarshal cached testimonial: %w", err)
	}

	return &testimonial, nil
}

// cacheTestimonial stores a testimonial in cache
func (s *TestimonialService) cacheTestimonial(ctx context.Context, key string, testimonial *models.Testimonial, expiration time.Duration) error {
	data, err := json.Marshal(testimonial)
	if err != nil {
		return fmt.Errorf("failed to marshal testimonial: %w", err)
	}

	return s.redis.Set(ctx, key, data, expiration).Err()
}

// getTestimonialsListFromCache retrieves a list of testimonials from cache
func (s *TestimonialService) getTestimonialsListFromCache(ctx context.Context, key string) ([]models.Testimonial, error) {
	val, err := s.redis.Get(ctx, key).Result()
	if err != nil {
		return nil, err
	}

	var testimonials []models.Testimonial
	if err := json.Unmarshal([]byte(val), &testimonials); err != nil {
		return nil, fmt.Errorf("failed to unmarshal cached testimonials: %w", err)
	}

	return testimonials, nil
}

// cacheTestimonialsList stores a list of testimonials in cache
func (s *TestimonialService) cacheTestimonialsList(ctx context.Context, key string, testimonials []models.Testimonial, expiration time.Duration) error {
	data, err := json.Marshal(testimonials)
	if err != nil {
		return fmt.Errorf("failed to marshal testimonials: %w", err)
	}

	return s.redis.Set(ctx, key, data, expiration).Err()
}

// GetPlatformRecommendation gets platform recommendations for a testimonial
// OPTIMIZED: Returns cached results from artifacts, never recomputes
func (s *TestimonialService) GetPlatformRecommendation(ctx context.Context, testimonialID uuid.UUID) (*pb.PlatformRecommendResponse, error) {
	// Get testimonial first
	testimonial, err := s.GetTestimonialByID(ctx, testimonialID)
	if err != nil {
		return nil, fmt.Errorf("failed to get testimonial: %w", err)
	}

	// Only video testimonials can get platform recommendations
	if testimonial.Type != "video" {
		return nil, fmt.Errorf("platform recommendations are only available for video testimonials")
	}

	// CRITICAL OPTIMIZATION: Only return cached artifact, never compute on-demand
	// Platform recommendations should be computed once during upload/processing
	cachedResp, err := s.getCachedPlatformRecommendations(ctx, testimonialID)
	if err != nil || cachedResp == nil {
		// Return empty response indicating recommendations not yet generated
		return &pb.PlatformRecommendResponse{
			PrimaryRecommendation: nil,
			AlternativePlatforms:  []*pb.PlatformRecommendation{},
		}, nil
	}

	return cachedResp, nil
}

// getCachedPlatformRecommendations retrieves platform recommendations from artifacts
func (s *TestimonialService) getCachedPlatformRecommendations(ctx context.Context, testimonialID uuid.UUID) (*pb.PlatformRecommendResponse, error) {
	// Use repository method to get cached data
	dataJSON, err := s.repo.GetCachedPlatformRecommendations(ctx, testimonialID, s.db)
	if err != nil {
		return nil, err
	}

	// Parse the JSON data
	var artifactData struct {
		PrimaryRecommendation *pb.PlatformRecommendation   `json:"primary_recommendation"`
		AlternativePlatforms  []*pb.PlatformRecommendation `json:"alternative_platforms"`
		ComputedAt            string                       `json:"computed_at"`
	}

	if err := json.Unmarshal(dataJSON, &artifactData); err != nil {
		return nil, fmt.Errorf("failed to unmarshal cached recommendations: %w", err)
	}

	return &pb.PlatformRecommendResponse{
		PrimaryRecommendation: artifactData.PrimaryRecommendation,
		AlternativePlatforms:  artifactData.AlternativePlatforms,
	}, nil
}

// Hook detection is now computed during upload/processing and cached in artifacts
// This endpoint only retrieves cached data, never triggers expensive AI computation

// GeneratePlatformRecommendations computes and saves platform recommendations (manual trigger)
func (s *TestimonialService) GeneratePlatformRecommendations(ctx context.Context, testimonialID uuid.UUID) (*pb.PlatformRecommendResponse, error) {
	testimonial, err := s.GetTestimonialByID(ctx, testimonialID)
	if err != nil {
		return nil, fmt.Errorf("failed to get testimonial: %w", err)
	}

	if testimonial.Type != "video" {
		return nil, fmt.Errorf("platform recommendations are only available for video testimonials")
	}

	// Extract required data
	mediaURL := ""
	if testimonial.MediaURL != nil {
		mediaURL = *testimonial.MediaURL
	}

	transcript := ""
	if testimonial.TranscriptSegments != nil && len(*testimonial.TranscriptSegments) > 0 {
		var transcriptParts []string
		for _, segment := range *testimonial.TranscriptSegments {
			transcriptParts = append(transcriptParts, segment.Text)
		}
		transcript = strings.Join(transcriptParts, " ")
	}

	industry := ""
	currentAspectRatio := ""
	fileSizeMB := 0.0
	duration := 0.0

	if testimonial.Metadata != nil {
		if ind, ok := testimonial.Metadata["industry"].(string); ok {
			industry = ind
		}
		if ar, ok := testimonial.Metadata["aspect_ratio"].(string); ok {
			currentAspectRatio = ar
		}
		if size, ok := testimonial.Metadata["file_size_mb"].(float64); ok {
			fileSizeMB = size
		}
		if dur, ok := testimonial.Metadata["duration"].(float64); ok {
			duration = dur
		}
	}

	// Call AI service
	req := &pb.PlatformRecommendRequest{
		TestimonialId:      testimonialID.String(),
		MediaUrl:           mediaURL,
		Transcript:         transcript,
		Industry:           industry,
		CurrentAspectRatio: currentAspectRatio,
		FileSizeMb:         fileSizeMB,
		Duration:           duration,
	}

	resp, err := s.mediaIntelligence.RecommendPlatforms(ctx, req)
	if err != nil {
		return nil, fmt.Errorf("failed to generate platform recommendations: %w", err)
	}

	// Save to artifacts table
	artifactData := map[string]interface{}{
		"primary_recommendation": resp.PrimaryRecommendation,
		"alternative_platforms":  resp.AlternativePlatforms,
		"computed_at":            time.Now().Format(time.RFC3339),
	}

	artifactJSON, err := json.Marshal(artifactData)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal artifact data: %w", err)
	}

	// Use repository method to save recommendations
	err = s.repo.SavePlatformRecommendations(ctx, testimonialID, testimonial.WorkspaceID, artifactJSON, s.db)
	if err != nil {
		s.logger.Warn("Failed to save platform recommendations artifact",
			zap.Error(err),
			zap.String("testimonial_id", testimonialID.String()))
		// Don't fail the request, just log the warning
	}

	return resp, nil
}
