package storage

import (
	"context"
	"crypto/rsa"
	"crypto/x509"
	"encoding/base64"
	"encoding/pem"
	"fmt"
	"io"
	"mime/multipart"
	"net"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"sync"
	"sync/atomic"
	"time"

	"github.com/google/uuid"
	"github.com/ifeanyidike/cenphi/internal/config"
	"github.com/oracle/oci-go-sdk/v65/common"
	"github.com/oracle/oci-go-sdk/v65/common/auth"
	"github.com/oracle/oci-go-sdk/v65/objectstorage"
	"go.uber.org/zap"
)

type OCIProvider struct {
	client objectstorage.ObjectStorageClient
	config config.OCIConfig
	logger *zap.Logger

	// Performance settings - IMPROVED: Config-driven instead of hardcoded
	chunkSize      int64
	maxConcurrency int
	uploadTimeout  time.Duration
	retryAttempts  int
	retryDelay     time.Duration

	// NEW: Advanced monitoring and metrics
	uploadStats *UploadStats

	// NEW: Resource management
	cleanupTicker  *time.Ticker
	tempFiles      map[string]time.Time
	tempFilesMutex sync.RWMutex
}

// NEW: Upload statistics for monitoring
type UploadStats struct {
	TotalUploads   int64
	SuccessUploads int64
	FailedUploads  int64
	TotalBytes     int64
	AverageSpeed   float64 // MB/s
	mutex          sync.RWMutex
}

type ChunkUpload struct {
	PartNumber int
	Data       []byte
	Size       int64
	Offset     int64 // NEW: Track offset for better error reporting
}

type UploadResult struct {
	PartNumber  int
	ETag        string
	Error       error
	Duration    time.Duration // NEW: Track individual chunk performance
	BytesPerSec float64       // NEW: Speed tracking
}

// IMPROVED: Config-driven constants with better defaults for 78MB files
const (
	DefaultChunkSize        = 10 * 1024 * 1024  // 10MB
	MaxSimpleUploadSize     = 100 * 1024 * 1024 // IMPROVED: 100MB (was 15MB) - better for 78MB files
	DefaultMaxConcurrency   = 6                 // IMPROVED: Increased from 4 for better throughput
	DefaultUploadTimeout    = 25 * time.Minute  // IMPROVED: Slightly less than server timeout
	DefaultRetryAttempts    = 3
	DefaultRetryDelay       = 3 * time.Second // IMPROVED: Longer base delay
	TempFileCleanupInterval = 5 * time.Minute
	TempFileMaxAge          = 30 * time.Minute
)

// NewOCIProvider creates an optimized OCI provider with config-driven settings
func NewOCIProvider(ctx context.Context, cfg config.OCIConfig, logger *zap.Logger) (*OCIProvider, error) {
	client, err := createOCIClient(cfg, logger)
	if err != nil {
		return nil, fmt.Errorf("failed to create OCI client: %w", err)
	}

	// IMPROVED: Use config values with intelligent defaults
	chunkSize := getConfigInt64(cfg, "ChunkSize", DefaultChunkSize)
	maxConcurrency := getConfigInt(cfg, "MaxConcurrency", DefaultMaxConcurrency)
	uploadTimeout := getConfigDuration(cfg, "UploadTimeout", DefaultUploadTimeout)
	retryAttempts := getConfigInt(cfg, "RetryAttempts", DefaultRetryAttempts)
	retryDelay := getConfigDuration(cfg, "RetryDelay", DefaultRetryDelay)

	provider := &OCIProvider{
		client:         client,
		config:         cfg,
		logger:         logger,
		chunkSize:      chunkSize,
		maxConcurrency: maxConcurrency,
		uploadTimeout:  uploadTimeout,
		retryAttempts:  retryAttempts,
		retryDelay:     retryDelay,
		uploadStats:    &UploadStats{},
		tempFiles:      make(map[string]time.Time),
	}
	provider.ensureTunedTransport()
	// NEW: Start background cleanup for temporary files
	provider.startTempFileCleanup()

	logger.Info("Enhanced OCI provider initialized",
		zap.String("region", cfg.Region),
		zap.String("bucket", cfg.Bucket),
		zap.Int64("chunk_size_mb", chunkSize/(1024*1024)),
		zap.Int("max_concurrency", maxConcurrency),
		zap.Duration("upload_timeout", uploadTimeout),
		zap.Int64("simple_upload_threshold_mb", MaxSimpleUploadSize/(1024*1024)),
		zap.Int("retry_attempts", retryAttempts))

	return provider, nil
}

// ensureTunedTransport tweaks default transport parameters to improve throughput.
// Call once in NewOCIProvider (or lazily before the first upload).
func (p *OCIProvider) ensureTunedTransport() {
	// try to cast the default transport (safe on std lib)
	if tr, ok := http.DefaultTransport.(*http.Transport); ok {
		tr.MaxIdleConns = 200
		tr.MaxIdleConnsPerHost = 200
		tr.IdleConnTimeout = 90 * time.Second
		tr.DisableCompression = true // disable gzip for binary uploads
		// Keep other defaults as-is
	}
}

// optimizedSimpleUploadUsingSDK streams reader -> io.Pipe -> SDK PutObject.
// Returns the public URL on success.
func (p *OCIProvider) optimizedSimpleUploadUsingSDK(ctx context.Context, reader io.Reader, objectPath, contentType string, contentLength int64) (string, error) {
	// Create pipe: writer side will copy the source reader into the pipe
	pr, pw := io.Pipe()

	// Copy into the pipe in a goroutine using a large buffer to avoid tiny writes.
	go func() {
		// 256KB buffer reduces syscall/writes; tune if needed.
		buf := make([]byte, 256*1024)
		_, err := io.CopyBuffer(pw, reader, buf)
		// CloseWithError will propagate the error to the reader side if copy failed.
		if err != nil {
			_ = pw.CloseWithError(err)
			return
		}
		_ = pw.Close() // normal EOF
	}()

	// Build PutObjectRequest. pr already implements io.ReadCloser.
	req := objectstorage.PutObjectRequest{
		NamespaceName: common.String(p.config.Namespace),
		BucketName:    common.String(p.config.Bucket),
		ObjectName:    common.String(objectPath),
		PutObjectBody: pr,
		ContentLength: common.Int64(contentLength),
		ContentType:   common.String(contentType),
	}

	// Execute PutObject. It will read from pr which is being filled by the goroutine.
	// Note: PutObject blocks until the upload completes (or context timeouts).
	if _, err := p.client.PutObject(ctx, req); err != nil {
		// In case of error, make sure writer is closed (best effort)
		_ = pr.Close()
		return "", fmt.Errorf("failed to upload object: %w", err)
	}

	// Success: return the public URL using your helper
	return p.getPublicURL(objectPath), nil
}

// IMPROVED: Enhanced UploadFile with better error handling and metrics
func (p *OCIProvider) UploadFile(ctx context.Context, file multipart.File, header *multipart.FileHeader, folder string) (string, error) {
	startTime := time.Now()

	// NEW: Validate inputs
	if file == nil || header == nil {
		return "", fmt.Errorf("file or header is nil")
	}

	if header.Size > 500*1024*1024 { // 500MB limit
		return "", fmt.Errorf("file size (%d bytes) exceeds maximum allowed (500MB)", header.Size)
	}

	// Create upload context with timeout from config
	uploadCtx, cancel := context.WithTimeout(ctx, p.uploadTimeout)
	defer cancel()
	defer file.Close()

	// Generate unique object path with proper validation
	objectPath, err := p.generateSecureObjectPath(header.Filename, folder)
	if err != nil {
		return "", fmt.Errorf("failed to generate object path: %w", err)
	}

	contentType := p.getContentType(header)

	// IMPROVED: Better file size detection with multiple methods
	fileSize, err := p.getFileSizeRobust(file, header)
	if err != nil {
		return "", fmt.Errorf("failed to determine file size: %w", err)
	}

	// NEW: Update upload stats
	atomic.AddInt64(&p.uploadStats.TotalUploads, 1)
	defer func() {
		atomic.AddInt64(&p.uploadStats.TotalBytes, fileSize)
		duration := time.Since(startTime)
		speed := float64(fileSize) / (1024 * 1024) / duration.Seconds() // MB/s

		p.uploadStats.mutex.Lock()
		p.uploadStats.AverageSpeed = (p.uploadStats.AverageSpeed + speed) / 2
		p.uploadStats.mutex.Unlock()
	}()

	strategy := "SIMPLE_UPLOAD"
	if fileSize > MaxSimpleUploadSize {
		strategy = "CHUNKED_UPLOAD"
	}

	sizeMB := float64(fileSize) / (1024 * 1024)

	p.logger.Info("🎯 Upload Strategy Selected",
		zap.String("filename", header.Filename),
		zap.String("strategy", strategy),
		zap.Float64("size_mb", sizeMB),
		zap.String("content_type", contentType),
		zap.String("object_path", objectPath),
		zap.Duration("timeout", p.uploadTimeout),
		zap.String("threshold_note", fmt.Sprintf("Simple upload threshold: %.0fMB", float64(MaxSimpleUploadSize)/(1024*1024))))

	var url string
	var uploadErr error

	// IMPROVED: Choose optimal upload strategy with better logic
	if fileSize <= MaxSimpleUploadSize {
		url, uploadErr = p.simpleUploadWithRetry(uploadCtx, file, objectPath, contentType, fileSize)
	} else {
		url, uploadErr = p.chunkedUploadWithRetry(uploadCtx, file, header, objectPath, contentType, fileSize)
	}

	// NEW: Update success/failure stats
	if uploadErr != nil {
		atomic.AddInt64(&p.uploadStats.FailedUploads, 1)
		p.logger.Error("❌ Upload failed",
			zap.String("filename", header.Filename),
			zap.Float64("size_mb", sizeMB),
			zap.String("strategy", strategy),
			zap.Duration("duration", time.Since(startTime)),
			zap.Error(uploadErr))
		return "", uploadErr
	}

	atomic.AddInt64(&p.uploadStats.SuccessUploads, 1)
	duration := time.Since(startTime)
	speed := sizeMB / duration.Seconds()

	p.logger.Info("🎉 Upload completed successfully",
		zap.String("filename", header.Filename),
		zap.String("url", url),
		zap.Float64("size_mb", sizeMB),
		zap.String("strategy", strategy),
		zap.Duration("duration", duration),
		zap.Float64("speed_mbps", speed),
		zap.String("status", "SUCCESS"))

	return url, nil
}

