package services

import (
	"context"

	"github.com/ifeanyidike/cenphi/internal/apperrors"
	"github.com/ifeanyidike/cenphi/internal/providers"
	"github.com/ifeanyidike/cenphi/internal/repositories"
	"github.com/ifeanyidike/cenphi/pkg/ratelimit"
	"github.com/robfig/cron/v3"
)

type ProviderService struct {
	providers map[string]providers.Provider
	limiter   *ratelimit.RedisLimiter
	scheduler *cron.Cron
	repo      repositories.TestimonialRepository
	db        repositories.DB
}

func NewProviderService(providers []providers.Provider, limiter *ratelimit.RedisLimiter, repo repositories.TestimonialRepository, db repositories.DB) *ProviderService {
	ps := &ProviderService{
		limiter:   limiter,
		repo:      repo,
		providers: make(map[string]providers.Provider),
		scheduler: cron.New(),
	}

	for _, p := range providers {
		ps.providers[p.Name()] = p
		ps.scheduler.AddFunc(p.Schedule(), func() {
			ps.syncProvider(context.Background(), p.Name())
		})
	}

	ps.scheduler.Start()
	return ps
}

func (ps *ProviderService) syncProvider(ctx context.Context, name string) error {
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

	return ps.repo.BatchUpsert(ctx, testimonials, ps.db)
}
