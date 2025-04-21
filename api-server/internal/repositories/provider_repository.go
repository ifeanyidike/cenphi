// repositories/provider_config_repository.go
package repositories

import (
	"context"

	"github.com/google/uuid"
	"github.com/ifeanyidike/cenphi/internal/models"
	"github.com/redis/go-redis/v9"
)

type ProviderConfigRepository interface {
	Save(ctx context.Context, config models.ProviderConfig, db DB) error
	GetByWorkspace(ctx context.Context, workspaceID uuid.UUID, db DB) ([]models.ProviderConfig, error)
	GetByProvider(ctx context.Context, providerName string, db DB) ([]models.ProviderConfig, error)
}

type providerConfigRepository struct {
	redisClient *redis.Client
}

func NewProviderConfigRepository(redisClient *redis.Client) ProviderConfigRepository {
	return &providerConfigRepository{
		redisClient: redisClient,
	}
}

func (pr *providerConfigRepository) Save(ctx context.Context, config models.ProviderConfig, db DB) error {
	return nil
}

func (pr *providerConfigRepository) GetByWorkspace(ctx context.Context, workspaceID uuid.UUID, db DB) ([]models.ProviderConfig, error) {
	return nil, nil
}

func (pr *providerConfigRepository) GetByProvider(ctx context.Context, providerName string, db DB) ([]models.ProviderConfig, error) {
	return nil, nil
}

// Implement the repository methods...