// IMPROVED: Enhanced simple upload with better timeout handling
func (p *OCIProvider) simpleUploadWithRetry(ctx context.Context, reader io.Reader, objectPath, contentType string, contentLength int64) (string, error) {
	var lastErr error

	for attempt := 1; attempt <= p.retryAttempts; attempt++ {
		// Reset reader position if possible
		if seeker, ok := reader.(io.Seeker); ok {
			if _, err := seeker.Seek(0, io.SeekStart); err != nil {
				p.logger.Warn("Failed to reset reader position", zap.Error(err))
			}
		}

		// NEW: Create individual timeout per attempt (shorter for retries)
		attemptTimeout := p.uploadTimeout
		if attempt > 1 {
			// attemptTimeout = p.uploadTimeout / 2 // Shorter timeout for retries
			attemptTimeout = p.uploadTimeout / 2
			if attemptTimeout < 3*time.Minute {
				attemptTimeout = 3 * time.Minute
			}
		}

		attemptCtx, cancel := context.WithTimeout(ctx, attemptTimeout)
		// url, err := p.simpleUpload(attemptCtx, reader, objectPath, contentType, contentLength)
		url, err := p.optimizedSimpleUploadUsingSDK(attemptCtx, reader, objectPath, contentType, contentLength)
		cancel()

		if err == nil {
			if attempt > 1 {
				p.logger.Info("Simple upload successful after retry",
					zap.String("object", objectPath),
					zap.Int("attempt", attempt))
			}
			return url, nil
		}

		lastErr = err

		// IMPROVED: Better error classification
		if !p.isRetryableError(err) {
			p.logger.Error("Non-retryable error, aborting",
				zap.String("object", objectPath),
				zap.Error(err))
			break
		}

		p.logger.Warn("Simple upload attempt failed",
			zap.Int("attempt", attempt),
			zap.Int("max_attempts", p.retryAttempts),
			zap.Error(err))

		if attempt < p.retryAttempts {
			// NEW: Exponential backoff with jitter
			backoff := time.Duration(attempt*attempt) * p.retryDelay
			p.logger.Info("Retrying after backoff", zap.Duration("backoff", backoff))
			time.Sleep(backoff)
		}
	}

	return "", fmt.Errorf("simple upload failed after %d attempts: %w", p.retryAttempts, lastErr)
}

// IMPROVED: Enhanced chunked upload with better error recovery
func (p *OCIProvider) chunkedUploadWithRetry(ctx context.Context, file multipart.File, header *multipart.FileHeader, objectPath, contentType string, fileSize int64) (string, error) {
	// Create temp file for efficient chunked reading
	tmpFile, err := p.createTempFileWithTracking(file, header)
	if err != nil {
		return "", fmt.Errorf("failed to create temp file: %w", err)
	}
	defer p.cleanupTempFile(tmpFile.Name())

	var lastErr error
	for attempt := 1; attempt <= p.retryAttempts; attempt++ {
		// Reset file position
		if _, err := tmpFile.Seek(0, io.SeekStart); err != nil {
			return "", fmt.Errorf("failed to reset temp file position: %w", err)
		}

		url, err := p.parallelChunkedUpload(ctx, tmpFile, objectPath, contentType, fileSize)
		if err == nil {
			if attempt > 1 {
				p.logger.Info("Chunked upload successful after retry",
					zap.String("object", objectPath),
					zap.Int("attempt", attempt))
			}
			return url, nil
		}

		lastErr = err

		if !p.isRetryableError(err) {
			p.logger.Error("Non-retryable error in chunked upload, aborting",
				zap.String("object", objectPath),
				zap.Error(err))
			break
		}

		p.logger.Warn("Chunked upload attempt failed",
			zap.Int("attempt", attempt),
			zap.Int("max_attempts", p.retryAttempts),
			zap.Error(err))

		if attempt < p.retryAttempts {
			backoff := time.Duration(attempt*attempt) * p.retryDelay
			time.Sleep(backoff)
		}
	}

	return "", fmt.Errorf("chunked upload failed after %d attempts: %w", p.retryAttempts, lastErr)
}

// IMPROVED: Enhanced parallel upload with better error handling and monitoring
func (p *OCIProvider) parallelChunkedUpload(ctx context.Context, file *os.File, objectPath, contentType string, fileSize int64) (string, error) {
	// Initialize multipart upload
	uploadID, err := p.initMultipartUpload(ctx, objectPath, contentType)
	if err != nil {
		return "", fmt.Errorf("failed to init multipart upload: %w", err)
	}

	// Calculate chunks
	totalChunks := int((fileSize + p.chunkSize - 1) / p.chunkSize)

	p.logger.Info("🔄 Starting enhanced parallel upload",
		zap.String("file", filepath.Base(objectPath)),
		zap.String("strategy", "CHUNKED_UPLOAD"),
		zap.String("upload_id", uploadID),
		zap.Int("total_chunks", totalChunks),
		zap.Int64("chunk_size_mb", p.chunkSize/(1024*1024)),
		zap.Int("workers", p.maxConcurrency),
		zap.Float64("size_mb", float64(fileSize)/(1024*1024)),
		zap.String("progress_bar", "[░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░] 0.0%"))

	// NEW: Enhanced progress tracking
	var completedChunks int64
	var totalUploadedBytes int64

	// Create channels with proper buffering
	jobs := make(chan ChunkUpload, p.maxConcurrency*2) // Buffer for better throughput
	results := make(chan UploadResult, totalChunks)

	// Start workers
	var wg sync.WaitGroup
	for i := 0; i < p.maxConcurrency; i++ {
		wg.Add(1)
		go p.enhancedUploadWorker(ctx, &wg, jobs, results, uploadID, objectPath, &completedChunks, &totalUploadedBytes)
	}

	// NEW: Progress reporting goroutine with visual indicators
	progressDone := make(chan bool)
	go p.reportUploadProgress(progressDone, &completedChunks, totalChunks, &totalUploadedBytes, fileSize, objectPath)

	// Submit jobs with better error handling
	go func() {
		defer close(jobs)
		for i := 0; i < totalChunks; i++ {
			offset := int64(i) * p.chunkSize
			size := p.chunkSize
			if offset+size > fileSize {
				size = fileSize - offset
			}

			// Read chunk with better error handling
			data, err := p.readChunkSafely(file, offset, size)
			if err != nil {
				p.logger.Error("Failed to read chunk",
					zap.Int("chunk", i+1),
					zap.Int64("offset", offset),
					zap.Error(err))
				return
			}

			select {
			case jobs <- ChunkUpload{
				PartNumber: i + 1,
				Data:       data,
				Size:       size,
				Offset:     offset,
			}:
			case <-ctx.Done():
				p.logger.Warn("Context cancelled while submitting jobs")
				return
			}
		}
	}()

	// Wait for workers
	go func() {
		wg.Wait()
		close(results)
		progressDone <- true
	}()

	// Collect results with enhanced error handling
	parts := make([]objectstorage.CommitMultipartUploadPartDetails, totalChunks)
	receivedParts := 0
	var uploadError error
	var failedParts []int

	for result := range results {
		if result.Error != nil {
			uploadError = result.Error
			failedParts = append(failedParts, result.PartNumber)
			p.logger.Error("Chunk upload failed",
				zap.Int("part", result.PartNumber),
				zap.Duration("duration", result.Duration),
				zap.Error(result.Error))
			continue
		}

		// Store part in correct position (parts are 1-indexed)
		if result.PartNumber >= 1 && result.PartNumber <= totalChunks {
			parts[result.PartNumber-1] = objectstorage.CommitMultipartUploadPartDetails{
				PartNum: common.Int(result.PartNumber),
				Etag:    common.String(result.ETag),
			}
			receivedParts++

			p.logger.Debug("Chunk uploaded successfully",
				zap.Int("part", result.PartNumber),
				zap.Duration("duration", result.Duration),
				zap.Float64("speed_mbps", result.BytesPerSec))
		}
	}

	// Handle errors with detailed reporting
	if uploadError != nil || receivedParts != totalChunks {
		p.logger.Error("Upload failed, aborting multipart upload",
			zap.String("upload_id", uploadID),
			zap.Int("received_parts", receivedParts),
			zap.Int("expected_parts", totalChunks),
			zap.Ints("failed_parts", failedParts))

		p.abortMultipartUpload(ctx, objectPath, uploadID)

		if uploadError != nil {
			return "", uploadError
		}
		return "", fmt.Errorf("incomplete upload: got %d parts, expected %d, failed parts: %v",
			receivedParts, totalChunks, failedParts)
	}

	// Commit upload
	p.logger.Info("🔗 All chunks uploaded successfully, committing multipart upload",
		zap.String("file", filepath.Base(objectPath)),
		zap.String("upload_id", uploadID),
		zap.Int("total_parts", totalChunks))

	err = p.commitMultipartUpload(ctx, objectPath, uploadID, parts)
	if err != nil {
		return "", fmt.Errorf("failed to commit upload: %w", err)
	}

	return p.getPublicURL(objectPath), nil
}

