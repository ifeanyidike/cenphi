// internal/service/workspace_service.go
package services

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/ifeanyidike/cenphi/internal/models"
	"github.com/ifeanyidike/cenphi/internal/repositories"
	"github.com/ifeanyidike/cenphi/internal/storage"
	"github.com/redis/go-redis/v9"
	"go.uber.org/zap"
)

// type WorkspaceService interface {
// 	CreateWorkspace(ctx context.Context, workspace *models.Workspace) error
// 	GetWorkspaceByID(ctx context.Context, id uuid.UUID) (*models.Workspace, error)
// 	GetWorkspacesByUser(ctx context.Context, userID uuid.UUID) ([]*models.Workspace, error)
// 	UpdateWorkspace(ctx context.Context, workspace *models.Workspace) error
// 	DeleteWorkspace(ctx context.Context, id uuid.UUID) error
// 	GetWorkspaceStats(ctx context.Context, workspaceID uuid.UUID) (*WorkspaceStats, error)
// 	UpdateWorkspaceSettings(ctx context.Context, workspaceID uuid.UUID, settings models.JSONMap) error
// 	UpdateBrandingSettings(ctx context.Context, workspaceID uuid.UUID, settings models.JSONMap) error
// 	ArchiveWorkspace(ctx context.Context, workspaceID uuid.UUID) error
// 	RestoreWorkspace(ctx context.Context, workspaceID uuid.UUID) error
// }

type WorkspaceService struct {
	repo            repositories.WorkspaceRepository
	teamMemberRepo  repositories.TeamMemberRepository
	testimonialRepo repositories.TestimonialRepository
	storageService  *storage.StorageFactory
	db              *sql.DB
	redis           *redis.Client
	logger          *zap.Logger
}

type WorkspaceStats struct {
	TotalTestimonials     int        `json:"total_testimonials"`
	PublishedTestimonials int        `json:"published_testimonials"`
	PendingTestimonials   int        `json:"pending_testimonials"`
	TotalCampaigns        int        `json:"total_campaigns"`
	ActiveCampaigns       int        `json:"active_campaigns"`
	TotalViews            int        `json:"total_views"`
	ConversionRate        float64    `json:"conversion_rate"`
	TeamMembersCount      int        `json:"team_members_count"`
	StorageUsed           int64      `json:"storage_used_bytes"`
	LastActivity          *time.Time `json:"last_activity"`
	MonthlyTestimonials   int        `json:"monthly_testimonials"`
	WeeklyTestimonials    int        `json:"weekly_testimonials"`
	AverageRating         float64    `json:"average_rating"`
	ResponseRate          float64    `json:"response_rate"`
}

func NewWorkspaceService(
	repo repositories.WorkspaceRepository,
	teamMemberRepo repositories.TeamMemberRepository,
	// campaignRepo repositories.CampaignRepository,
	testimonialRepo repositories.TestimonialRepository,
	storageService *storage.StorageFactory,
	db *sql.DB,
	redis *redis.Client,
	logger *zap.Logger,
) WorkspaceService {
	return WorkspaceService{
		repo:            repo,
		teamMemberRepo:  teamMemberRepo,
		// campaignRepo:    campaignRepo,
		testimonialRepo: testimonialRepo,
		storageService:  storageService,
		db:              db,
		redis:           redis,
		logger:          logger,
	}
}

func (s WorkspaceService) CreateWorkspace(ctx context.Context, workspace *models.Workspace) error {
	if workspace.ID == uuid.Nil {
		workspace.ID = uuid.New()
	}

	now := time.Now()
	workspace.CreatedAt = now
	workspace.UpdatedAt = now

	err := s.repo.Create(ctx, workspace, s.db)
	if err != nil {
		s.logger.Error("Failed to create workspace", zap.Error(err))
		return err
	}

	// Cache the workspace
	s.cacheWorkspace(ctx, workspace)

	s.logger.Info("Workspace created successfully",
		zap.String("id", workspace.ID.String()),
		zap.String("name", workspace.Name))

	return nil
}

func (s WorkspaceService) GetWorkspaceByID(ctx context.Context, id uuid.UUID) (*models.Workspace, error) {
	// Try cache first
	if cached := s.getCachedWorkspace(ctx, id); cached != nil {
		return cached, nil
	}

	workspace, err := s.repo.GetByID(ctx, id, s.db)
	if err != nil {
		s.logger.Error("Failed to get workspace", zap.Error(err), zap.String("id", id.String()))
		return nil, err
	}

	// Cache for future use
	s.cacheWorkspace(ctx, workspace)

	return workspace, nil
}

