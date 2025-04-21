package services

import (
	"context"
	"database/sql"
	"fmt"
	"log/slog"
	"time"

	"github.com/google/uuid"
	"github.com/ifeanyidike/cenphi/internal/apperrors"
	"github.com/ifeanyidike/cenphi/internal/contracts"
	"github.com/ifeanyidike/cenphi/internal/models"
	"github.com/ifeanyidike/cenphi/internal/providers"
	"github.com/ifeanyidike/cenphi/internal/repositories"
	"github.com/ifeanyidike/cenphi/pkg/ratelimit"
	"github.com/robfig/cron/v3"
)

type ProviderService struct {
	providers   map[string]providers.Provider
	limiter     *ratelimit.RedisLimiter
	scheduler   *cron.Cron
	cronEntries map[string]cron.EntryID

	providerRepo     repositories.ProviderConfigRepository
	profileRepo      repositories.CustomerProfileRepository
	testimonialRepo  repositories.TestimonialRepository
	oauthService     contracts.OAuthService
	sentimentService contracts.SentimentService
	db               *sql.DB
}

func NewProviderService(
	prs []providers.Provider,
	limiter *ratelimit.RedisLimiter,
	testimonialRepo repositories.TestimonialRepository,
	profileRepo repositories.CustomerProfileRepository,
	providerRepo repositories.ProviderConfigRepository,
	oauthService contracts.OAuthService,
	sentimentService contracts.SentimentService,
	db *sql.DB,
) *ProviderService {
	ps := &ProviderService{
		limiter:          limiter,
		testimonialRepo:  testimonialRepo,
		profileRepo:      profileRepo,
		providerRepo:     providerRepo,
		oauthService:     oauthService,
		sentimentService: sentimentService,
		db:               db,
		providers:        make(map[string]providers.Provider),
		scheduler:        cron.New(),
		cronEntries:      make(map[string]cron.EntryID),
	}

	for _, p := range prs {
		if !p.IsConfigured() {
			slog.Warn("provider not configured, skipping", "provider", p.Name())
			continue
		}

		currentProvider := p

		entryID, err := ps.scheduler.AddFunc(p.Schedule(), func() {
			ctx := context.Background()
			slog.Info("starting scheduled sync", "provider", currentProvider.Name())
			if err := ps.SyncProvider(ctx, currentProvider.Name()); err != nil {
				slog.Error("scheduled sync failed",
					"provider", currentProvider.Name(),
					"error", err)
			}
		})

		if err != nil {
			slog.Error("failed to schedule provider",
				"provider", p.Name(),
				"schedule", p.Schedule(),
				"error", err)
			continue
		}

		ps.providers[p.Name()] = p
		ps.cronEntries[p.Name()] = entryID
	}

	ps.scheduler.Start()
	return ps
}

func (ps *ProviderService) SyncProvider(ctx context.Context, name string) error {
	provider, ok := ps.providers[name]
	if !ok {
		return apperrors.ErrProviderNotFound
	}

	allowed, err := ps.limiter.Allow(ctx, name, provider.RateLimit(), provider.RateWindow())
	if err != nil || !allowed {
		return apperrors.ErrRateLimited
	}

	testimonials, err := provider.Fetch(ctx, "", uuid.New())
	if err != nil {
		return err
	}

	if err := ps.testimonialRepo.BatchUpsert(ctx, testimonials, ps.db); err != nil {
		return fmt.Errorf("batch upsert failed: %w", err)
	}

	slog.Info("successfully synced provider",
		"provider", name,
		"testimonials", len(testimonials))
	return nil
}

func (ps *ProviderService) Stop() context.Context {
	ctx := ps.scheduler.Stop()

	for _, entryID := range ps.cronEntries {
		ps.scheduler.Remove(entryID)
	}
	return ctx
}

func (ps *ProviderService) GetProviders() []string {
	names := make([]string, 0, len(ps.providers))
	for name := range ps.providers {
		names = append(names, name)
	}
	return names
}

// Add this to your services/provider_service.go