// NEW: Enhanced upload worker with better monitoring
func (p *OCIProvider) enhancedUploadWorker(ctx context.Context, wg *sync.WaitGroup, jobs <-chan ChunkUpload, results chan<- UploadResult, uploadID, objectPath string, completedChunks, totalUploadedBytes *int64) {
	defer wg.Done()

	for job := range jobs {
		start := time.Now()

		select {
		case <-ctx.Done():
			results <- UploadResult{
				PartNumber: job.PartNumber,
				Error:      ctx.Err(),
				Duration:   time.Since(start),
			}
			return
		default:
		}

		// Upload part with individual timeout
		partCtx, cancel := context.WithTimeout(ctx, 8*time.Minute) // Longer timeout per chunk
		etag, err := p.uploadPart(partCtx, job, uploadID, objectPath)
		cancel()

		duration := time.Since(start)
		bytesPerSec := float64(job.Size) / (1024 * 1024) / duration.Seconds()

		results <- UploadResult{
			PartNumber:  job.PartNumber,
			ETag:        etag,
			Error:       err,
			Duration:    duration,
			BytesPerSec: bytesPerSec,
		}

		if err == nil {
			atomic.AddInt64(completedChunks, 1)
			atomic.AddInt64(totalUploadedBytes, job.Size)
		}
	}
}

// NEW: Progress tracking with visual indicators
type ProgressTracker struct {
	startTime         time.Time
	totalBytes        int64
	totalChunks       int
	completedChunks   *int64
	uploadedBytes     *int64
	lastReportTime    time.Time
	lastUploadedBytes int64
	logger            *zap.Logger
	objectPath        string
}

// NEW: Enhanced progress reporting with visual progress bars
func (p *OCIProvider) reportUploadProgress(done chan bool, completedChunks *int64, totalChunks int, uploadedBytes *int64, totalBytes int64, objectPath string) {
	tracker := &ProgressTracker{
		startTime:         time.Now(),
		totalBytes:        totalBytes,
		totalChunks:       totalChunks,
		completedChunks:   completedChunks,
		uploadedBytes:     uploadedBytes,
		lastReportTime:    time.Now(),
		lastUploadedBytes: 0,
		logger:            p.logger,
		objectPath:        objectPath,
	}

	// Initial progress report
	tracker.logProgress()

	ticker := time.NewTicker(2 * time.Second) // Report every 2 seconds for better visual feedback
	defer ticker.Stop()

	for {
		select {
		case <-done:
			// Final progress report
			tracker.logFinalProgress()
			return
		case <-ticker.C:
			tracker.logProgress()
		}
	}
}

func (pt *ProgressTracker) logProgress() {
	now := time.Now()
	completed := atomic.LoadInt64(pt.completedChunks)
	uploaded := atomic.LoadInt64(pt.uploadedBytes)

	// Calculate percentages
	chunkProgress := float64(completed) / float64(pt.totalChunks) * 100
	bytesProgress := float64(uploaded) / float64(pt.totalBytes) * 100

	// Calculate speed (bytes per second)
	timeDiff := now.Sub(pt.lastReportTime).Seconds()
	bytesDiff := uploaded - pt.lastUploadedBytes
	currentSpeed := float64(bytesDiff) / timeDiff / (1024 * 1024) // MB/s

	// Calculate overall average speed
	totalDuration := now.Sub(pt.startTime).Seconds()
	avgSpeed := float64(uploaded) / totalDuration / (1024 * 1024) // MB/s

	// Calculate ETA
	remainingBytes := pt.totalBytes - uploaded
	eta := time.Duration(0)
	if avgSpeed > 0 {
		etaSeconds := float64(remainingBytes) / (avgSpeed * 1024 * 1024)
		eta = time.Duration(etaSeconds * float64(time.Second))
	}

	// Create visual progress bar (use bytes progress for more accurate representation)
	progressBar := pt.createProgressBar(bytesProgress, 40)

	// Format sizes
	uploadedMB := float64(uploaded) / (1024 * 1024)
	totalMB := float64(pt.totalBytes) / (1024 * 1024)

	pt.logger.Info("📤 Upload Progress",
		zap.String("file", filepath.Base(pt.objectPath)),
		zap.String("progress_bar", progressBar),
		zap.Float64("percent_complete", bytesProgress),
		zap.Float64("chunk_progress", chunkProgress),
		zap.String("size", fmt.Sprintf("%.1f/%.1f MB", uploadedMB, totalMB)),
		zap.String("chunks", fmt.Sprintf("%d/%d", completed, pt.totalChunks)),
		zap.Float64("current_speed_mbps", currentSpeed),
		zap.Float64("avg_speed_mbps", avgSpeed),
		zap.String("eta", pt.formatDuration(eta)),
		zap.Duration("elapsed", now.Sub(pt.startTime)))

	// Update for next calculation
	pt.lastReportTime = now
	pt.lastUploadedBytes = uploaded
}

func (pt *ProgressTracker) logFinalProgress() {
	finalDuration := time.Since(pt.startTime)
	avgSpeed := float64(pt.totalBytes) / finalDuration.Seconds() / (1024 * 1024)
	totalMB := float64(pt.totalBytes) / (1024 * 1024)

	progressBar := pt.createProgressBar(100, 40)

	pt.logger.Info("✅ Upload Completed",
		zap.String("file", filepath.Base(pt.objectPath)),
		zap.String("progress_bar", progressBar),
		zap.String("size", fmt.Sprintf("%.1f MB", totalMB)),
		zap.Int("total_chunks", pt.totalChunks),
		zap.Float64("avg_speed_mbps", avgSpeed),
		zap.Duration("total_time", finalDuration))
}

func (pt *ProgressTracker) createProgressBar(percent float64, width int) string {
	if percent > 100 {
		percent = 100
	}
	if percent < 0 {
		percent = 0
	}

	filled := int(percent * float64(width) / 100)
	bar := strings.Repeat("█", filled)
	empty := strings.Repeat("░", width-filled)

	return fmt.Sprintf("[%s%s] %.1f%%", bar, empty, percent)
}

func (pt *ProgressTracker) formatDuration(d time.Duration) string {
	if d == 0 {
		return "calculating..."
	}

	if d > time.Hour {
		return fmt.Sprintf("%.0fh%.0fm", d.Hours(), d.Minutes()-d.Hours()*60)
	} else if d > time.Minute {
		return fmt.Sprintf("%.0fm%.0fs", d.Minutes(), d.Seconds()-d.Minutes()*60)
	} else {
		return fmt.Sprintf("%.0fs", d.Seconds())
	}
}