func (s WorkspaceService) GetWorkspacesByUser(ctx context.Context, userID uuid.UUID) ([]*models.Workspace, error) {
	s.logger.Info("Getting workspaces for user", zap.String("user_id", userID.String()))

	// Get team memberships for the user
	teamMemberships, err := s.getTeamMembershipsByUser(ctx, userID)
	if err != nil {
		s.logger.Error("Failed to get team memberships for user",
			zap.Error(err),
			zap.String("user_id", userID.String()))
		return nil, fmt.Errorf("failed to get team memberships: %w", err)
	}

	if len(teamMemberships) == 0 {
		return []*models.Workspace{}, nil
	}

	// Extract workspace IDs
	workspaceIDs := make([]uuid.UUID, len(teamMemberships))
	for i, membership := range teamMemberships {
		workspaceIDs[i] = membership.WorkspaceID
	}

	// Get workspaces by IDs
	workspaces, err := s.getWorkspacesByIDs(ctx, workspaceIDs)
	if err != nil {
		s.logger.Error("Failed to get workspaces by IDs",
			zap.Error(err),
			zap.String("user_id", userID.String()))
		return nil, fmt.Errorf("failed to get workspaces: %w", err)
	}

	// Filter out archived workspaces unless user has admin access
	filteredWorkspaces := make([]*models.Workspace, 0)
	for _, workspace := range workspaces {
		// Check if workspace is archived
		if workspace.Settings != nil {
			if archived, ok := workspace.Settings["archived"].(bool); ok && archived {
				// Only include archived workspaces for owners and admins
				membership := s.findUserMembership(teamMemberships, workspace.ID)
				if membership != nil && (membership.Role == models.Owner || membership.Role == models.Admin) {
					filteredWorkspaces = append(filteredWorkspaces, workspace)
				}
				continue
			}
		}
		filteredWorkspaces = append(filteredWorkspaces, workspace)
	}

	s.logger.Info("Retrieved workspaces for user",
		zap.String("user_id", userID.String()),
		zap.Int("workspace_count", len(filteredWorkspaces)))

	return filteredWorkspaces, nil
}

func (s WorkspaceService) UpdateWorkspace(ctx context.Context, workspace *models.Workspace) error {
	workspace.UpdatedAt = time.Now()

	err := s.repo.Update(ctx, workspace, workspace.ID, s.db)
	if err != nil {
		s.logger.Error("Failed to update workspace", zap.Error(err))
		return err
	}

	// Update cache
	s.cacheWorkspace(ctx, workspace)

	// Clear any related caches
	s.clearWorkspaceCache(ctx, workspace.ID)

	s.logger.Info("Workspace updated successfully",
		zap.String("id", workspace.ID.String()))

	return nil
}

func (s WorkspaceService) DeleteWorkspace(ctx context.Context, id uuid.UUID) error {
	// Clean up all files for testimonials and artifacts in this workspace
	// IMPORTANT: File deletion failures should not block workspace deletion
	s.cleanupWorkspaceFiles(ctx, id)

	// Delete from database (this will cascade delete testimonials, artifacts, etc.)
	err := s.repo.Delete(ctx, id, s.db)
	if err != nil {
		s.logger.Error("Failed to delete workspace", zap.Error(err))
		return err
	}

	// Remove from cache
	s.clearWorkspaceCache(ctx, id)

	s.logger.Info("Workspace deleted successfully", zap.String("id", id.String()))

	return nil
}

