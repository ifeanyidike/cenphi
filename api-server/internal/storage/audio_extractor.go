// internal/storage/audio_extractor.go
package storage

import (
	"context"
	"fmt"
	"io"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"

	"go.uber.org/zap"
)

type AudioExtractor struct {
	logger  *zap.Logger
	tempDir string
}

type MediaInfo struct {
	IsVideo     bool
	IsAudio     bool
	ContentType string
	FilePath    string
}

func NewAudioExtractor(logger *zap.Logger, tempDir string) AudioExtractor {
	// Ensure temp directory exists
	os.MkdirAll(tempDir, 0755)

	return AudioExtractor{
		logger:  logger,
		tempDir: tempDir,
	}
}

// DownloadAndPrepareForTranscription downloads media and prepares it for transcription
func (ae AudioExtractor) DownloadAndPrepareForTranscription(ctx context.Context, mediaURL string) (*MediaInfo, error) {
	start := time.Now()
	ae.logger.Info("Starting media download and preparation",
		zap.String("url", mediaURL))

	// Download media file
	tempFile, originalContentType, err := ae.downloadMedia(ctx, mediaURL)
	if err != nil {
		return nil, fmt.Errorf("failed to download media: %w", err)
	}

	// Analyze media type
	mediaInfo := &MediaInfo{
		ContentType: originalContentType,
		FilePath:    tempFile,
	}

	// Detect if it's video or audio
	if ae.isVideoFile(originalContentType, tempFile) {
		mediaInfo.IsVideo = true

		// Extract audio from video
		audioFile, err := ae.extractAudioFromVideo(ctx, tempFile)
		if err != nil {
			os.Remove(tempFile) // Cleanup original file
			return nil, fmt.Errorf("failed to extract audio: %w", err)
		}

		// Replace original file with audio file
		os.Remove(tempFile)
		mediaInfo.FilePath = audioFile
		mediaInfo.ContentType = "audio/mp3"

	} else if ae.isAudioFile(originalContentType, tempFile) {
		mediaInfo.IsAudio = true
		// Audio file - use as is, but convert to optimized format
		audioFile, err := ae.optimizeAudioFile(ctx, tempFile)
		if err != nil {
			// If optimization fails, use original
			ae.logger.Warn("Audio optimization failed, using original", zap.Error(err))
			audioFile = tempFile
		} else {
			os.Remove(tempFile) // Remove original if optimization succeeded
		}
		mediaInfo.FilePath = audioFile
		mediaInfo.ContentType = "audio/mp3"
	} else {
		os.Remove(tempFile)
		return nil, fmt.Errorf("unsupported media type: %s", originalContentType)
	}

	ae.logger.Info("Media preparation completed",
		zap.String("type", func() string {
			if mediaInfo.IsVideo {
				return "video->audio"
			}
			return "audio"
		}()),
		zap.String("final_path", mediaInfo.FilePath),
		zap.Duration("duration", time.Since(start)))

	return mediaInfo, nil
}

// downloadMedia downloads media file to temporary location
func (ae AudioExtractor) downloadMedia(ctx context.Context, mediaURL string) (string, string, error) {
	// Create HTTP client with timeout
	client := &http.Client{
		Timeout: 10 * time.Minute,
	}

	req, err := http.NewRequestWithContext(ctx, "GET", mediaURL, nil)
	if err != nil {
		return "", "", err
	}

	resp, err := client.Do(req)
	if err != nil {
		return "", "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", "", fmt.Errorf("failed to download media: HTTP %d", resp.StatusCode)
	}

	// Create temp file
	tempFile, err := os.CreateTemp(ae.tempDir, "media_*")
	if err != nil {
		return "", "", err
	}
	defer tempFile.Close()

	// Copy response to temp file
	_, err = io.Copy(tempFile, resp.Body)
	if err != nil {
		os.Remove(tempFile.Name())
		return "", "", err
	}

	contentType := resp.Header.Get("Content-Type")
	if contentType == "" || contentType == "application/octet-stream" {
		// Try to detect from URL
		contentType = ae.guessContentTypeFromURL(mediaURL)
	}

	ae.logger.Info("Media downloaded",
		zap.String("path", tempFile.Name()),
		zap.String("content_type", contentType))

	return tempFile.Name(), contentType, nil
}