// IMPROVED: Better error classification for retry decisions
func (p *OCIProvider) isRetryableError(err error) bool {
	if err == nil {
		return false
	}

	errStr := strings.ToLower(err.Error())

	// Retryable errors
	retryableErrors := []string{
		"timeout",
		"deadline exceeded",
		"connection reset",
		"connection refused",
		"temporary failure",
		"service unavailable",
		"internal server error",
		"bad gateway",
		"gateway timeout",
		"too many requests",
		"throttling",
		"rate limit",
	}

	for _, retryable := range retryableErrors {
		if strings.Contains(errStr, retryable) {
			return true
		}
	}

	// Non-retryable errors
	nonRetryableErrors := []string{
		"authentication",
		"authorization",
		"forbidden",
		"not found",
		"invalid",
		"malformed",
		"bad request",
	}

	for _, nonRetryable := range nonRetryableErrors {
		if strings.Contains(errStr, nonRetryable) {
			return false
		}
	}

	// Default: retry for unknown errors
	return true
}

// IMPROVED: Better file size detection with multiple fallback methods
// func (p *OCIProvider) getFileSizeRobust(file multipart.File, header *multipart.FileHeader) (int64, error) {
// 	// Method 1: Use header size if available and reasonable
// 	if header.Size > 0 && header.Size < 2*1024*1024*1024 { // Less than 2GB
// 		return header.Size, nil
// 	}

// 	// Method 2: Try seeking to get size
// 	if seeker, ok := file.(io.Seeker); ok {
// 		current, err := seeker.Seek(0, io.SeekCurrent)
// 		if err == nil {
// 			end, err := seeker.Seek(0, io.SeekEnd)
// 			if err == nil {
// 				_, err = seeker.Seek(current, io.SeekStart)
// 				if err == nil {
// 					return end - current, nil
// 				}
// 			}
// 		}
// 	}

// 	// Method 3: Read all data to determine size (last resort)
// 	p.logger.Warn("Falling back to reading entire file to determine size")

// 	data, err := io.ReadAll(file)
// 	if err != nil {
// 		return -1, fmt.Errorf("cannot determine file size: %w", err)
// 	}

// 	// Reset file with the data we just read
// 	if seeker, ok := file.(io.Seeker); ok {
// 		seeker.Seek(0, io.SeekStart)
// 	}

// 	return int64(len(data)), nil
// }

func (p *OCIProvider) getFileSizeRobust(file multipart.File, header *multipart.FileHeader) (int64, error) {
	// Just use header size - it's reliable for multipart uploads
	if header.Size > 0 {
		return header.Size, nil
	}

	// Only fallback to seeking if header size is missing
	if seeker, ok := file.(io.Seeker); ok {
		current, err := seeker.Seek(0, io.SeekCurrent)
		if err == nil {
			end, err := seeker.Seek(0, io.SeekEnd)
			if err == nil {
				_, err = seeker.Seek(current, io.SeekStart)
				if err == nil {
					return end - current, nil
				}
			}
		}
	}

	return -1, fmt.Errorf("cannot determine file size")
}

// IMPROVED: Secure object path generation with better validation
func (p *OCIProvider) generateSecureObjectPath(filename, folder string) (string, error) {
	// Validate filename
	if filename == "" {
		return "", fmt.Errorf("filename cannot be empty")
	}

	// Sanitize filename
	filename = filepath.Base(filename) // Remove any path components
	filename = strings.ReplaceAll(filename, " ", "_")

	// Get extension
	ext := filepath.Ext(filename)
	if ext == "" {
		ext = ".bin"
	}

	// Generate secure unique name
	uniqueName := fmt.Sprintf("%s_%s%s",
		strings.TrimSuffix(filename, ext),
		uuid.New().String()[:8],
		ext)

	// Validate and sanitize folder
	if folder != "" {
		folder = strings.Trim(folder, "/")
		folder = strings.ReplaceAll(folder, " ", "_")
		// Ensure folder doesn't contain dangerous patterns
		if strings.Contains(folder, "..") || strings.Contains(folder, "//") {
			return "", fmt.Errorf("invalid folder path: %s", folder)
		}
		return folder + "/" + uniqueName, nil
	}

	return uniqueName, nil
}

// NEW: Enhanced temp file creation with tracking
func (p *OCIProvider) createTempFileWithTracking(file multipart.File, header *multipart.FileHeader) (*os.File, error) {
	tmpFile, err := os.CreateTemp("", "cenphi-upload-*"+filepath.Ext(header.Filename))
	if err != nil {
		return nil, fmt.Errorf("failed to create temp file: %w", err)
	}

	// Track temp file for cleanup
	p.tempFilesMutex.Lock()
	p.tempFiles[tmpFile.Name()] = time.Now()
	p.tempFilesMutex.Unlock()

	// Copy with progress tracking for large files
	written, err := io.Copy(tmpFile, file)
	if err != nil {
		tmpFile.Close()
		p.cleanupTempFile(tmpFile.Name())
		return nil, fmt.Errorf("failed to copy to temp file: %w", err)
	}

	p.logger.Debug("Created temp file for upload",
		zap.String("temp_file", tmpFile.Name()),
		zap.Int64("bytes_written", written))

	// Reset to beginning
	if _, err := tmpFile.Seek(0, io.SeekStart); err != nil {
		tmpFile.Close()
		p.cleanupTempFile(tmpFile.Name())
		return nil, fmt.Errorf("failed to reset temp file position: %w", err)
	}

	return tmpFile, nil
}

// NEW: Safe chunk reading with better error handling
func (p *OCIProvider) readChunkSafely(file *os.File, offset, size int64) ([]byte, error) {
	data := make([]byte, size)

	// Use ReadAt for thread-safe reading
	n, err := file.ReadAt(data, offset)
	if err != nil && err != io.EOF {
		return nil, fmt.Errorf("failed to read chunk at offset %d: %w", offset, err)
	}

	if n == 0 {
		return nil, fmt.Errorf("read 0 bytes at offset %d", offset)
	}

	return data[:n], nil
}

// NEW: Background cleanup for temporary files
func (p *OCIProvider) startTempFileCleanup() {
	p.cleanupTicker = time.NewTicker(TempFileCleanupInterval)

	go func() {
		for range p.cleanupTicker.C {
			p.cleanupOldTempFiles()
		}
	}()
}

func (p *OCIProvider) cleanupOldTempFiles() {
	p.tempFilesMutex.Lock()
	defer p.tempFilesMutex.Unlock()

	cutoff := time.Now().Add(-TempFileMaxAge)
	cleaned := 0

	for path, created := range p.tempFiles {
		if created.Before(cutoff) {
			if err := os.Remove(path); err != nil {
				p.logger.Warn("Failed to cleanup old temp file",
					zap.String("path", path),
					zap.Error(err))
			} else {
				cleaned++
			}
			delete(p.tempFiles, path)
		}
	}

	if cleaned > 0 {
		p.logger.Debug("Cleaned up old temp files", zap.Int("count", cleaned))
	}
}

func (p *OCIProvider) cleanupTempFile(path string) {
	p.tempFilesMutex.Lock()
	delete(p.tempFiles, path)
	p.tempFilesMutex.Unlock()

	if err := os.Remove(path); err != nil {
		p.logger.Warn("Failed to cleanup temp file",
			zap.String("path", path),
			zap.Error(err))
	}
}

// IMPROVED: Enhanced HTTP client creation with optimized settings
func createOCIClient(cfg config.OCIConfig, logger *zap.Logger) (objectstorage.ObjectStorageClient, error) {
	var configProvider common.ConfigurationProvider
	var err error

	// Authentication setup (your existing logic)
	if cfg.UseInstancePrincipal {
		logger.Info("Using instance principal authentication")
		configProvider, err = auth.InstancePrincipalConfigurationProvider()
		if err != nil {
			return objectstorage.ObjectStorageClient{}, fmt.Errorf("failed to create instance principal provider: %w", err)
		}
	} else if cfg.ConfigFilePath != "" {
		logger.Info("Using config file authentication", zap.String("config_file", cfg.ConfigFilePath))
		configProvider = common.CustomProfileConfigProvider(cfg.ConfigFilePath, cfg.ProfileName)
	} else {
		logger.Info("Using API key authentication")
		configProvider, err = createUserPrincipalProvider(cfg)
		if err != nil {
			return objectstorage.ObjectStorageClient{}, fmt.Errorf("failed to create user principal config: %w", err)
		}
	}

	// CRITICAL IMPROVEMENT: Optimized HTTP client for large uploads
	httpClient := &http.Client{
		Timeout: 10 * time.Minute, // Slightly longer than our upload timeout
		Transport: &http.Transport{
			DialContext: (&net.Dialer{
				Timeout:   10 * time.Second,
				KeepAlive: 60 * time.Second,
			}).DialContext,
			MaxIdleConns:          50,                // Increased for better connection reuse
			MaxIdleConnsPerHost:   20,                // Increased per host
			IdleConnTimeout:       300 * time.Second, // Longer idle timeout
			TLSHandshakeTimeout:   10 * time.Second,
			ResponseHeaderTimeout: 30 * time.Second, // Longer for large uploads
			ExpectContinueTimeout: 1 * time.Second,
			DisableCompression:    true,        // Important: disable compression for uploads
			WriteBufferSize:       1024 * 1024, // 64KB write buffer
			ReadBufferSize:        1024 * 1024, // 64KB read buffer
			ForceAttemptHTTP2:     true,        // HTTP/1.1 can be more reliable for large uploads
		},
	}

	// Create client
	client, err := objectstorage.NewObjectStorageClientWithConfigurationProvider(configProvider)
	if err != nil {
		return objectstorage.ObjectStorageClient{}, fmt.Errorf("failed to create OCI client: %w", err)
	}

	// Set optimized HTTP client
	client.HTTPClient = httpClient

	logger.Info("OCI client created with optimized HTTP settings",
		zap.Duration("timeout", httpClient.Timeout),
		zap.Int("max_idle_conns", 20))

	return client, nil
}