// cleanupWorkspaceFiles deletes all files from storage for a workspace's testimonials and artifacts
// Failures are logged but don't block the deletion process
func (s WorkspaceService) cleanupWorkspaceFiles(ctx context.Context, workspaceID uuid.UUID) {
	s.logger.Info("Starting workspace file cleanup",
		zap.String("workspace_id", workspaceID.String()))

	// Get all testimonials for this workspace (without artifacts to save memory)
	// We'll query artifacts separately to handle large workspaces efficiently
	testimonials, err := s.testimonialRepo.FetchByWorkspaceID(ctx, workspaceID, models.TestimonialFilter{
		ExcludeArtifacts: false, // We need artifacts to clean up their files
		Limit:            1000,  // Process in batches if needed
	}, s.db)

	if err != nil {
		s.logger.Warn("Failed to fetch testimonials for file cleanup",
			zap.String("workspace_id", workspaceID.String()),
			zap.Error(err))
		return
	}

	if len(testimonials) == 0 {
		s.logger.Info("No testimonials to clean up",
			zap.String("workspace_id", workspaceID.String()))
		return
	}

	s.logger.Info("Found testimonials to clean up",
		zap.String("workspace_id", workspaceID.String()),
		zap.Int("testimonial_count", len(testimonials)))

	// Clean up files for each testimonial
	filesDeleted := 0
	filesFailed := 0

	for _, testimonial := range testimonials {
		// Delete testimonial media file
		if testimonial.MediaURL != nil && *testimonial.MediaURL != "" {
			if err := s.deleteFileFromStorage(ctx, *testimonial.MediaURL); err != nil {
				s.logger.Warn("Failed to delete testimonial media file",
					zap.String("workspace_id", workspaceID.String()),
					zap.String("testimonial_id", testimonial.ID.String()),
					zap.String("media_url", *testimonial.MediaURL),
					zap.Error(err))
				filesFailed++
			} else {
				filesDeleted++
			}
		}

		// Delete testimonial thumbnail
		if testimonial.ThumbnailURL != nil && *testimonial.ThumbnailURL != "" {
			if err := s.deleteFileFromStorage(ctx, *testimonial.ThumbnailURL); err != nil {
				s.logger.Warn("Failed to delete testimonial thumbnail",
					zap.String("workspace_id", workspaceID.String()),
					zap.String("testimonial_id", testimonial.ID.String()),
					zap.String("thumbnail_url", *testimonial.ThumbnailURL),
					zap.Error(err))
				filesFailed++
			} else {
				filesDeleted++
			}
		}

		// Delete artifact assets
		if len(testimonial.Artifacts) > 0 {
			for _, artifact := range testimonial.Artifacts {
				if artifact.AssetURL != nil && *artifact.AssetURL != "" {
					if err := s.deleteFileFromStorage(ctx, *artifact.AssetURL); err != nil {
						s.logger.Warn("Failed to delete artifact asset",
							zap.String("workspace_id", workspaceID.String()),
							zap.String("testimonial_id", testimonial.ID.String()),
							zap.String("artifact_id", artifact.ID.String()),
							zap.String("asset_url", *artifact.AssetURL),
							zap.Error(err))
						filesFailed++
					} else {
						filesDeleted++
					}
				}
			}
		}
	}

	s.logger.Info("Workspace file cleanup completed",
		zap.String("workspace_id", workspaceID.String()),
		zap.Int("files_deleted", filesDeleted),
		zap.Int("files_failed", filesFailed))
}

// deleteFileFromStorage is a helper that safely deletes a file from storage
func (s WorkspaceService) deleteFileFromStorage(ctx context.Context, fileURL string) error {
	if s.storageService == nil {
		return fmt.Errorf("storage service not available")
	}

	return s.storageService.Delete(ctx, fileURL)
}

