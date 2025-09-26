// internal/service/testimonial_service.go
package services

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/ifeanyidike/cenphi/internal/middleware"
	"github.com/ifeanyidike/cenphi/internal/models"
	"github.com/ifeanyidike/cenphi/internal/repositories"
	"github.com/ifeanyidike/cenphi/internal/storage"
	"github.com/redis/go-redis/v9"
	"go.uber.org/zap"
)

type TestimonialService struct {
	repo           repositories.TestimonialRepository
	userRepo       repositories.UserRepository
	storageService *storage.StorageFactory
	db             *sql.DB
	redis          *redis.Client
	logger         *zap.Logger
}

func NewTestimonialService(
	repo repositories.TestimonialRepository,
	userRepo repositories.UserRepository,
	storageService *storage.StorageFactory,
	db *sql.DB,
	redis *redis.Client,
	logger *zap.Logger,
) TestimonialService {
	return TestimonialService{
		repo:           repo,
		userRepo:       userRepo,
		storageService: storageService,
		db:             db,
		redis:          redis,
		logger:         logger,
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

	fmt.Println("workspace id after", workspaceID)

	testimonial, err := s.repo.FetchByTestimonialAndWorkspaceID(ctx, id, workspaceID, s.db)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("testimonial not found")
		}
		s.logger.Error("Failed to get testimonial", zap.Error(err), zap.String("id", id.String()))
		return nil, fmt.Errorf("failed to get testimonial: %w", err)
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

	testimonials, err := s.repo.FetchByWorkspaceID(ctx, workspaceID, filter, s.db)
	if err != nil {
		s.logger.Error("Failed to get testimonials for workspace",
			zap.Error(err),
			zap.String("workspace_id", workspaceID.String()))
		return nil, fmt.Errorf("failed to get testimonials: %w", err)
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

	s.logger.Info("Testimonial updated successfully", zap.String("id", testimonial.ID.String()))
	return nil
}

func (s *TestimonialService) DeleteTestimonial(ctx context.Context, id uuid.UUID) error {
	// Check if testimonial exists
	_, err := s.GetTestimonialByID(ctx, id)
	if err != nil {
		return err
	}

	err = s.repo.Delete(ctx, id, s.db)
	if err != nil {
		s.logger.Error("Failed to delete testimonial", zap.Error(err))
		return fmt.Errorf("failed to delete testimonial: %w", err)
	}

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

	err := s.repo.BulkDelete(ctx, testimonialIDs, s.db)
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
