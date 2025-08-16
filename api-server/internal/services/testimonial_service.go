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

// type TestimonialService interface {
// 	GetTestimonialByID(ctx context.Context, id uuid.UUID) (*models.Testimonial, error)
// 	GetTestimonialsByWorkspace(ctx context.Context, workspaceID uuid.UUID, filter models.TestimonialFilter) ([]models.Testimonial, error)
// 	UpdateTestimonial(ctx context.Context, testimonial *models.Testimonial) error
// 	DeleteTestimonial(ctx context.Context, id uuid.UUID) error

// 	// Add these new methods to match the complete implementation:
// 	SearchTestimonials(ctx context.Context, workspaceID uuid.UUID, query string, filter models.TestimonialFilter) ([]*models.Testimonial, error)
// 	GetTestimonialStats(ctx context.Context, workspaceID uuid.UUID) (*models.TestimonialStats, error)
// 	GetTestimonialsByStatus(ctx context.Context, workspaceID uuid.UUID, status string, limit int) ([]models.Testimonial, error)
// 	GetTestimonialsByType(ctx context.Context, workspaceID uuid.UUID, testimonialType string, limit int) ([]models.Testimonial, error)
// 	GetTestimonialsByRating(ctx context.Context, workspaceID uuid.UUID, minRating int) ([]models.Testimonial, error)
// 	GetRecentTestimonials(ctx context.Context, workspaceID uuid.UUID, days int, limit int) ([]models.Testimonial, error)
// 	GetTestimonialsByAuthor(ctx context.Context, workspaceID uuid.UUID, authorEmail string) ([]models.Testimonial, error)

// 	// Bulk operations
// 	BulkUpdateStatus(ctx context.Context, testimonialIDs []uuid.UUID, status string) error
// 	BulkDelete(ctx context.Context, testimonialIDs []uuid.UUID) error

// 	// Analytics
// 	GetStatusCounts(ctx context.Context, workspaceID uuid.UUID) (map[string]int, error)
// 	GetTypeCounts(ctx context.Context, workspaceID uuid.UUID) (map[string]int, error)
// 	GetAverageRating(ctx context.Context, workspaceID uuid.UUID) (float64, error)
// 	GetTopAuthors(ctx context.Context, workspaceID uuid.UUID, limit int) ([]models.AuthorStats, error)
// }

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

	workspaceID, err := s.userRepo.GetWorkspaceByUID(ctx, uid, s.db)
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
	uid, err := middleware.GetUserFromContext(ctx)
	if err != nil {
		return nil, fmt.Errorf("user is not authorized to acccess resource %w", err)
	}

	workspaceID, err := s.userRepo.GetWorkspaceByUID(ctx, uid, s.db)
	if err != nil {
		return nil, fmt.Errorf("failed to get the workspace ID %w", err)
	}

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

	err := s.repo.Update(ctx, testimonial, s.db)
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

func (s *TestimonialService) GetTestimonialStats(ctx context.Context, workspaceID uuid.UUID) (*models.TestimonialStats, error) {
	stats, err := s.repo.GetStats(ctx, workspaceID, s.db)
	if err != nil {
		s.logger.Error("Failed to get testimonial stats",
			zap.Error(err),
			zap.String("workspace_id", workspaceID.String()))
		return nil, err
	}

	return stats, nil
}

func (s *TestimonialService) GetTestimonialsByStatus(ctx context.Context, workspaceID uuid.UUID, status string, limit int) ([]models.Testimonial, error) {
	if limit == 0 {
		limit = 50
	}

	testimonials, err := s.repo.GetByStatus(ctx, workspaceID, status, limit, s.db)
	if err != nil {
		s.logger.Error("Failed to get testimonials by status",
			zap.Error(err),
			zap.String("workspace_id", workspaceID.String()),
			zap.String("status", status))
		return nil, err
	}

	return testimonials, nil
}

func (s *TestimonialService) GetTestimonialsByType(ctx context.Context, workspaceID uuid.UUID, testimonialType string, limit int) ([]models.Testimonial, error) {
	if limit == 0 {
		limit = 50
	}

	testimonials, err := s.repo.GetByType(ctx, workspaceID, testimonialType, limit, s.db)
	if err != nil {
		s.logger.Error("Failed to get testimonials by type",
			zap.Error(err),
			zap.String("workspace_id", workspaceID.String()),
			zap.String("type", testimonialType))
		return nil, err
	}

	return testimonials, nil
}

