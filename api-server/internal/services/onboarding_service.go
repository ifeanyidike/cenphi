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
	StartOnboarding(ctx context.Context, uid string, workspace *models.Workspace, teamMember *models.TeamMember) (models.GetWorkspaceDataParam, error)
}

type onboardingService struct {
	db        *sql.DB
	logger    *zap.Logger
	repo      repositories.Repo
	aiService ai.AIServiceManager
}

type brandContextResult struct {
	brandContext *models.BrandContext
	err          error
}

func NewOnboardingService(db *sql.DB, logger *zap.Logger, repo repositories.Repo, aiService ai.AIServiceManager) OnboardingService {
	return &onboardingService{
		db:        db,
		logger:    logger,
		repo:      repo,
		aiService: aiService,
	}
}

func (s *onboardingService) StartOnboarding(ctx context.Context, uid string, workspace *models.Workspace, teamMember *models.TeamMember) (
	models.GetWorkspaceDataParam, error,
) {

	s.logger.Info("Starting onboarding process",
		zap.String("uid", uid),
		zap.String("workspace_name", workspace.Name))

	if s.repo == nil {
		return models.GetWorkspaceDataParam{}, fmt.Errorf("repository not initialized")
	}

	// Start brand context extraction if website URL provided
	var brandContextChan chan brandContextResult
	if workspace.WebsiteURL != "" {
		brandContextChan = make(chan brandContextResult, 1)
		go s.extractBrandContext(ctx, workspace.WebsiteURL, workspace.ID, brandContextChan)
	}

	// Start database transaction
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return models.GetWorkspaceDataParam{}, fmt.Errorf("failed to start transaction: %w", err)
	}

	// Ensure transaction is cleaned up
	var committed bool
	defer func() {
		if !committed {
			if rollbackErr := tx.Rollback(); rollbackErr != nil {
				s.logger.Error("Failed to rollback transaction", zap.Error(rollbackErr))
			}
		}
	}()

	// Get the user
	user, err := s.repo.User().FindByUID(ctx, uid, tx)
	if err != nil {
		s.logger.Error("Failed to get user", zap.Error(err), zap.String("uid", uid))
		return models.GetWorkspaceDataParam{}, fmt.Errorf("user not found: %w", err)
	}

	if user == nil {
		s.logger.Error("User not found", zap.String("uid", uid))
		return models.GetWorkspaceDataParam{}, fmt.Errorf("user not found: %s", uid)
	}

	// Check if team member already exists
	existingMember, err := s.repo.TeamMember().GetDataByUserID(ctx, user.ID, tx)
	if err == nil && existingMember != nil {
		s.logger.Error("Team member already exists", zap.String("user_id", user.ID.String()))
		return models.GetWorkspaceDataParam{}, fmt.Errorf("team member already exists for user: %s", user.ID.String())
	}

	// Generate workspace ID if not provided
	if workspace.ID == uuid.Nil {
		workspace.ID = uuid.New()
	}

	// Handle brand context extraction with timeout
	if brandContextChan != nil {
		brandCtx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
		defer cancel()

		select {
		case result := <-brandContextChan:
			if result.err != nil {
				s.logger.Warn("Brand extraction failed, proceeding without it",
					zap.Error(result.err),
					zap.String("workspace_id", workspace.ID.String()))
			} else if result.brandContext != nil {
				brandContextJSON, marshalErr := json.Marshal(result.brandContext)
				if marshalErr != nil {
					s.logger.Error("Failed to marshal brand context",
						zap.Error(marshalErr),
						zap.String("workspace_id", workspace.ID.String()))
				} else {
					workspace.BrandContext = brandContextJSON
					if industry, ok := result.brandContext.ExtractedData["industry"].(string); ok {
						workspace.Industry = industry
					} else {
						workspace.Industry = ""
					}
				}
			} else {
				s.logger.Warn("Brand context extraction returned nil context",
					zap.String("workspace_id", workspace.ID.String()))
			}

		case <-brandCtx.Done():
			s.logger.Warn("Brand context extraction timed out, proceeding without it",
				zap.String("workspace_id", workspace.ID.String()))
			go s.handleDelayedBrandContext(workspace.ID, brandContextChan)
		}
	}
	// Create the workspace
	err = s.repo.Workspace().Create(ctx, workspace, tx)
	if err != nil {
		s.logger.Error("Failed to create workspace", zap.Error(err))
		return models.GetWorkspaceDataParam{}, fmt.Errorf("failed to create workspace: %w", err)
	}

	// Create the team member as owner
	if teamMember.ID == uuid.Nil {
		teamMember.ID = uuid.New()
	}

	teamMember.UserID = user.ID
	teamMember.WorkspaceID = workspace.ID
	teamMember.Role = models.Owner
	teamMember.CreatedAt = time.Now()
	teamMember.UpdatedAt = time.Now()

	err = s.repo.TeamMember().Create(ctx, teamMember, tx)
	if err != nil {
		s.logger.Error("Failed to create team member", zap.Error(err))
		return models.GetWorkspaceDataParam{}, fmt.Errorf("failed to create team member: %w", err)
	}

	// Commit the transaction
	if err = tx.Commit(); err != nil {
		s.logger.Error("Failed to commit transaction", zap.Error(err))
		return models.GetWorkspaceDataParam{}, fmt.Errorf("failed to commit transaction: %w", err)
	}
	committed = true

	s.logger.Info("Workspace and team member created successfully",
		zap.String("workspace_id", workspace.ID.String()),
		zap.String("team_member_id", teamMember.ID.String()))

	return models.GetWorkspaceDataParam{
		Workspace:    *workspace,
		Testimonials: nil,
	}, nil
}

