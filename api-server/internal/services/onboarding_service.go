// internal/services/onboarding_service.go
package services

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/ifeanyidike/cenphi/internal/ai"
	"github.com/ifeanyidike/cenphi/internal/models"
	"github.com/ifeanyidike/cenphi/internal/repositories"
	"go.uber.org/zap"
)

type OnboardingService interface {
	OnboardOwner(ctx context.Context, uid string, workspace *models.Workspace, teamMember *models.TeamMember) error
}

type onboardingService struct {
	db        *sql.DB
	logger    *zap.Logger
	repo      repositories.Repo
	aiService ai.AIServiceManager
}

type OnboardingStatus struct {
	WorkspaceID            uuid.UUID `json:"workspace_id"`
	IsCompleted            bool      `json:"is_completed"`
	CurrentStep            string    `json:"current_step"`
	CompletedSteps         []string  `json:"completed_steps"`
	WorkspaceCreated       bool      `json:"workspace_created"`
	BrandContextCreated    bool      `json:"brand_context_created"`
	DefaultCampaignCreated bool      `json:"default_campaign_created"`
	TeamSetup              bool      `json:"team_setup"`
	WelcomeAssetsCreated   bool      `json:"welcome_assets_created"`
	CreatedAt              time.Time `json:"created_at"`
	UpdatedAt              time.Time `json:"updated_at"`
}

type brandContextResult struct {
	brandContext *models.BrandContext
	err          error
}

// Repository interface for onboarding operations
type Repository interface {
	User() repositories.UserRepository
	Workspace() repositories.WorkspaceRepository
	TeamMember() repositories.TeamMemberRepository
}

func NewOnboardingService(db *sql.DB, logger *zap.Logger, aiService ai.AIServiceManager) OnboardingService {
	return &onboardingService{
		db:        db,
		logger:    logger,
		aiService: aiService,
	}
}

func (s *onboardingService) OnboardOwner(ctx context.Context, uid string, workspace *models.Workspace, teamMember *models.TeamMember) error {
	s.logger.Info("Starting owner onboarding process",
		zap.String("uid", uid),
		zap.String("workspace_name", workspace.Name))

	var brandContextChan chan brandContextResult
	if workspace.WebsiteURL != "" {
		brandContextChan = make(chan brandContextResult, 1)
		go s.extractBrandContext(ctx, workspace.WebsiteURL, workspace.ID, brandContextChan)
	}

	// Start database transaction
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("failed to start transaction: %w", err)
	}
	defer tx.Rollback()

	// Get the user
	user, err := s.repo.User().FindByUID(ctx, uid, tx)
	if err != nil {
		s.logger.Error("Failed to get user", zap.Error(err), zap.String("uid", uid))
		return fmt.Errorf("user not found: %w", err)
	}

	if user == nil {
		s.logger.Error("User not found", zap.String("uid", uid))
		return fmt.Errorf("user not found: %s", uid)
	}

	// Check if team member already exists
	existingMember, err := s.repo.TeamMember().GetDataByUserID(ctx, user.ID, tx)
	if err == nil && existingMember != nil {
		s.logger.Error("Team member already exists", zap.String("user_id", user.ID.String()))
		return fmt.Errorf("team member already exists for user: %s", user.ID.String())
	}

	// Generate workspace ID if not provided
	if workspace.ID == uuid.Nil {
		workspace.ID = uuid.New()
	}

	// Set workspace defaults
	workspace.CreatedAt = time.Now()
	workspace.UpdatedAt = time.Now()

	if brandContextChan != nil {
		select {
		case result := <-brandContextChan:
			if result.err != nil {
				s.logger.Warn("Brand extraction failed, proceeding without it", zap.Error(result.err), zap.String("workspace_id", workspace.ID.String()))
			} else {
				context := result.brandContext
				if bc, err := json.Marshal(context); err != nil {
					workspace.BrandContext = bc
				}
			}

		default:
			s.logger.Info("Brand context extraction still in progress, will update later", zap.String("workspace_id", workspace.ID.String()))
			go s.handleDelayedBrandContext(workspace.ID, brandContextChan)
		}
	}

	// Create the workspace
	err = s.repo.Workspace().Create(ctx, workspace, tx)
	if err != nil {
		s.logger.Error("Failed to create workspace", zap.Error(err))
		return fmt.Errorf("failed to create workspace: %w", err)
	}

	// Create the team member as owner
	if teamMember.ID == uuid.Nil {
		teamMember.ID = uuid.New()
	}

	teamMember.UserID = user.ID
	teamMember.WorkspaceID = workspace.ID
	teamMember.Role = models.Owner // Set as owner
	teamMember.CreatedAt = time.Now()
	teamMember.UpdatedAt = time.Now()

	err = s.repo.TeamMember().Create(ctx, teamMember, tx)
	if err != nil {
		s.logger.Error("Failed to create team member", zap.Error(err))
		return fmt.Errorf("failed to create team member: %w", err)
	}

	// Commit the transaction
	if err := tx.Commit(); err != nil {
		s.logger.Error("Failed to commit transaction", zap.Error(err))
		return fmt.Errorf("failed to commit transaction: %w", err)
	}

	s.logger.Info("Workspace and team member created successfully",
		zap.String("workspace_id", workspace.ID.String()),
		zap.String("team_member_id", teamMember.ID.String()))

	return nil
}

func (s *onboardingService) extractBrandContext(ctx context.Context, websiteURL string, workspaceID uuid.UUID, brandContextChan chan<- brandContextResult) {
	defer close(brandContextChan)

	s.logger.Info("Starting concurrent brand context extraction",
		zap.String("workspace_id", workspaceID.String()),
		zap.String("website_url", websiteURL))

	bc, err := s.aiService.BrandContextService.ExtractBrandContext(ctx, websiteURL, workspaceID)
	brandContextChan <- brandContextResult{
		brandContext: &bc,
		err:          err,
	}
}

func (s *onboardingService) handleDelayedBrandContext(workspaceID uuid.UUID, resultChan <-chan brandContextResult) {
	ctx := context.Background() // we're using background context since context may have been cancelled.

	s.logger.Info("Waiting for delayed brand context extraction",
		zap.String("workspace_id", workspaceID.String()))

	// block until it completes
	result := <-resultChan

	if result.err != nil {
		s.logger.Error("Delayed brand context extraction failed",
			zap.Error(result.err),
			zap.String("workspace_id", workspaceID.String()))
		return
	}

	if result.brandContext == nil {
		s.logger.Warn("Delayed brand context extraction returned empty result",
			zap.String("workspace_id", workspaceID.String()))
		return
	}

	brandContextJSON, err := json.Marshal(result.brandContext)

	if err != nil {
		s.logger.Error("Failed to marshal brand context",
			zap.Error(err),
			zap.String("workspace_id", workspaceID.String()))
		return
	}
	updates := map[string]any{
		"brand_context": string(brandContextJSON),
	}

	err = s.repo.Workspace().UpdateAny(ctx, updates, workspaceID, s.db)
	if err != nil {
		s.logger.Error("Failed to update workspace brand context",
			zap.Error(err),
			zap.String("workspace_id", workspaceID.String()))
		return
	}

	s.logger.Info("Successfully updated workspace with delayed brand context",
		zap.String("workspace_id", workspaceID.String()))
}