func (s WorkspaceService) GetWorkspaceStats(ctx context.Context, workspaceID uuid.UUID) (*WorkspaceStats, error) {
	s.logger.Info("Getting workspace stats", zap.String("workspace_id", workspaceID.String()))

	// Check cache first
	if cached := s.getCachedWorkspaceStats(ctx, workspaceID); cached != nil {
		return cached, nil
	}

	stats := &WorkspaceStats{}

	// Get testimonial stats
	testimonialStats, err := s.getTestimonialStats(ctx, workspaceID)
	if err != nil {
		s.logger.Error("Failed to get testimonial stats", zap.Error(err))
		// Continue with other stats even if this fails
	} else {
		stats.TotalTestimonials = testimonialStats.Total
		stats.PublishedTestimonials = testimonialStats.Published
		stats.PendingTestimonials = testimonialStats.Pending
		stats.MonthlyTestimonials = testimonialStats.Monthly
		stats.WeeklyTestimonials = testimonialStats.Weekly
		stats.AverageRating = testimonialStats.AverageRating
	}

	// Get campaign stats
	campaignStats, err := s.getCampaignStats(ctx, workspaceID)
	if err != nil {
		s.logger.Error("Failed to get campaign stats", zap.Error(err))
		// Continue with other stats even if this fails
	} else {
		stats.TotalCampaigns = campaignStats.Total
		stats.ActiveCampaigns = campaignStats.Active
		stats.ResponseRate = campaignStats.ResponseRate
	}

	// Get team member count
	teamMemberCount, err := s.getTeamMemberCount(ctx, workspaceID)
	if err != nil {
		s.logger.Error("Failed to get team member count", zap.Error(err))
		stats.TeamMembersCount = 1 // Default to 1 (owner)
	} else {
		stats.TeamMembersCount = teamMemberCount
	}

	// Get analytics stats
	analyticsStats, err := s.getAnalyticsStats(ctx, workspaceID)
	if err != nil {
		s.logger.Error("Failed to get analytics stats", zap.Error(err))
		// Continue with default values
	} else {
		stats.TotalViews = analyticsStats.TotalViews
		stats.ConversionRate = analyticsStats.ConversionRate
	}

	// Get storage usage
	storageUsage, err := s.getStorageUsage(ctx, workspaceID)
	if err != nil {
		s.logger.Error("Failed to get storage usage", zap.Error(err))
		stats.StorageUsed = 0
	} else {
		stats.StorageUsed = storageUsage
	}

	// Get last activity
	lastActivity, err := s.getLastActivity(ctx, workspaceID)
	if err != nil {
		s.logger.Error("Failed to get last activity", zap.Error(err))
		// Leave as nil
	} else {
		stats.LastActivity = lastActivity
	}

	// Cache the stats for 5 minutes
	s.cacheWorkspaceStats(ctx, workspaceID, stats)

	s.logger.Info("Workspace stats retrieved successfully",
		zap.String("workspace_id", workspaceID.String()),
		zap.Int("total_testimonials", stats.TotalTestimonials),
		zap.Int("total_campaigns", stats.TotalCampaigns))

	return stats, nil
}

func (s WorkspaceService) UpdateWorkspaceSettings(ctx context.Context, workspaceID uuid.UUID, settings models.JSONMap) error {
	workspace, err := s.GetWorkspaceByID(ctx, workspaceID)
	if err != nil {
		return err
	}

	if workspace.Settings == nil {
		workspace.Settings = make(models.JSONMap)
	}

	// Merge new settings with existing ones
	for key, value := range settings {
		workspace.Settings[key] = value
	}

	return s.UpdateWorkspace(ctx, workspace)
}

func (s WorkspaceService) UpdateBrandingSettings(ctx context.Context, workspaceID uuid.UUID, settings models.JSONMap) error {
	workspace, err := s.GetWorkspaceByID(ctx, workspaceID)
	if err != nil {
		return err
	}

	// if workspace.BrandingSettings == nil {
	// 	workspace.BrandingSettings = make(models.JSONMap)
	// }

	// // Merge new branding settings with existing ones
	// for key, value := range settings {
	// 	workspace.BrandingSettings[key] = value
	// }

	return s.UpdateWorkspace(ctx, workspace)
}

func (s WorkspaceService) ArchiveWorkspace(ctx context.Context, workspaceID uuid.UUID) error {
	workspace, err := s.GetWorkspaceByID(ctx, workspaceID)
	if err != nil {
		return err
	}

	if workspace.Settings == nil {
		workspace.Settings = make(models.JSONMap)
	}

	workspace.Settings["archived"] = true
	workspace.Settings["archived_at"] = time.Now().Unix()

	err = s.UpdateWorkspace(ctx, workspace)
	if err != nil {
		return err
	}

	s.logger.Info("Workspace archived", zap.String("workspace_id", workspaceID.String()))
	return nil
}

func (s WorkspaceService) RestoreWorkspace(ctx context.Context, workspaceID uuid.UUID) error {
	workspace, err := s.GetWorkspaceByID(ctx, workspaceID)
	if err != nil {
		return err
	}

	if workspace.Settings == nil {
		workspace.Settings = make(models.JSONMap)
	}

	workspace.Settings["archived"] = false
	workspace.Settings["restored_at"] = time.Now().Unix()

	err = s.UpdateWorkspace(ctx, workspace)
	if err != nil {
		return err
	}

	s.logger.Info("Workspace restored", zap.String("workspace_id", workspaceID.String()))
	return nil
}

// Helper methods for stats aggregation

type testimonialStatsResult struct {
	Total         int
	Published     int
	Pending       int
	Monthly       int
	Weekly        int
	AverageRating float64
}

type campaignStatsResult struct {
	Total        int
	Active       int
	ResponseRate float64
}

type analyticsStatsResult struct {
	TotalViews     int
	ConversionRate float64
}

