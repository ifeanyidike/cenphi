package ai

import (
	"context"
	"fmt"
	"io"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/ifeanyidike/cenphi/internal/sse"
	"github.com/jmoiron/sqlx"
	"go.uber.org/zap"
)

const (
	MaxRecommendedSizeMB = 200
	CRFVisuallyLossless  = 20
	CompressionPreset    = "medium"
)

// VideoCompressor handles video compression for uploads
type VideoCompressor struct {
	logger     *zap.Logger
	sseManager *sse.SSEManager
	db         *sqlx.DB
}

// NewVideoCompressor creates a new video compressor
func NewVideoCompressor(logger *zap.Logger, sseManager *sse.SSEManager, db *sqlx.DB) *VideoCompressor {
	return &VideoCompressor{
		logger:     logger,
		sseManager: sseManager,
		db:         db,
	}
}

// CompressionResult contains the result of video compression
type CompressionResult struct {
	Success           bool
	CompressedPath    string
	OriginalSizeMB    float64
	CompressedSizeMB  float64
	ReductionPercent  float64
	Error             error
	ShouldRetrySmaller bool
}

// CompressVideoForStorage compresses a video using native ffmpeg with CRF 20 (visually lossless)
func (vc *VideoCompressor) CompressVideoForStorage(ctx context.Context, inputPath string, sessionID uuid.UUID) (*CompressionResult, error) {
	vc.logger.Info("Starting video compression",
		zap.String("input_path", inputPath),
		zap.String("session_id", sessionID.String()))

	// Get original file size
	fileInfo, err := os.Stat(inputPath)
	if err != nil {
		return nil, fmt.Errorf("failed to stat input file: %w", err)
	}
	originalSizeMB := float64(fileInfo.Size()) / (1024 * 1024)

	// Emit upload complete event
	vc.emitSSE(sessionID, sse.StudioEvent{
		ID:        uuid.New().String(),
		Type:      "upload_complete",
		SessionID: sessionID.String(),
		Timestamp: time.Now(),
		Data: map[string]interface{}{
			"message":          "Upload complete, optimizing video for best quality...",
			"original_size_mb": originalSizeMB,
		},
	})

	// Create output path (same directory, temp file)
	outputPath := strings.TrimSuffix(inputPath, filepath.Ext(inputPath)) + "_compressed.mp4"

	// Build ffmpeg command with CRF 20 (visually lossless)
	cmd := exec.CommandContext(ctx,
		"ffmpeg",
		"-i", inputPath,
		"-c:v", "libx264",
		"-crf", strconv.Itoa(CRFVisuallyLossless), // Visually lossless quality
		"-preset", CompressionPreset,              // Good speed/quality balance
		"-vf", "scale='min(1920,iw)':'min(1080,ih)':force_original_aspect_ratio=decrease",
		"-c:a", "aac",
		"-b:a", "128k",
		"-movflags", "+faststart", // Web optimization
		"-y",                       // Overwrite output
		"-progress", "pipe:1",      // Progress to stdout
		"-loglevel", "error",       // Errors to stderr
		outputPath,
	)

	// Capture stdout for progress
	stdoutPipe, err := cmd.StdoutPipe()
	if err != nil {
		return &CompressionResult{
			Success:            false,
			Error:              fmt.Errorf("failed to create stdout pipe: %w", err),
			ShouldRetrySmaller: originalSizeMB > MaxRecommendedSizeMB,
		}, nil
	}

	// Start command
	if err := cmd.Start(); err != nil {
		return &CompressionResult{
			Success:            false,
			Error:              fmt.Errorf("failed to start ffmpeg: %w", err),
			ShouldRetrySmaller: originalSizeMB > MaxRecommendedSizeMB,
		}, nil
	}

	// Monitor progress
	go vc.monitorCompressionProgress(stdoutPipe, sessionID, originalSizeMB)

	// Wait for completion
	if err := cmd.Wait(); err != nil {
		vc.logger.Error("FFmpeg compression failed",
			zap.String("session_id", sessionID.String()),
			zap.Float64("file_size_mb", originalSizeMB),
			zap.Error(err))

		// Clean up failed output
		os.Remove(outputPath)

		// If file is large and compression failed, suggest smaller file
		if originalSizeMB > MaxRecommendedSizeMB {
			vc.emitSSE(sessionID, sse.StudioEvent{
				ID:        uuid.New().String(),
				Type:      "compression_error",
				SessionID: sessionID.String(),
				Timestamp: time.Now(),
				Data: map[string]interface{}{
					"message":                   fmt.Sprintf("Compression failed. Please upload a file smaller than %dMB.", MaxRecommendedSizeMB),
					"error":                     err.Error(),
					"file_size_mb":              originalSizeMB,
					"max_recommended_size_mb":   MaxRecommendedSizeMB,
					"should_retry_with_smaller": true,
				},
			})

			return &CompressionResult{
				Success:            false,
				Error:              fmt.Errorf("compression failed for large file (%.1fMB)", originalSizeMB),
				ShouldRetrySmaller: true,
				OriginalSizeMB:     originalSizeMB,
			}, nil
		}

		// For smaller files, use original (log warning)
		vc.logger.Warn("Compression failed for small file, using original",
			zap.String("session_id", sessionID.String()),
			zap.Float64("file_size_mb", originalSizeMB))

		vc.emitSSE(sessionID, sse.StudioEvent{
			ID:        uuid.New().String(),
			Type:      "compression_warning",
			SessionID: sessionID.String(),
			Timestamp: time.Now(),
			Data: map[string]interface{}{
				"message":          "Video optimization skipped, using original file",
				"original_size_mb": originalSizeMB,
			},
		})

		return &CompressionResult{
			Success:            true,
			CompressedPath:     inputPath, // Use original
			OriginalSizeMB:     originalSizeMB,
			CompressedSizeMB:   originalSizeMB,
			ReductionPercent:   0,
			ShouldRetrySmaller: false,
		}, nil
	}

	// Get compressed file size
	compressedInfo, err := os.Stat(outputPath)
	if err != nil {
		vc.logger.Error("Failed to stat compressed file",
			zap.String("session_id", sessionID.String()),
			zap.Error(err))
		return &CompressionResult{
			Success:            false,
			Error:              fmt.Errorf("failed to stat compressed file: %w", err),
			ShouldRetrySmaller: originalSizeMB > MaxRecommendedSizeMB,
		}, nil
	}

	compressedSizeMB := float64(compressedInfo.Size()) / (1024 * 1024)
	reductionPercent := ((originalSizeMB - compressedSizeMB) / originalSizeMB) * 100

	vc.logger.Info("Video compression completed successfully",
		zap.String("session_id", sessionID.String()),
		zap.Float64("original_mb", originalSizeMB),
		zap.Float64("compressed_mb", compressedSizeMB),
		zap.Float64("reduction_percent", reductionPercent))

	// Emit compression complete event
	vc.emitSSE(sessionID, sse.StudioEvent{
		ID:        uuid.New().String(),
		Type:      "compression_complete",
		SessionID: sessionID.String(),
		Timestamp: time.Now(),
		Data: map[string]interface{}{
			"message":             fmt.Sprintf("Optimized: %.1fMB → %.1fMB (%.0f%% reduction, visually lossless quality)", originalSizeMB, compressedSizeMB, reductionPercent),
			"original_size_mb":    originalSizeMB,
			"compressed_size_mb":  compressedSizeMB,
			"reduction_percent":   reductionPercent,
			"quality":             "visually_lossless",
			"crf":                 CRFVisuallyLossless,
		},
	})

	return &CompressionResult{
		Success:            true,
		CompressedPath:     outputPath,
		OriginalSizeMB:     originalSizeMB,
		CompressedSizeMB:   compressedSizeMB,
		ReductionPercent:   reductionPercent,
		ShouldRetrySmaller: false,
	}, nil
}