func (ps *ProviderService) FetchWithCredentials(
	ctx context.Context,
	providerName string,
	userID string,
	workspaceID uuid.UUID,
	credentials map[string]string,
) ([]models.Testimonial, error) {
	// Find the provider
	provider, ok := ps.providers[providerName]
	if !ok {
		return nil, apperrors.ErrProviderNotFound
	}

	// Use rate limiting
	allowed, err := ps.limiter.Allow(ctx, providerName, provider.RateLimit(), provider.RateWindow())
	if err != nil || !allowed {
		return nil, apperrors.ErrRateLimited
	}

	// Create a temporary provider with the user's credentials
	var tempProvider providers.Provider

	switch providerName {
	case "facebook":
		clientID, ok := credentials["clientID"]
		if !ok {
			return nil, fmt.Errorf("missing client id")
		}
		clientSecret, ok := credentials["clientSecret"]
		if !ok {
			return nil, fmt.Errorf("missing client secret")
		}

		tempProvider = providers.NewFacebookProvider(
			clientID,
			clientSecret,
			ps.oauthService,
			ps.sentimentService,
			ps.profileRepo,
			ps.db,
		)
	// Similar cases for other providers
	default:
		return nil, fmt.Errorf("unsupported provider: %s", providerName)
	}

	// Check if provider is properly configured
	if !tempProvider.IsConfigured() {
		return nil, fmt.Errorf("provider not properly configured")
	}

	// Fetch testimonials using the temporary provider
	testimonials, err := tempProvider.Fetch(ctx, userID, workspaceID)
	if err != nil {
		return nil, err
	}

	// Store in database
	if err := ps.testimonialRepo.BatchUpsert(ctx, testimonials, ps.db); err != nil {
		return nil, fmt.Errorf("batch upsert failed: %w", err)
	}

	return testimonials, nil
}

// Add these methods to your provider_service.go
func (ps *ProviderService) ConfigureProvider(ctx context.Context, config models.ProviderConfig) error {
	// Generate ID if not present
	if config.ID == uuid.Nil {
		config.ID = uuid.New()
	}

	// Set timestamps
	now := time.Now()
	if config.CreatedAt.IsZero() {
		config.CreatedAt = now
	}
	config.UpdatedAt = now

	// Validate provider exists
	if _, ok := ps.providers[config.ProviderName]; !ok {
		return apperrors.ErrProviderNotFound
	}

	// Save configuration to database
	if err := ps.providerRepo.Save(ctx, config, ps.db); err != nil {
		return err
	}

	// If active, schedule it
	if config.IsActive {
		return ps.scheduleWorkspaceProvider(ctx, config)
	}

	return nil
}

func (ps *ProviderService) scheduleWorkspaceProvider(ctx context.Context, config models.ProviderConfig) error {
	// Create a unique ID for this scheduled job
	jobID := fmt.Sprintf("%s-%s", config.ProviderName, config.WorkspaceID.String())

	// Remove existing cron entry if it exists
	if entryID, exists := ps.cronEntries[jobID]; exists {
		ps.scheduler.Remove(entryID)
	}

	// Add new cron job
	entryID, err := ps.scheduler.AddFunc(config.Schedule, func() {
		// Create context for the job
		jobCtx := context.Background()

		// Use the userID from the config
		userID := config.UserID // This would need to be added to your ProviderConfig model

		// Get the base provider
		baseProvider, ok := ps.providers[config.ProviderName]
		if !ok {
			slog.Error("provider not found in scheduled job", "provider", config.ProviderName)
			return
		}

		// Check rate limits
		allowed, err := ps.limiter.Allow(jobCtx, config.ProviderName, baseProvider.RateLimit(), baseProvider.RateWindow())
		if err != nil || !allowed {
			slog.Error("rate limited in scheduled job", "provider", config.ProviderName)
			return
		}

		// Fetch testimonials directly using the provider with the workspace context
		testimonials, err := baseProvider.Fetch(jobCtx, userID, config.WorkspaceID)
		if err != nil {
			slog.Error("failed to fetch testimonials in scheduled job",
				"provider", config.ProviderName,
				"workspace", config.WorkspaceID,
				"error", err)
			return
		}

		// Save testimonials
		if err := ps.testimonialRepo.BatchUpsert(jobCtx, testimonials, ps.db); err != nil {
			slog.Error("failed to save testimonials in scheduled job",
				"provider", config.ProviderName,
				"workspace", config.WorkspaceID,
				"error", err)
			return
		}

		slog.Info("successfully synced workspace provider",
			"provider", config.ProviderName,
			"workspace", config.WorkspaceID,
			"testimonials", len(testimonials))
	})

	if err != nil {
		return fmt.Errorf("failed to schedule workspace provider: %w", err)
	}

	ps.cronEntries[jobID] = entryID
	return nil
}

func (ps *ProviderService) GetWorkspaceProviders(ctx context.Context, workspaceID uuid.UUID) ([]models.ProviderConfig, error) {
	return ps.providerRepo.GetByWorkspace(ctx, workspaceID, ps.db)
}