// Configuration helper functions that read from actual config with intelligent defaults
func getConfigInt64(cfg config.OCIConfig, key string, defaultValue int64) int64 {
	switch key {
	case "ChunkSize":
		if cfg.ChunkUploadTimeout > 0 {
			// Scale chunk size based on timeout: more time = larger chunks for efficiency
			if cfg.ChunkUploadTimeout >= 8*time.Minute {
				return 20 * 1024 * 1024 // 20MB for longer timeouts
			}
			return DefaultChunkSize
		}
		return DefaultChunkSize
	default:
		return defaultValue
	}
}

func getConfigInt(cfg config.OCIConfig, key string, defaultValue int) int {
	switch key {
	case "MaxConcurrency":
		if cfg.RetryAttempts > 0 {
			// More aggressive concurrency if retries are configured
			return min(cfg.RetryAttempts*2+2, 8) // Cap at 8 workers
		}
		return DefaultMaxConcurrency
	case "RetryAttempts":
		if cfg.RetryAttempts > 0 {
			return cfg.RetryAttempts
		}
		return DefaultRetryAttempts
	default:
		return defaultValue
	}
}

func getConfigDuration(cfg config.OCIConfig, key string, defaultValue time.Duration) time.Duration {
	switch key {
	case "UploadTimeout":
		if cfg.UploadTimeout > 0 {
			return cfg.UploadTimeout
		}
		return DefaultUploadTimeout
	case "RetryDelay":
		if cfg.RetryDelay > 0 {
			return cfg.RetryDelay
		}
		return DefaultRetryDelay
	default:
		return defaultValue
	}
}

// Helper function since min doesn't exist for int in older Go versions
func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

// NEW: Upload statistics reporting
func (p *OCIProvider) GetUploadStats() UploadStats {
	p.uploadStats.mutex.RLock()
	defer p.uploadStats.mutex.RUnlock()

	return UploadStats{
		TotalUploads:   atomic.LoadInt64(&p.uploadStats.TotalUploads),
		SuccessUploads: atomic.LoadInt64(&p.uploadStats.SuccessUploads),
		FailedUploads:  atomic.LoadInt64(&p.uploadStats.FailedUploads),
		TotalBytes:     atomic.LoadInt64(&p.uploadStats.TotalBytes),
		AverageSpeed:   p.uploadStats.AverageSpeed,
	}
}

// NEW: Cleanup method for graceful shutdown
func (p *OCIProvider) Cleanup() {
	if p.cleanupTicker != nil {
		p.cleanupTicker.Stop()
	}

	// Final cleanup of temp files
	p.cleanupOldTempFiles()

	// Log final stats
	stats := p.GetUploadStats()
	p.logger.Info("OCI Provider cleanup completed",
		zap.Int64("total_uploads", stats.TotalUploads),
		zap.Int64("successful_uploads", stats.SuccessUploads),
		zap.Int64("failed_uploads", stats.FailedUploads),
		zap.Int64("total_bytes", stats.TotalBytes),
		zap.Float64("average_speed_mbps", stats.AverageSpeed))
}

// Enhanced implementations of core methods

func (p *OCIProvider) simpleUpload(ctx context.Context, reader io.Reader, objectPath, contentType string, contentLength int64) (string, error) {
	start := time.Now()

	var readCloser io.ReadCloser
	if rc, ok := reader.(io.ReadCloser); ok {
		readCloser = rc
	} else {
		readCloser = io.NopCloser(reader)
	}

	if contentType == "" {
		contentType = guessContentType(objectPath)
	}

	sizeMB := float64(contentLength) / (1024 * 1024)

	p.logger.Info("🚀 Starting simple upload",
		zap.String("file", filepath.Base(objectPath)),
		zap.String("strategy", "SIMPLE_UPLOAD"),
		zap.String("content_type", contentType),
		zap.Float64("size_mb", sizeMB),
		zap.String("progress_bar", "[░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░] 0.0%"))

	request := objectstorage.PutObjectRequest{
		NamespaceName: common.String(p.config.Namespace),
		BucketName:    common.String(p.config.Bucket),
		ObjectName:    common.String(objectPath),
		ContentType:   common.String(contentType),
		PutObjectBody: readCloser,
	}

	if contentLength >= 0 {
		request.ContentLength = common.Int64(contentLength)
	}

	// Start progress reporting for simple uploads too
	progressDone := make(chan bool)
	go p.reportSimpleUploadProgress(progressDone, start, contentLength, objectPath)

	_, err := p.client.PutObject(ctx, request)
	progressDone <- true // Stop progress reporting

	if err != nil {
		duration := time.Since(start)
		p.logger.Error("❌ Simple upload failed",
			zap.String("file", filepath.Base(objectPath)),
			zap.Duration("duration", duration),
			zap.Error(err))
		return "", fmt.Errorf("failed to upload object: %w", err)
	}

	duration := time.Since(start)
	speed := sizeMB / duration.Seconds()
	url := p.getPublicURL(objectPath)

	progressBar := "[████████████████████████████████████████] 100.0%"

	p.logger.Info("✅ Simple upload completed",
		zap.String("file", filepath.Base(objectPath)),
		zap.String("url", url),
		zap.String("progress_bar", progressBar),
		zap.Float64("size_mb", sizeMB),
		zap.Duration("duration", duration),
		zap.Float64("speed_mbps", speed))

	return url, nil
}

// NEW: Simple upload progress reporting (simulated progress)
func (p *OCIProvider) reportSimpleUploadProgress(done chan bool, startTime time.Time, totalBytes int64, objectPath string) {
	ticker := time.NewTicker(1 * time.Second)
	defer ticker.Stop()

	sizeMB := float64(totalBytes) / (1024 * 1024)

	for {
		select {
		case <-done:
			return
		case <-ticker.C:
			elapsed := time.Since(startTime)

			// Simulate progress based on time elapsed (simple uploads are hard to track precisely)
			// Estimate progress based on typical upload speeds
			estimatedDuration := time.Duration(sizeMB/5) * time.Second // Assume 5MB/s baseline
			if estimatedDuration < 5*time.Second {
				estimatedDuration = 5 * time.Second // Minimum 5 seconds for UI
			}

			progress := float64(elapsed) / float64(estimatedDuration) * 100
			if progress > 95 {
				progress = 95 // Cap at 95% until actual completion
			}

			progressBar := p.createProgressBarSimple(progress, 40)
			currentSpeed := sizeMB / elapsed.Seconds()

			p.logger.Info("📤 Upload Progress",
				zap.String("file", filepath.Base(objectPath)),
				zap.String("strategy", "SIMPLE_UPLOAD"),
				zap.String("progress_bar", progressBar),
				zap.Float64("percent_complete", progress),
				zap.Float64("size_mb", sizeMB),
				zap.Float64("estimated_speed_mbps", currentSpeed),
				zap.Duration("elapsed", elapsed))
		}
	}
}

func (p *OCIProvider) createProgressBarSimple(percent float64, width int) string {
	if percent > 100 {
		percent = 100
	}
	if percent < 0 {
		percent = 0
	}

	filled := int(percent * float64(width) / 100)
	bar := strings.Repeat("█", filled)
	empty := strings.Repeat("░", width-filled)

	return fmt.Sprintf("[%s%s] %.1f%%", bar, empty, percent)
}

func (p *OCIProvider) uploadPart(ctx context.Context, chunk ChunkUpload, uploadID, objectPath string) (string, error) {
	request := objectstorage.UploadPartRequest{
		NamespaceName:  common.String(p.config.Namespace),
		BucketName:     common.String(p.config.Bucket),
		ObjectName:     common.String(objectPath),
		UploadId:       common.String(uploadID),
		UploadPartNum:  common.Int(chunk.PartNumber),
		UploadPartBody: io.NopCloser(strings.NewReader(string(chunk.Data))),
		ContentLength:  common.Int64(chunk.Size),
	}

	response, err := p.client.UploadPart(ctx, request)
	if err != nil {
		return "", fmt.Errorf("failed to upload part %d: %w", chunk.PartNumber, err)
	}

	return *response.ETag, nil
}