// monitorCompressionProgress monitors ffmpeg progress and emits SSE events
func (vc *VideoCompressor) monitorCompressionProgress(stdout io.ReadCloser, sessionID uuid.UUID, fileSizeMB float64) {
	defer stdout.Close()

	buf := make([]byte, 4096)
	progressData := make(map[string]string)
	lastProgress := 0

	for {
		n, err := stdout.Read(buf)
		if err != nil {
			break
		}

		// Parse ffmpeg progress output
		lines := strings.Split(string(buf[:n]), "\n")
		for _, line := range lines {
			parts := strings.SplitN(line, "=", 2)
			if len(parts) == 2 {
				key := strings.TrimSpace(parts[0])
				value := strings.TrimSpace(parts[1])
				progressData[key] = value
			}
		}

		// Calculate progress percentage (based on time processed)
		if timeStr, ok := progressData["out_time_ms"]; ok {
			if timeMicros, err := strconv.ParseInt(timeStr, 10, 64); err == nil {
				// Estimate total duration (this is rough, but gives feedback)
				// Assume ~1 second processing per MB for estimation
				estimatedDurationSeconds := fileSizeMB
				currentSeconds := float64(timeMicros) / 1000000.0

				progress := int((currentSeconds / estimatedDurationSeconds) * 100)
				if progress > 100 {
					progress = 99
				}

				// Only emit if progress changed significantly (every 5%)
				if progress >= lastProgress+5 {
					lastProgress = progress

					vc.emitSSE(sessionID, sse.StudioEvent{
						ID:        uuid.New().String(),
						Type:      "compression_progress",
						SessionID: sessionID.String(),
						Timestamp: time.Now(),
						Data: map[string]interface{}{
							"message":  fmt.Sprintf("Optimizing video: %d%%", progress),
							"progress": progress,
						},
					})
				}
			}
		}
	}

	// Emit final 99% before completion
	if lastProgress < 99 {
		vc.emitSSE(sessionID, sse.StudioEvent{
			ID:        uuid.New().String(),
			Type:      "compression_progress",
			SessionID: sessionID.String(),
			Timestamp: time.Now(),
			Data: map[string]interface{}{
				"message":  "Optimizing video: 99%",
				"progress": 99,
			},
		})
	}
}

// emitSSE is a helper to emit SSE events
func (vc *VideoCompressor) emitSSE(sessionID uuid.UUID, event sse.StudioEvent) {
	if vc.sseManager != nil {
		vc.sseManager.BroadcastStudioEvent(event)
	}
}

// ReplaceWithCompressed replaces the original file with the compressed version
func (vc *VideoCompressor) ReplaceWithCompressed(originalPath, compressedPath string) error {
	// Remove original
	if err := os.Remove(originalPath); err != nil {
		return fmt.Errorf("failed to remove original file: %w", err)
	}

	// Rename compressed to original path
	if err := os.Rename(compressedPath, originalPath); err != nil {
		return fmt.Errorf("failed to rename compressed file: %w", err)
	}

	return nil
}
