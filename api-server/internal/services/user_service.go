// internal/service/user_service.go
package services

//go:generate mockery --name=UserService --output=./mocks --case=underscore

import (
	"context"
	"database/sql"
	"errors"
	"fmt"

	"github.com/google/uuid"
	"github.com/ifeanyidike/cenphi/internal/middleware"
	"github.com/ifeanyidike/cenphi/internal/models"
	"github.com/ifeanyidike/cenphi/internal/repositories"
	"go.uber.org/zap"
)

type UserService interface {
	GetUser(ctx context.Context, id uuid.UUID) (*models.User, error)
	FindByUID(ctx context.Context) (*models.User, error)
	RegisterUser(ctx context.Context, user *models.User) error
	UpdateUser(ctx context.Context, uid string, updates map[string]any) error
	GetWorkspaceByUser(ctx context.Context) (models.Workspace, error)
	GetWorkspaceDataByUser(ctx context.Context) (*models.GetWorkspaceDataParam, error)
}

type userService struct {
	repo   repositories.Repo
	db     *sql.DB
	logger *zap.Logger
}

func NewUserService(repo repositories.Repo, db *sql.DB, logger *zap.Logger) UserService {
	return &userService{repo: repo, db: db, logger: logger}
}

func (s *userService) GetUser(ctx context.Context, id uuid.UUID) (*models.User, error) {
	user, err := s.repo.User().GetByID(ctx, id, s.db)
	if err != nil || user == nil {
		return nil, errors.New("user not found")
	}
	return user, nil
}

func (s *userService) FindByUID(ctx context.Context) (*models.User, error) {
	uid, err := middleware.GetUserFromContext(ctx)
	if err != nil {
		s.logger.Error("❌ Failed to get user from context", zap.Error(err))
		return nil, fmt.Errorf("user is not authorized to access resource: %w", err)
	}
	user, err := s.repo.User().FindByUID(ctx, uid, s.db)
	if err != nil || user == nil {
		return nil, errors.New("user not found")
	}
	return user, nil
}

func (s *userService) RegisterUser(ctx context.Context, user *models.User) error {
	return s.repo.User().Create(ctx, user, s.db)
}

func (s *userService) UpdateUser(ctx context.Context, uid string, updates map[string]any) error {
	return s.repo.User().UpdateAnyByUid(ctx, updates, uid, s.db)
}

func (s *userService) GetWorkspaceByUser(ctx context.Context) (models.Workspace, error) {
	uid, err := middleware.GetUserFromContext(ctx)
	if err != nil {
		s.logger.Error("❌ Failed to get user from context", zap.Error(err))
		return models.Workspace{}, fmt.Errorf("user is not authorized to access resource: %w", err)
	}

	s.logger.Info("✅ Got user from context", zap.String("uid", uid))

	s.logger.Info("🔍 About to call GetWorkspaceIDByUID")
	return s.repo.User().GetWorkspaceByUID(ctx, uid, s.db)
}

func (s *userService) GetWorkspaceDataByUser(ctx context.Context) (*models.GetWorkspaceDataParam, error) {
	workspace, err := s.GetWorkspaceByUser(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get workspace %s", err)
	}

	fmt.Println("workspace id", workspace.ID)
	result := models.GetWorkspaceDataParam{
		Workspace:    workspace,
		Testimonials: nil,
	}

	if workspace.TotalTestimonials > 0 {
		// Use lightweight query for dashboard performance - exclude artifacts
		filter := models.TestimonialFilter{
			ExcludeArtifacts: true,
			Limit:            50,
		}
		if testimonials, err := s.repo.Testimonial().FetchByWorkspaceID(ctx, workspace.ID, filter, s.db); err != nil {
			s.logger.Error("fetch testimonial in user workspace failed", zap.Error(err))
			return &result, nil
		} else {
			result.Testimonials = testimonials
		}
	}

	return &result, nil
}