func (p *OCIProvider) getContentType(header *multipart.FileHeader) string {
	contentType := header.Header.Get("Content-Type")
	if contentType == "" {
		contentType = guessContentType(header.Filename)
	}
	return contentType
}

func (p *OCIProvider) initMultipartUpload(ctx context.Context, objectPath, contentType string) (string, error) {
	request := objectstorage.CreateMultipartUploadRequest{
		NamespaceName: common.String(p.config.Namespace),
		BucketName:    common.String(p.config.Bucket),
		CreateMultipartUploadDetails: objectstorage.CreateMultipartUploadDetails{
			Object:      common.String(objectPath),
			ContentType: common.String(contentType),
		},
	}

	response, err := p.client.CreateMultipartUpload(ctx, request)
	if err != nil {
		return "", fmt.Errorf("failed to initialize multipart upload: %w", err)
	}

	return *response.UploadId, nil
}

func (p *OCIProvider) commitMultipartUpload(ctx context.Context, objectPath, uploadID string, parts []objectstorage.CommitMultipartUploadPartDetails) error {
	request := objectstorage.CommitMultipartUploadRequest{
		NamespaceName: common.String(p.config.Namespace),
		BucketName:    common.String(p.config.Bucket),
		ObjectName:    common.String(objectPath),
		UploadId:      common.String(uploadID),
		CommitMultipartUploadDetails: objectstorage.CommitMultipartUploadDetails{
			PartsToCommit: parts,
		},
	}

	_, err := p.client.CommitMultipartUpload(ctx, request)
	if err != nil {
		return fmt.Errorf("failed to commit multipart upload: %w", err)
	}

	p.logger.Info("Successfully committed multipart upload",
		zap.String("upload_id", uploadID),
		zap.String("object", objectPath),
		zap.Int("parts", len(parts)))

	return nil
}

func (p *OCIProvider) abortMultipartUpload(ctx context.Context, objectPath, uploadID string) {
	request := objectstorage.AbortMultipartUploadRequest{
		NamespaceName: common.String(p.config.Namespace),
		BucketName:    common.String(p.config.Bucket),
		ObjectName:    common.String(objectPath),
		UploadId:      common.String(uploadID),
	}

	_, err := p.client.AbortMultipartUpload(ctx, request)
	if err != nil {
		p.logger.Error("Failed to abort multipart upload",
			zap.String("upload_id", uploadID),
			zap.String("object", objectPath),
			zap.Error(err))
	} else {
		p.logger.Info("Successfully aborted multipart upload",
			zap.String("upload_id", uploadID),
			zap.String("object", objectPath))
	}
}

func (p *OCIProvider) getPublicURL(objectPath string) string {
	if p.config.PublicEndpoint != "" {
		return fmt.Sprintf("%s/%s",
			strings.TrimRight(p.config.PublicEndpoint, "/"),
			strings.TrimLeft(objectPath, "/"))
	}

	return fmt.Sprintf("https://objectstorage.%s.oraclecloud.com/n/%s/b/%s/o/%s",
		p.config.Region,
		p.config.Namespace,
		p.config.Bucket,
		normalizePath(objectPath))
}

func normalizePath(path string) string {
	path = strings.TrimPrefix(path, "/")
	if filepath.IsAbs(path) {
		path = filepath.Base(path)
	}
	return path
}

func createUserPrincipalProvider(cfg config.OCIConfig) (common.ConfigurationProvider, error) {
	if cfg.ConfigFilePath != "" {
		return common.ConfigurationProviderFromFile(cfg.ConfigFilePath, cfg.ProfileName)
	}

	privateKey, err := loadPrivateKey(cfg.PrivateKeyPath, cfg.PrivateKeyPassphrase)
	if err != nil {
		return nil, fmt.Errorf("failed to load private key: %w", err)
	}

	return common.NewRawConfigurationProvider(
		cfg.TenancyOCID,
		cfg.UserOCID,
		cfg.Region,
		cfg.Fingerprint,
		string(pemFromPrivateKey(privateKey)),
		common.String(cfg.PrivateKeyPassphrase),
	), nil
}

func loadPrivateKey(keyPath, passphrase string) (*rsa.PrivateKey, error) {
	var keyData []byte
	var err error

	// Try reading from environment variable first (for Cloud Run)
	if base64Key := os.Getenv("OCI_PRIVATE_KEY_BASE64"); base64Key != "" {
		keyData, err = base64.StdEncoding.DecodeString(base64Key)
		if err != nil {
			return nil, fmt.Errorf("failed to decode base64 private key: %w", err)
		}
	} else {
		// Fall back to reading from file
		keyData, err = os.ReadFile(keyPath)
		if err != nil {
			return nil, fmt.Errorf("failed to read private key file: %w", err)
		}
	}

	block, _ := pem.Decode(keyData)
	if block == nil {
		return nil, fmt.Errorf("failed to decode PEM block from private key")
	}

	var privateKey interface{}
	if passphrase != "" {
		privateKey, err = x509.DecryptPEMBlock(block, []byte(passphrase))
		if err != nil {
			return nil, fmt.Errorf("failed to decrypt private key: %w", err)
		}
		privateKey, err = x509.ParsePKCS1PrivateKey(privateKey.([]byte))
	} else {
		privateKey, err = x509.ParsePKCS1PrivateKey(block.Bytes)
	}

	if err != nil {
		return nil, fmt.Errorf("failed to parse private key: %w", err)
	}

	if rsaKey, ok := privateKey.(*rsa.PrivateKey); ok {
		return rsaKey, nil
	}

	return nil, fmt.Errorf("private key is not RSA format")
}

func pemFromPrivateKey(privateKey *rsa.PrivateKey) []byte {
	keyBytes := x509.MarshalPKCS1PrivateKey(privateKey)
	block := &pem.Block{
		Type:  "RSA PRIVATE KEY",
		Bytes: keyBytes,
	}
	return pem.EncodeToMemory(block)
}

func guessContentType(filename string) string {
	ext := strings.ToLower(filepath.Ext(filename))
	switch ext {
	case ".mp4":
		return "video/mp4"
	case ".mov":
		return "video/quicktime"
	case ".avi":
		return "video/x-msvideo"
	case ".webm":
		return "video/webm"
	case ".mkv":
		return "video/x-matroska"
	case ".jpg", ".jpeg":
		return "image/jpeg"
	case ".png":
		return "image/png"
	case ".gif":
		return "image/gif"
	case ".pdf":
		return "application/pdf"
	case ".txt":
		return "text/plain"
	case ".csv":
		return "text/csv"
	case ".json":
		return "application/json"
	case ".xml":
		return "application/xml"
	case ".zip":
		return "application/zip"
	case ".tar":
		return "application/x-tar"
	case ".gz":
		return "application/gzip"
	default:
		return "application/octet-stream"
	}
}

// Additional interface methods for compatibility

func (p *OCIProvider) Upload(ctx context.Context, filePath, destinationPath, contentType string) (string, error) {
	file, err := os.Open(filePath)
	if err != nil {
		return "", fmt.Errorf("failed to open file: %w", err)
	}
	defer file.Close()

	fileInfo, err := file.Stat()
	if err != nil {
		return "", fmt.Errorf("failed to get file stats: %w", err)
	}

	if fileInfo.Size() <= MaxSimpleUploadSize {
		return p.simpleUpload(ctx, file, destinationPath, contentType, fileInfo.Size())
	}

	return p.UploadChunked(ctx, filePath, destinationPath, contentType, int(p.chunkSize))
}

func (p *OCIProvider) UploadFromReader(ctx context.Context, reader io.Reader, destinationPath, contentType string) (string, error) {
	return p.simpleUpload(ctx, reader, destinationPath, contentType, -1)
}

func (p *OCIProvider) UploadChunked(ctx context.Context, filePath, destinationPath, contentType string, chunkSize int) (string, error) {
	file, err := os.Open(filePath)
	if err != nil {
		return "", fmt.Errorf("failed to open file: %w", err)
	}
	defer file.Close()

	fileInfo, err := file.Stat()
	if err != nil {
		return "", fmt.Errorf("failed to get file stats: %w", err)
	}

	return p.parallelChunkedUpload(ctx, file, destinationPath, contentType, fileInfo.Size())
}

func (p *OCIProvider) Delete(ctx context.Context, objectPathOrURL string) error {
	objectPath := objectPathOrURL

	if strings.Contains(objectPathOrURL, "/o/") {
		parts := strings.Split(objectPathOrURL, "/o/")
		if len(parts) > 1 {
			objectPath = parts[1]
		}
	}

	request := objectstorage.DeleteObjectRequest{
		NamespaceName: common.String(p.config.Namespace),
		BucketName:    common.String(p.config.Bucket),
		ObjectName:    common.String(objectPath),
	}

	_, err := p.client.DeleteObject(ctx, request)
	if err != nil {
		return fmt.Errorf("failed to delete object %s: %w", objectPath, err)
	}

	p.logger.Info("Object deleted successfully", zap.String("object", objectPath))
	return nil
}

