package services

import (
	"context"
	"database/sql"
	"fmt"
	"log/slog"

	"github.com/ifeanyidike/cenphi/internal/apperrors"
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

	repo repositories.TestimonialRepository
	db   *sql.DB
}

func NewProviderService(prs []providers.Provider, limiter *ratelimit.RedisLimiter, repo repositories.TestimonialRepository, db repositories.DB) *ProviderService {
	ps := &ProviderService{
		limiter:     limiter,
		repo:        repo,
		providers:   make(map[string]providers.Provider),
		scheduler:   cron.New(),
		cronEntries: make(map[string]cron.EntryID),
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

	testimonials, err := provider.Fetch(ctx)
	if err != nil {
		return err
	}

	if err := ps.repo.BatchUpsert(ctx, testimonials, ps.db); err != nil {
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