func (s *TestimonialService) GetTestimonialsByRating(ctx context.Context, workspaceID uuid.UUID, minRating int) ([]models.Testimonial, error) {
	if minRating < 1 || minRating > 5 {
		return nil, fmt.Errorf("rating must be between 1 and 5")
	}

	testimonials, err := s.repo.GetByRating(ctx, workspaceID, minRating, s.db)
	if err != nil {
		s.logger.Error("Failed to get testimonials by rating",
			zap.Error(err),
			zap.String("workspace_id", workspaceID.String()),
			zap.Int("min_rating", minRating))
		return nil, err
	}

	return testimonials, nil
}

func (s *TestimonialService) GetRecentTestimonials(ctx context.Context, workspaceID uuid.UUID, days int, limit int) ([]models.Testimonial, error) {
	if days <= 0 {
		days = 30
	}
	if limit == 0 {
		limit = 50
	}

	testimonials, err := s.repo.GetRecent(ctx, workspaceID, days, limit, s.db)
	if err != nil {
		s.logger.Error("Failed to get recent testimonials",
			zap.Error(err),
			zap.String("workspace_id", workspaceID.String()),
			zap.Int("days", days))
		return nil, err
	}

	return testimonials, nil
}

func (s *TestimonialService) GetTestimonialsByAuthor(ctx context.Context, workspaceID uuid.UUID, authorEmail string) ([]models.Testimonial, error) {
	if authorEmail == "" {
		return nil, fmt.Errorf("author email cannot be empty")
	}

	testimonials, err := s.repo.GetByAuthor(ctx, workspaceID, authorEmail, s.db)
	if err != nil {
		s.logger.Error("Failed to get testimonials by author",
			zap.Error(err),
			zap.String("workspace_id", workspaceID.String()),
			zap.String("author_email", authorEmail))
		return nil, err
	}

	return testimonials, nil
}

// Bulk operations
func (s *TestimonialService) BulkUpdateStatus(ctx context.Context, testimonialIDs []uuid.UUID, status string) error {
	if len(testimonialIDs) == 0 {
		return fmt.Errorf("no testimonial IDs provided")
	}

	err := s.repo.BulkUpdateStatus(ctx, testimonialIDs, status, s.db)
	if err != nil {
		s.logger.Error("Failed to bulk update testimonial status",
			zap.Error(err),
			zap.String("status", status),
			zap.Int("count", len(testimonialIDs)))
		return err
	}

	s.logger.Info("Testimonials status updated successfully",
		zap.String("status", status),
		zap.Int("count", len(testimonialIDs)))

	return nil
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

// Analytics methods
func (s *TestimonialService) GetStatusCounts(ctx context.Context, workspaceID uuid.UUID) (map[string]int, error) {
	counts, err := s.repo.GetCountByStatus(ctx, workspaceID, s.db)
	if err != nil {
		s.logger.Error("Failed to get status counts",
			zap.Error(err),
			zap.String("workspace_id", workspaceID.String()))
		return nil, err
	}

	return counts, nil
}

func (s *TestimonialService) GetTypeCounts(ctx context.Context, workspaceID uuid.UUID) (map[string]int, error) {
	counts, err := s.repo.GetCountByType(ctx, workspaceID, s.db)
	if err != nil {
		s.logger.Error("Failed to get type counts",
			zap.Error(err),
			zap.String("workspace_id", workspaceID.String()))
		return nil, err
	}

	return counts, nil
}

func (s *TestimonialService) GetAverageRating(ctx context.Context, workspaceID uuid.UUID) (float64, error) {
	avgRating, err := s.repo.GetAverageRating(ctx, workspaceID, s.db)
	if err != nil {
		s.logger.Error("Failed to get average rating",
			zap.Error(err),
			zap.String("workspace_id", workspaceID.String()))
		return 0, err
	}

	return avgRating, nil
}

func (s *TestimonialService) GetTopAuthors(ctx context.Context, workspaceID uuid.UUID, limit int) ([]models.AuthorStats, error) {
	if limit == 0 {
		limit = 10
	}

	authors, err := s.repo.GetTopAuthors(ctx, workspaceID, limit, s.db)
	if err != nil {
		s.logger.Error("Failed to get top authors",
			zap.Error(err),
			zap.String("workspace_id", workspaceID.String()))
		return nil, err
	}

	return authors, nil
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