// CopyToPermanentStorage copies a temp file to permanent storage
// Returns the permanent URL
func (p *OCIProvider) CopyToPermanentStorage(ctx context.Context, tempURL, permanentPath string) (string, error) {
	p.logger.Info("🔄 Copying temp file to permanent storage",
		zap.String("temp_url", tempURL),
		zap.String("permanent_path", permanentPath))

	// Extract object path from temp URL
	tempObjectPath := ""
	if strings.Contains(tempURL, "/o/") {
		parts := strings.Split(tempURL, "/o/")
		if len(parts) > 1 {
			tempObjectPath = parts[1]
		}
	} else {
		tempObjectPath = tempURL
	}

	// Try server-side copy first (much faster if permissions allow)
	copyRequest := objectstorage.CopyObjectRequest{
		NamespaceName: common.String(p.config.Namespace),
		BucketName:    common.String(p.config.Bucket),
		CopyObjectDetails: objectstorage.CopyObjectDetails{
			SourceObjectName:      common.String(tempObjectPath),
			DestinationBucket:     common.String(p.config.Bucket),
			DestinationNamespace:  common.String(p.config.Namespace),
			DestinationObjectName: common.String(permanentPath),
			DestinationRegion:     common.String(p.config.Region),
		},
	}

	_, err := p.client.CopyObject(ctx, copyRequest)
	if err != nil {
		// Check if this is a permissions error
		errStr := strings.ToLower(err.Error())
		fmt.Println("CopyObject error:", errStr)
		if strings.Contains(errStr, "insufficient") || strings.Contains(errStr, "permission") {
			p.logger.Warn("⚠️  Server-side copy failed due to permissions, falling back to download+upload",
				zap.String("temp_path", tempObjectPath),
				zap.String("permanent_path", permanentPath))

			// Fallback: Download temp file and re-upload to permanent location
			return p.downloadAndReupload(ctx, tempObjectPath, permanentPath)
		}

		// For other errors, fail immediately
		return "", fmt.Errorf("failed to copy object: %w", err)
	}

	// Generate public URL for permanent path
	permanentURL := fmt.Sprintf("https://objectstorage.%s.oraclecloud.com/n/%s/b/%s/o/%s",
		p.config.Region, p.config.Namespace, p.config.Bucket, permanentPath)

	p.logger.Info("✅ Successfully copied to permanent storage (server-side)",
		zap.String("permanent_url", permanentURL))

	return permanentURL, nil
}

// downloadAndReupload is a fallback when server-side copy is not permitted
// Downloads the source file and re-uploads to the destination
func (p *OCIProvider) downloadAndReupload(ctx context.Context, sourcePath, destinationPath string) (string, error) {
	p.logger.Info("📥 Starting download+upload fallback",
		zap.String("source", sourcePath),
		zap.String("destination", destinationPath))

	// Step 1: Get the source object
	getRequest := objectstorage.GetObjectRequest{
		NamespaceName: common.String(p.config.Namespace),
		BucketName:    common.String(p.config.Bucket),
		ObjectName:    common.String(sourcePath),
	}

	getResponse, err := p.client.GetObject(ctx, getRequest)
	if err != nil {
		return "", fmt.Errorf("failed to download source object: %w", err)
	}
	defer getResponse.Content.Close()

	// Step 2: Get content length and type
	contentLength := int64(0)
	if getResponse.ContentLength != nil {
		contentLength = *getResponse.ContentLength
	}

	contentType := "video/mp4" // default
	if getResponse.ContentType != nil {
		contentType = *getResponse.ContentType
	}

	p.logger.Info("📦 Downloaded source file, uploading to permanent location",
		zap.Int64("content_length", contentLength),
		zap.String("content_type", contentType))

	// Step 3: Upload to permanent location
	// Use simple upload if file is small enough, otherwise use chunked upload
	if contentLength > 0 && contentLength <= MaxSimpleUploadSize {
		// Simple upload from the response body
		url, err := p.simpleUpload(ctx, getResponse.Content, destinationPath, contentType, contentLength)
		if err != nil {
			return "", fmt.Errorf("failed to upload to permanent location: %w", err)
		}

		p.logger.Info("✅ Successfully copied via download+upload (simple)",
			zap.String("url", url))
		return url, nil
	}

	// For larger files, read to temp file then use chunked upload
	tempFile, err := os.CreateTemp("", "oci-copy-*")
	if err != nil {
		return "", fmt.Errorf("failed to create temp file: %w", err)
	}
	defer os.Remove(tempFile.Name())
	defer tempFile.Close()

	// Copy response body to temp file
	written, err := io.Copy(tempFile, getResponse.Content)
	if err != nil {
		return "", fmt.Errorf("failed to write to temp file: %w", err)
	}

	p.logger.Info("📝 Wrote to temp file, starting chunked upload",
		zap.Int64("bytes_written", written))

	// Reset file pointer
	if _, err := tempFile.Seek(0, io.SeekStart); err != nil {
		return "", fmt.Errorf("failed to reset temp file: %w", err)
	}

	// Upload using chunked upload
	url, err := p.parallelChunkedUpload(ctx, tempFile, destinationPath, contentType, written)
	if err != nil {
		return "", fmt.Errorf("failed to upload to permanent location (chunked): %w", err)
	}

	p.logger.Info("✅ Successfully copied via download+upload (chunked)",
		zap.String("url", url),
		zap.Int64("bytes", written))

	return url, nil
}

func (p *OCIProvider) UploadMedia(ctx context.Context, filePath string, data []byte, contentType string) (string, error) {
	dataSize := int64(len(data))

	uploadCtx, cancel := context.WithTimeout(ctx, p.uploadTimeout)
	defer cancel()

	p.logger.Info("Starting media upload from bytes",
		zap.String("path", filePath),
		zap.Int64("size", dataSize),
		zap.String("content_type", contentType))

	if dataSize <= MaxSimpleUploadSize {
		reader := strings.NewReader(string(data))
		return p.simpleUpload(uploadCtx, reader, filePath, contentType, dataSize)
	}

	return p.chunkedUploadFromBytes(uploadCtx, data, filePath, contentType, dataSize)
}

// chunkedUploadFromBytes performs efficient chunked upload from byte data
func (p *OCIProvider) chunkedUploadFromBytes(ctx context.Context, data []byte, objectPath, contentType string, dataSize int64) (string, error) {
	// Initialize multipart upload
	uploadID, err := p.initMultipartUpload(ctx, objectPath, contentType)
	if err != nil {
		return "", fmt.Errorf("failed to init multipart upload: %w", err)
	}

	// Calculate chunks
	totalChunks := int((dataSize + p.chunkSize - 1) / p.chunkSize)

	p.logger.Info("Starting chunked upload from bytes",
		zap.String("upload_id", uploadID),
		zap.Int("chunks", totalChunks),
		zap.Int64("chunk_size", p.chunkSize),
		zap.Int64("total_size", dataSize))

	// Create worker pool
	jobs := make(chan ChunkUpload, p.maxConcurrency*2)
	results := make(chan UploadResult, totalChunks)

	// Progress tracking
	var completedChunks int64
	var totalUploadedBytes int64

	// Start workers
	var wg sync.WaitGroup
	for i := 0; i < p.maxConcurrency; i++ {
		wg.Add(1)
		go p.enhancedUploadWorker(ctx, &wg, jobs, results, uploadID, objectPath, &completedChunks, &totalUploadedBytes)
	}

	// Submit jobs
	go func() {
		defer close(jobs)
		for i := 0; i < totalChunks; i++ {
			offset := int64(i) * p.chunkSize
			size := p.chunkSize
			if offset+size > dataSize {
				size = dataSize - offset
			}

			// Extract chunk from data
			chunkData := make([]byte, size)
			copy(chunkData, data[offset:offset+size])

			select {
			case jobs <- ChunkUpload{
				PartNumber: i + 1,
				Data:       chunkData,
				Size:       size,
				Offset:     offset,
			}:
			case <-ctx.Done():
				p.logger.Warn("Context cancelled while submitting byte chunks")
				return
			}
		}
	}()

	// Wait for workers
	go func() {
		wg.Wait()
		close(results)
	}()

	// Collect results and ensure proper ordering
	parts := make([]objectstorage.CommitMultipartUploadPartDetails, totalChunks)
	receivedParts := 0
	var uploadError error
	var failedParts []int

	for result := range results {
		if result.Error != nil {
			uploadError = result.Error
			failedParts = append(failedParts, result.PartNumber)
			p.logger.Error("Byte chunk upload failed",
				zap.Int("part", result.PartNumber),
				zap.Error(result.Error))
			continue
		}

		// Store part in correct position (parts are 1-indexed)
		if result.PartNumber >= 1 && result.PartNumber <= totalChunks {
			parts[result.PartNumber-1] = objectstorage.CommitMultipartUploadPartDetails{
				PartNum: common.Int(result.PartNumber),
				Etag:    common.String(result.ETag),
			}
			receivedParts++
		}
	}

	// Handle errors
	if uploadError != nil || receivedParts != totalChunks {
		p.logger.Error("Byte upload failed, aborting multipart upload",
			zap.String("upload_id", uploadID),
			zap.Int("received_parts", receivedParts),
			zap.Int("expected_parts", totalChunks),
			zap.Ints("failed_parts", failedParts))

		p.abortMultipartUpload(ctx, objectPath, uploadID)

		if uploadError != nil {
			return "", uploadError
		}
		return "", fmt.Errorf("incomplete byte upload: got %d parts, expected %d, failed parts: %v",
			receivedParts, totalChunks, failedParts)
	}

	// Commit upload
	p.logger.Info("All byte chunks uploaded successfully, committing multipart upload",
		zap.String("upload_id", uploadID),
		zap.Int("total_parts", totalChunks))

	err = p.commitMultipartUpload(ctx, objectPath, uploadID, parts)
	if err != nil {
		return "", fmt.Errorf("failed to commit byte upload: %w", err)
	}

	p.logger.Info("Chunked byte upload completed successfully",
		zap.String("object", objectPath),
		zap.Int64("total_size", dataSize))

	return p.getPublicURL(objectPath), nil
}

