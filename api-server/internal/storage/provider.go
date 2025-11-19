package storage

import (
	"context"
	"io"
	"mime/multipart"
	"time"
)

// Provider defines the interface for different storage providers
type Provider interface {
	// Upload uploads a file to storage and returns its public URL
	Upload(ctx context.Context, filePath string, destinationPath string, contentType string) (string, error)

	// UploadFromReader uploads a file from a reader to storage and returns its public URL
	UploadFromReader(ctx context.Context, reader io.Reader, destinationPath string, contentType string) (string, error)

	// UploadChunked performs a chunked upload for large files
	UploadChunked(ctx context.Context, filePath string, destinationPath string, contentType string, chunkSize int) (string, error)

	// PresignedURL generates a presigned URL for temporary access (downloads)
	PresignedURL(ctx context.Context, objectPath string, expiry time.Duration) (string, error)

	// GenerateUploadPresignedURL generates a presigned URL for direct uploads
	// This allows clients to upload files directly to storage, bypassing server size limits
	GenerateUploadPresignedURL(ctx context.Context, objectPath string, expiry time.Duration) (string, error)

	// Delete removes a file from storage
	Delete(ctx context.Context, objectPath string) error
	UploadFile(ctx context.Context, file multipart.File, header *multipart.FileHeader, folder string) (string, error)
	UploadMedia(ctx context.Context, filePath string, data []byte, content_type string) (string, error)
	DownloadMedia(ctx context.Context, mediaURL string, maxRetries int) (string, error)
}
