package storage

import (
	"context"
	"fmt"

	"github.com/ifeanyidike/cenphi/internal/config"
	"go.uber.org/zap"
)

// StorageType defines the type of storage provider
type StorageType string

const (
	StorageTypeLocal StorageType = "local"
	StorageTypeOCI   StorageType = "oci"
)

// StorageFactory creates storage providers based on configuration
type StorageFactory struct {
	logger *zap.Logger
	Provider
}

// NewStorageFactory creates a new storage factory
// func NewStorageFactory(logger *zap.Logger) *StorageFactory {
// 	return &StorageFactory{
// 		logger: logger,
// 	}
// }

// GetProvider returns a storage provider based on type
func NewStorageFactory(ctx context.Context, storageType StorageType, config config.Config, logger *zap.Logger) (*StorageFactory, error) {
	logger.Info("Creating storage provider", zap.String("type", string(storageType)))
	NewAudioExtractor(logger, "/tmp/cenphi_audio")

	switch storageType {
	case StorageTypeOCI:
		ociProvider, err := NewOCIProvider(ctx, config.OCI, logger)
		return &StorageFactory{
			logger:   logger,
			Provider: ociProvider,
		}, err

	case StorageTypeLocal:
		localProvider, err := createLocalProvider()
		return &StorageFactory{
			logger:   logger,
			Provider: localProvider,
		}, err
	default:
		return nil, fmt.Errorf("unsupported storage provider type: %s", storageType)

	}
}

func createLocalProvider() (Provider, error) {
	// This could be implemented in a separate file for local testing
	return nil, fmt.Errorf("local storage provider not implemented")
}