// extractAudioFromVideo extracts audio from video file (optimized for speed and size)
func (ae AudioExtractor) extractAudioFromVideo(ctx context.Context, videoPath string) (string, error) {
	outputPath := strings.TrimSuffix(videoPath, filepath.Ext(videoPath)) + "_audio.mp3"

	// Check if ffmpeg is available
	if _, err := exec.LookPath("ffmpeg"); err != nil {
		return "", fmt.Errorf("ffmpeg not found: %w", err)
	}

	// Extract audio with optimal settings for transcription
	cmd := exec.CommandContext(ctx, "ffmpeg",
		"-i", videoPath,
		"-vn",                   // No video
		"-acodec", "libmp3lame", // MP3 codec (smaller than WAV)
		"-ab", "64k", // Low bitrate for speech (very small files)
		"-ar", "16000", // 16kHz sample rate (optimal for speech recognition)
		"-ac", "1", // Mono (half the size of stereo)
		"-f", "mp3", // Force MP3 format
		"-y", // Overwrite output file
		outputPath)

	// Add timeout for extraction
	extractCtx, cancel := context.WithTimeout(ctx, 5*time.Minute)
	defer cancel()
	cmd = exec.CommandContext(extractCtx, cmd.Args[0], cmd.Args[1:]...)

	output, err := cmd.CombinedOutput()
	if err != nil {
		os.Remove(outputPath) // Cleanup on failure
		return "", fmt.Errorf("ffmpeg extraction failed: %v, output: %s", err, string(output))
	}

	// Verify output file was created and has content
	if stat, err := os.Stat(outputPath); err != nil || stat.Size() == 0 {
		os.Remove(outputPath)
		return "", fmt.Errorf("audio extraction produced empty file")
	}

	ae.logger.Info("Audio extracted from video",
		zap.String("input", videoPath),
		zap.String("output", outputPath))

	return outputPath, nil
}

// optimizeAudioFile optimizes audio file for transcription
func (ae AudioExtractor) optimizeAudioFile(ctx context.Context, audioPath string) (string, error) {
	outputPath := strings.TrimSuffix(audioPath, filepath.Ext(audioPath)) + "_optimized.mp3"

	// Check if ffmpeg is available
	if _, err := exec.LookPath("ffmpeg"); err != nil {
		return audioPath, nil // Return original if ffmpeg not available
	}

	// Optimize audio for transcription
	cmd := exec.CommandContext(ctx, "ffmpeg",
		"-i", audioPath,
		"-acodec", "libmp3lame", // MP3 codec
		"-ab", "64k", // Low bitrate for speech
		"-ar", "16000", // 16kHz sample rate
		"-ac", "1", // Mono
		"-f", "mp3", // Force MP3 format
		"-y", // Overwrite output file
		outputPath)

	output, err := cmd.CombinedOutput()
	if err != nil {
		ae.logger.Warn("Audio optimization failed",
			zap.Error(err),
			zap.String("output", string(output)))
		return audioPath, nil // Return original file
	}

	ae.logger.Info("Audio file optimized",
		zap.String("input", audioPath),
		zap.String("output", outputPath))

	return outputPath, nil
}

// File type detection methods
func (ae AudioExtractor) isVideoFile(contentType, filePath string) bool {
	// Check by content type first
	videoTypes := []string{
		"video/mp4", "video/quicktime", "video/x-msvideo",
		"video/webm", "video/x-matroska", "video/mov",
	}

	for _, vType := range videoTypes {
		if strings.Contains(strings.ToLower(contentType), strings.ToLower(vType)) {
			return true
		}
	}

	// Check by file extension as fallback
	ext := strings.ToLower(filepath.Ext(filePath))
	videoExts := []string{".mp4", ".mov", ".avi", ".webm", ".mkv", ".flv", ".wmv"}

	for _, vExt := range videoExts {
		if ext == vExt {
			return true
		}
	}

	return false
}

func (ae AudioExtractor) isAudioFile(contentType, filePath string) bool {
	// Check by content type first
	audioTypes := []string{
		"audio/mpeg", "audio/mp3", "audio/wav", "audio/wave",
		"audio/ogg", "audio/aac", "audio/mp4", "audio/webm",
	}

	for _, aType := range audioTypes {
		if strings.Contains(strings.ToLower(contentType), strings.ToLower(aType)) {
			return true
		}
	}

	// Check by file extension as fallback
	ext := strings.ToLower(filepath.Ext(filePath))
	audioExts := []string{".mp3", ".wav", ".ogg", ".aac", ".m4a", ".flac", ".wma"}

	for _, aExt := range audioExts {
		if ext == aExt {
			return true
		}
	}

	return false
}

func (ae AudioExtractor) guessContentTypeFromURL(url string) string {
	ext := strings.ToLower(filepath.Ext(url))
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
	case ".mp3":
		return "audio/mpeg"
	case ".wav":
		return "audio/wav"
	case ".ogg":
		return "audio/ogg"
	default:
		return "video/mp4" // Default assumption
	}
}

// Cleanup removes the temporary media file
func (ae *AudioExtractor) Cleanup(filePath string) {
	if filePath != "" {
		if err := os.Remove(filePath); err != nil {
			ae.logger.Warn("Failed to cleanup temp file",
				zap.String("path", filePath),
				zap.Error(err))
		} else {
			ae.logger.Debug("Cleaned up temp file", zap.String("path", filePath))
		}
	}
}