func (s WorkspaceService) getTestimonialStats(ctx context.Context, workspaceID uuid.UUID) (*testimonialStatsResult, error) {
	query := `
		SELECT 
			COUNT(*) as total,
			COUNT(CASE WHEN status = 'approved' THEN 1 END) as published,
			COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
			COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as monthly,
			COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as weekly,
			COALESCE(AVG(CASE WHEN rating IS NOT NULL THEN rating END), 0) as average_rating
		FROM testimonials 
		WHERE workspace_id = $1
	`

	var stats testimonialStatsResult
	err := s.db.QueryRowContext(ctx, query, workspaceID).Scan(
		&stats.Total,
		&stats.Published,
		&stats.Pending,
		&stats.Monthly,
		&stats.Weekly,
		&stats.AverageRating,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to get testimonial stats: %w", err)
	}

	return &stats, nil
}

func (s WorkspaceService) getCampaignStats(ctx context.Context, workspaceID uuid.UUID) (*campaignStatsResult, error) {
	query := `
		SELECT 
			COUNT(*) as total,
			COUNT(CASE WHEN status = 'active' THEN 1 END) as active,
			CASE 
				WHEN SUM(target_count) > 0 THEN 
					(SUM(collected_count)::float / SUM(target_count)::float) * 100
				ELSE 0 
			END as response_rate
		FROM campaigns 
		WHERE workspace_id = $1
	`

	var stats campaignStatsResult
	err := s.db.QueryRowContext(ctx, query, workspaceID).Scan(
		&stats.Total,
		&stats.Active,
		&stats.ResponseRate,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to get campaign stats: %w", err)
	}

	return &stats, nil
}

func (s WorkspaceService) getTeamMemberCount(ctx context.Context, workspaceID uuid.UUID) (int, error) {
	query := `SELECT COUNT(*) FROM team_members WHERE workspace_id = $1 AND status = 'active'`

	var count int
	err := s.db.QueryRowContext(ctx, query, workspaceID).Scan(&count)
	if err != nil {
		return 0, fmt.Errorf("failed to get team member count: %w", err)
	}

	return count, nil
}

func (s WorkspaceService) getAnalyticsStats(ctx context.Context, workspaceID uuid.UUID) (*analyticsStatsResult, error) {
	// This would typically query an analytics_events table
	// For now, return calculated values based on testimonials and campaigns
	query := `
		SELECT 
			COALESCE(SUM(view_count), 0) as total_views,
			CASE 
				WHEN COUNT(t.id) > 0 AND COUNT(c.id) > 0 THEN
					(COUNT(t.id)::float / COUNT(c.id)::float) * 100
				ELSE 0
			END as conversion_rate
		FROM campaigns c
		LEFT JOIN testimonials t ON c.id = t.campaign_id
		WHERE c.workspace_id = $1
	`

	var stats analyticsStatsResult
	err := s.db.QueryRowContext(ctx, query, workspaceID).Scan(
		&stats.TotalViews,
		&stats.ConversionRate,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to get analytics stats: %w", err)
	}

	return &stats, nil
}

func (s WorkspaceService) getStorageUsage(ctx context.Context, workspaceID uuid.UUID) (int64, error) {
	// This would calculate file sizes from media storage
	// For now, estimate based on testimonial count and assume average file sizes
	query := `
		SELECT 
			COUNT(CASE WHEN raw_media_url IS NOT NULL THEN 1 END) * 5242880 as estimated_storage
		FROM testimonials 
		WHERE workspace_id = $1
	`

	var storageUsed int64
	err := s.db.QueryRowContext(ctx, query, workspaceID).Scan(&storageUsed)
	if err != nil {
		return 0, fmt.Errorf("failed to get storage usage: %w", err)
	}

	return storageUsed, nil
}

func (s WorkspaceService) getLastActivity(ctx context.Context, workspaceID uuid.UUID) (*time.Time, error) {
	query := `
		SELECT MAX(latest_activity) as last_activity
		FROM (
			SELECT MAX(updated_at) as latest_activity FROM testimonials WHERE workspace_id = $1
			UNION ALL
			SELECT MAX(updated_at) as latest_activity FROM campaigns WHERE workspace_id = $1
			UNION ALL
			SELECT MAX(updated_at) as latest_activity FROM team_members WHERE workspace_id = $1
		) activities
	`

	var lastActivity time.Time
	err := s.db.QueryRowContext(ctx, query, workspaceID).Scan(&lastActivity)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to get last activity: %w", err)
	}

	return &lastActivity, nil
}