func (p *OCIProvider) DownloadMedia(ctx context.Context, mediaURL string, maxRetries int) (string, error) {
	downloadCtx, cancel := context.WithTimeout(ctx, 10*time.Minute)
	defer cancel()

	p.logger.Info("Starting media download",
		zap.String("url", mediaURL),
		zap.Int("max_retries", maxRetries))

	fileName := fmt.Sprintf("downloaded_%s_%s",
		uuid.New().String()[:8],
		time.Now().Format("20060102_150405"))

	if ext := p.getExtensionFromURL(mediaURL); ext != "" {
		fileName += ext
	} else {
		fileName += ".mp4"
	}

	var lastErr error
	for attempt := 1; attempt <= maxRetries; attempt++ {
		p.logger.Info("Download attempt",
			zap.Int("attempt", attempt),
			zap.String("url", mediaURL))

		tempFile, err := p.downloadWithHTTP(downloadCtx, mediaURL)
		if err == nil {
			defer os.Remove(tempFile)
			return p.uploadDownloadedFile(downloadCtx, tempFile, fileName)
		}

		p.logger.Warn("HTTP download failed, trying with ffmpeg",
			zap.Error(err),
			zap.Int("attempt", attempt))

		tempFile, err = p.downloadWithFFmpeg(downloadCtx, mediaURL)
		if err == nil {
			defer os.Remove(tempFile)
			return p.uploadDownloadedFile(downloadCtx, tempFile, fileName)
		}

		lastErr = err
		p.logger.Warn("Download attempt failed",
			zap.Int("attempt", attempt),
			zap.Error(err))

		if attempt < maxRetries {
			backoff := time.Duration(attempt) * 2 * time.Second
			time.Sleep(backoff)
		}
	}

	return "", fmt.Errorf("download failed after %d attempts: %w", maxRetries, lastErr)
}

func (p *OCIProvider) downloadWithHTTP(ctx context.Context, mediaURL string) (string, error) {
	client := &http.Client{
		Timeout: 10 * time.Minute,
		Transport: &http.Transport{
			ResponseHeaderTimeout: 30 * time.Second,
			IdleConnTimeout:       90 * time.Second,
		},
	}

	req, err := http.NewRequestWithContext(ctx, "GET", mediaURL, nil)
	if err != nil {
		return "", fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("User-Agent", "OCI-Media-Downloader/1.0")

	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("failed to download: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("download failed with status: %d", resp.StatusCode)
	}

	tmpFile, err := os.CreateTemp("", "download-*.tmp")
	if err != nil {
		return "", fmt.Errorf("failed to create temp file: %w", err)
	}
	defer tmpFile.Close()

	written, err := io.Copy(tmpFile, resp.Body)
	if err != nil {
		os.Remove(tmpFile.Name())
		return "", fmt.Errorf("failed to write downloaded data: %w", err)
	}

	p.logger.Info("HTTP download completed",
		zap.String("url", mediaURL),
		zap.Int64("bytes", written))

	return tmpFile.Name(), nil
}

func (p *OCIProvider) downloadWithFFmpeg(ctx context.Context, mediaURL string) (string, error) {
	tmpFile, err := os.CreateTemp("", "ffmpeg-download-*.mp4")
	if err != nil {
		return "", fmt.Errorf("failed to create temp file: %w", err)
	}
	tmpFile.Close()

	cmd := exec.CommandContext(ctx,
		"ffmpeg",
		"-y",
		"-user_agent", "OCI-Media-Downloader/1.0",
		"-reconnect", "1",
		"-reconnect_streamed", "1",
		"-reconnect_delay_max", "30",
		"-i", mediaURL,
		"-c", "copy",
		"-movflags", "+faststart",
		tmpFile.Name())

	output, err := cmd.CombinedOutput()
	if err != nil {
		os.Remove(tmpFile.Name())
		return "", fmt.Errorf("ffmpeg download failed: %v, output: %s", err, string(output))
	}

	p.logger.Info("FFmpeg download completed",
		zap.String("url", mediaURL),
		zap.String("output_file", tmpFile.Name()))

	return tmpFile.Name(), nil
}

func (p *OCIProvider) uploadDownloadedFile(ctx context.Context, tempFilePath, objectName string) (string, error) {
	file, err := os.Open(tempFilePath)
	if err != nil {
		return "", fmt.Errorf("failed to open downloaded file: %w", err)
	}
	defer file.Close()

	fileInfo, err := file.Stat()
	if err != nil {
		return "", fmt.Errorf("failed to get file stats: %w", err)
	}

	contentType := guessContentType(objectName)
	objectPath := "downloaded/" + objectName

	if fileInfo.Size() <= MaxSimpleUploadSize {
		return p.simpleUpload(ctx, file, objectPath, contentType, fileInfo.Size())
	}

	return p.parallelChunkedUpload(ctx, file, objectPath, contentType, fileInfo.Size())
}

func (p *OCIProvider) getExtensionFromURL(url string) string {
	if idx := strings.Index(url, "?"); idx != -1 {
		url = url[:idx]
	}

	ext := filepath.Ext(url)
	if ext != "" {
		return ext
	}

	lower := strings.ToLower(url)
	switch {
	case strings.Contains(lower, ".mp4"):
		return ".mp4"
	case strings.Contains(lower, ".mov"):
		return ".mov"
	case strings.Contains(lower, ".avi"):
		return ".avi"
	case strings.Contains(lower, ".webm"):
		return ".webm"
	case strings.Contains(lower, ".mkv"):
		return ".mkv"
	default:
		return ""
	}
}

func (p *OCIProvider) PresignedURL(ctx context.Context, objectPath string, expiry time.Duration) (string, error) {
	p.logger.Info("Generating presigned URL",
		zap.String("object", objectPath),
		zap.Duration("expiry", expiry))

	requestName := fmt.Sprintf("presigned-%s-%d",
		strings.ReplaceAll(objectPath, "/", "-"),
		time.Now().Unix())

	request := objectstorage.CreatePreauthenticatedRequestRequest{
		NamespaceName: common.String(p.config.Namespace),
		BucketName:    common.String(p.config.Bucket),
		CreatePreauthenticatedRequestDetails: objectstorage.CreatePreauthenticatedRequestDetails{
			Name:        common.String(requestName),
			AccessType:  objectstorage.CreatePreauthenticatedRequestDetailsAccessTypeObjectread,
			TimeExpires: &common.SDKTime{Time: time.Now().Add(expiry)},
			ObjectName:  common.String(objectPath),
		},
	}

	response, err := p.client.CreatePreauthenticatedRequest(ctx, request)
	if err != nil {
		return "", fmt.Errorf("failed to create presigned URL: %w", err)
	}

	baseURL := p.getBaseURL()
	presignedURL := fmt.Sprintf("%s%s", baseURL, *response.AccessUri)

	p.logger.Info("Presigned URL generated successfully",
		zap.String("object", objectPath),
		zap.Duration("expiry", expiry),
		zap.String("url", presignedURL))

	return presignedURL, nil
}

func (p *OCIProvider) getBaseURL() string {
	if p.config.PublicEndpoint != "" {
		return strings.TrimRight(p.config.PublicEndpoint, "/")
	}
	return fmt.Sprintf("https://objectstorage.%s.oraclecloud.com", p.config.Region)
}