func (s *onboardingService) extractBrandContext(ctx context.Context, websiteURL string, workspaceID uuid.UUID, brandContextChan chan<- brandContextResult) {
	defer func() {
		if r := recover(); r != nil {
			s.logger.Error("Panic recovered in brand context extraction",
				zap.Any("panic", r),
				zap.String("workspace_id", workspaceID.String()),
				zap.String("website_url", websiteURL))

			select {
			case brandContextChan <- brandContextResult{
				brandContext: nil,
				err:          fmt.Errorf("brand context extraction panicked: %v", r),
			}:
			default:
			}
		}
		close(brandContextChan)
	}()

	s.logger.Info("Starting brand context extraction",
		zap.String("workspace_id", workspaceID.String()),
		zap.String("website_url", websiteURL))

	extractCtx, cancel := context.WithTimeout(ctx, 60*time.Second)
	defer cancel()

	if websiteURL == "" {
		brandContextChan <- brandContextResult{
			brandContext: nil,
			err:          fmt.Errorf("empty website URL provided"),
		}
		return
	}

	// Perform the brand context extraction
	bc, err := s.aiService.BrandContextService.ExtractBrandContext(extractCtx, websiteURL, workspaceID)

	result := brandContextResult{
		brandContext: &bc,
		err:          err,
	}

	if err != nil {
		s.logger.Warn("Brand context extraction failed",
			zap.Error(err),
			zap.String("workspace_id", workspaceID.String()),
			zap.String("website_url", websiteURL))
		result.brandContext = nil
	} else {
		s.logger.Info("Brand context extraction completed successfully",
			zap.String("workspace_id", workspaceID.String()),
			zap.String("website_url", websiteURL),
			zap.String("about_info", bc.AboutInfo),
			zap.Strings("keywords", bc.Keywords),
			zap.String("tone", bc.Tone),
			zap.String("logo_url", bc.LogoURL),
			zap.String("tagline", bc.Tagline),
			zap.String("target_audience", bc.TargetAudience),
			zap.String("business_model", bc.BusinessModel),
			zap.String("company_size", bc.CompanySize))
	}

	// Send result to channel
	select {
	case brandContextChan <- result:
	case <-extractCtx.Done():
		s.logger.Warn("Brand context extraction context cancelled",
			zap.String("workspace_id", workspaceID.String()))
	}
}

func (s *onboardingService) handleDelayedBrandContext(workspaceID uuid.UUID, resultChan <-chan brandContextResult) {
	defer func() {
		if r := recover(); r != nil {
			s.logger.Error("Panic recovered in delayed brand context handling",
				zap.Any("panic", r),
				zap.String("workspace_id", workspaceID.String()))
		}
	}()

	s.logger.Info("Starting delayed brand context extraction",
		zap.String("workspace_id", workspaceID.String()))

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
	defer cancel()

	select {
	case result, ok := <-resultChan:
		if !ok {
			s.logger.Warn("Brand context result channel was closed",
				zap.String("workspace_id", workspaceID.String()))
			return
		}

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
			s.logger.Error("Failed to marshal brand context in delayed processing",
				zap.Error(err),
				zap.String("workspace_id", workspaceID.String()))
			return
		}
		fmt.Println("SAVING BRAND CONTEXT", string(brandContextJSON))
		updates := map[string]any{
			"brand_context": string(brandContextJSON),
			"updated_at":    time.Now(),
		}

		err = s.repo.Workspace().UpdateAny(ctx, workspaceID, updates, s.db)
		if err != nil {
			s.logger.Error("Failed to update workspace with delayed brand context",
				zap.Error(err),
				zap.String("workspace_id", workspaceID.String()))
			return
		}

		s.logger.Info("Successfully updated workspace with delayed brand context",
			zap.String("workspace_id", workspaceID.String()))

	case <-ctx.Done():
		s.logger.Warn("Delayed brand context extraction timed out",
			zap.String("workspace_id", workspaceID.String()))
		return
	}
}