func (s WorkspaceService) getTeamMembershipsByUser(ctx context.Context, userID uuid.UUID) ([]*models.TeamMember, error) {
	query := `
		SELECT id, workspace_id, user_id, role, permissions, created_at, updated_at
		FROM team_members 
		WHERE user_id = $1 AND status IN ('active', 'pending')
		ORDER BY created_at DESC
	`

	rows, err := s.db.QueryContext(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var memberships []*models.TeamMember
	for rows.Next() {
		var membership models.TeamMember
		err := rows.Scan(
			&membership.ID,
			&membership.WorkspaceID,
			&membership.UserID,
			&membership.Role,
			// &membership.Status,
			&membership.Permissions,
			&membership.CreatedAt,
			&membership.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		memberships = append(memberships, &membership)
	}

	return memberships, nil
}

func (s WorkspaceService) getWorkspacesByIDs(ctx context.Context, workspaceIDs []uuid.UUID) ([]*models.Workspace, error) {
	if len(workspaceIDs) == 0 {
		return []*models.Workspace{}, nil
	}

	// Build IN clause for multiple workspace IDs
	placeholders := make([]string, len(workspaceIDs))
	args := make([]interface{}, len(workspaceIDs))
	for i, id := range workspaceIDs {
		placeholders[i] = fmt.Sprintf("$%d", i+1)
		args[i] = id
	}

	query := fmt.Sprintf(`
		SELECT id, name, industry, website_url, plan, settings, branding_settings, 
			  created_at, updated_at
		FROM workspaces 
		WHERE id IN (%s)
		ORDER BY created_at DESC
	`, fmt.Sprintf("%s", placeholders))

	rows, err := s.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var workspaces []*models.Workspace
	for rows.Next() {
		var workspace models.Workspace
		err := rows.Scan(
			&workspace.ID,
			&workspace.Name,
			&workspace.Industry,
			&workspace.WebsiteURL,
			&workspace.Plan,
			&workspace.Settings,
			&workspace.BrandContext,
			&workspace.CreatedAt,
			&workspace.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		workspaces = append(workspaces, &workspace)
	}

	return workspaces, nil
}

func (s WorkspaceService) findUserMembership(memberships []*models.TeamMember, workspaceID uuid.UUID) *models.TeamMember {
	for _, membership := range memberships {
		if membership.WorkspaceID == workspaceID {
			return membership
		}
	}
	return nil
}

// Cache helper methods

func (s WorkspaceService) cacheWorkspace(ctx context.Context, workspace *models.Workspace) {
	cacheKey := fmt.Sprintf("workspace:%s", workspace.ID.String())
	err := s.redis.Set(ctx, cacheKey, workspace, time.Hour).Err()
	if err != nil {
		s.logger.Warn("Failed to cache workspace", zap.Error(err), zap.String("key", cacheKey))
	}
}

func (s WorkspaceService) getCachedWorkspace(ctx context.Context, id uuid.UUID) *models.Workspace {
	cacheKey := fmt.Sprintf("workspace:%s", id.String())
	var workspace models.Workspace
	err := s.redis.Get(ctx, cacheKey).Scan(&workspace)
	if err != nil {
		return nil
	}
	return &workspace
}

func (s WorkspaceService) clearWorkspaceCache(ctx context.Context, id uuid.UUID) {
	cacheKey := fmt.Sprintf("workspace:%s", id.String())
	s.redis.Del(ctx, cacheKey)
}

func (s WorkspaceService) cacheWorkspaceStats(ctx context.Context, workspaceID uuid.UUID, stats *WorkspaceStats) {
	cacheKey := fmt.Sprintf("workspace_stats:%s", workspaceID.String())
	err := s.redis.Set(ctx, cacheKey, stats, 5*time.Minute).Err()
	if err != nil {
		s.logger.Warn("Failed to cache workspace stats", zap.Error(err), zap.String("key", cacheKey))
	}
}

func (s WorkspaceService) getCachedWorkspaceStats(ctx context.Context, workspaceID uuid.UUID) *WorkspaceStats {
	cacheKey := fmt.Sprintf("workspace_stats:%s", workspaceID.String())
	var stats WorkspaceStats
	err := s.redis.Get(ctx, cacheKey).Scan(&stats)
	if err != nil {
		return nil
	}
	return &stats
}
