// internal/storage/audio_extractor.go
package storage

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
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

type AudioAnalysis struct {
	HasAudio        bool    `json:"has_audio"`
	Duration        float64 `json:"duration"`
	SampleRate      int     `json:"sample_rate"`
	Channels        int     `json:"channels"`
	VolumeLevel     string  `json:"volume_level"`
	SilenceRatio    float64 `json:"silence_ratio"`
	EstimatedSpeech bool    `json:"estimated_speech"`
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

func (ae AudioExtractor) DetectVideoDuration(videoFilePath string) float64 {
	// Try multiple ffprobe methods to get duration

	// Method 1: Get duration from format
	cmd := exec.Command("ffprobe", "-v", "error", "-show_entries",
		"format=duration", "-of", "csv=p=0", videoFilePath)

	output, err := cmd.Output()
	if err != nil {
		ae.logger.Warn("Failed to detect video duration with ffprobe (method 1)",
			zap.String("file", videoFilePath), zap.Error(err))
	} else {
		outputStr := strings.TrimSpace(string(output))
		ae.logger.Info("ffprobe duration output", zap.String("output", outputStr))

		if outputStr != "" && outputStr != "N/A" {
			if duration, err := strconv.ParseFloat(outputStr, 64); err == nil && duration > 0 {
				ae.logger.Info("Successfully detected duration (method 1)", zap.Float64("duration", duration))
				return duration
			}
		}
	}

	// Method 2: Try getting duration from stream info
	cmd2 := exec.Command("ffprobe", "-v", "error", "-select_streams", "v:0",
		"-show_entries", "stream=duration", "-of", "csv=p=0", videoFilePath)

	output2, err2 := cmd2.Output()
	if err2 == nil {
		outputStr2 := strings.TrimSpace(string(output2))
		ae.logger.Info("ffprobe stream duration output", zap.String("output", outputStr2))

		if outputStr2 != "" && outputStr2 != "N/A" {
			if duration, err := strconv.ParseFloat(outputStr2, 64); err == nil && duration > 0 {
				ae.logger.Info("Successfully detected duration (method 2)", zap.Float64("duration", duration))
				return duration
			}
		}
	}

	// Method 3: Try using ffprobe with different format
	cmd3 := exec.Command("ffprobe", "-v", "error", "-show_entries",
		"format=duration", "-of", "default=noprint_wrappers=1:nokey=1", videoFilePath)

	output3, err3 := cmd3.Output()
	if err3 == nil {
		outputStr3 := strings.TrimSpace(string(output3))
		ae.logger.Info("ffprobe alternative format output", zap.String("output", outputStr3))

		if outputStr3 != "" && outputStr3 != "N/A" {
			if duration, err := strconv.ParseFloat(outputStr3, 64); err == nil && duration > 0 {
				ae.logger.Info("Successfully detected duration (method 3)", zap.Float64("duration", duration))
				return duration
			}
		}
	}

	// Method 4: Check file size and estimate duration (very rough fallback)
	if fileInfo, err := os.Stat(videoFilePath); err == nil {
		fileSize := fileInfo.Size()
		ae.logger.Info("File size based estimation", zap.Int64("file_size", fileSize))

		// Very rough estimation: assume ~1MB per 10 seconds for typical web recordings
		if fileSize > 1024*1024 { // > 1MB
			estimatedDuration := float64(fileSize) / (1024 * 1024) * 10
			if estimatedDuration > 5 && estimatedDuration < 300 { // Between 5 seconds and 5 minutes
				ae.logger.Info("Using file size based estimation", zap.Float64("estimated_duration", estimatedDuration))
				return estimatedDuration
			}
		}
	}

	// All methods failed, use default based on typical testimonial length
	ae.logger.Warn("All duration detection methods failed, using default",
		zap.String("file", videoFilePath))
	return 45.0 // Default to 45 seconds for typical testimonials
}

func (ae AudioExtractor) ExtractAudioFromLocalVideo(ctx context.Context, videoFilePath string) (string, error) {
	// Create output audio file path
	audioFilePath := strings.TrimSuffix(videoFilePath, filepath.Ext(videoFilePath)) + "_audio.wav"

	ae.logger.Info("Extracting audio from local video",
		zap.String("input", videoFilePath),
		zap.String("output", audioFilePath))

	// Use ffmpeg to extract audio directly
	cmd := exec.CommandContext(ctx, "ffmpeg",
		"-i", videoFilePath, // input video
		"-vn",                  // no video
		"-acodec", "pcm_s16le", // audio codec
		"-ar", "16000", // sample rate 16kHz
		"-ac", "1", // mono
		"-y",          // overwrite output
		audioFilePath, // output audio
	)

	cmd.Stderr = nil // Suppress ffmpeg output

	if err := cmd.Run(); err != nil {
		return "", fmt.Errorf("failed to extract audio with ffmpeg: %w", err)
	}

	// Verify the audio file was created
	if _, err := os.Stat(audioFilePath); os.IsNotExist(err) {
		return "", fmt.Errorf("audio extraction failed - output file not created")
	}

	ae.logger.Info("Audio extraction completed successfully", zap.String("audio_file", audioFilePath))
	return audioFilePath, nil
}

func (ae AudioExtractor) ExtractValidationSample(ctx context.Context, audioFilePath string, startSecond, durationSeconds float64) (string, error) {
	outputPath := strings.TrimSuffix(audioFilePath, filepath.Ext(audioFilePath)) + "_sample.mp3"

	// Extract a tiny sample (5-10 seconds) with very low quality
	cmd := exec.CommandContext(ctx, "ffmpeg",
		"-ss", fmt.Sprintf("%.1f", startSecond), // Start position
		"-i", audioFilePath, // Input file
		"-t", fmt.Sprintf("%.1f", durationSeconds), // Duration
		"-acodec", "libmp3lame", // MP3 codec
		"-ab", "32k", // Very low bitrate (32kbps)
		"-ar", "8000", // Low sample rate (8kHz - minimum for speech)
		"-ac", "1", // Mono
		"-f", "mp3",
		"-y", // Overwrite
		outputPath)

	if err := cmd.Run(); err != nil {
		return "", fmt.Errorf("failed to extract validation sample: %w", err)
	}

	// Verify sample was created and is small
	if stat, err := os.Stat(outputPath); err != nil {
		return "", fmt.Errorf("validation sample not created")
	} else {
		ae.logger.Info("Validation sample created",
			zap.String("path", outputPath),
			zap.Int64("size_bytes", stat.Size()),
			zap.Float64("duration", durationSeconds))
	}

	return outputPath, nil
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

func (ae AudioExtractor) AnalyzeAudioLocally(ctx context.Context, audioFilePath string) (*AudioAnalysis, error) {
	analysis := &AudioAnalysis{}

	// Get basic audio info using ffprobe
	info, err := ae.getAudioInfo(ctx, audioFilePath)
	if err != nil {
		return nil, fmt.Errorf("failed to analyze audio: %w", err)
	}

	analysis.HasAudio = info.HasAudioStream
	analysis.Duration = info.Duration
	analysis.SampleRate = info.SampleRate
	analysis.Channels = info.Channels

	// Analyze audio volume and silence
	volumeAnalysis, err := ae.analyzeVolume(ctx, audioFilePath)
	if err != nil {
		ae.logger.Warn("Volume analysis failed", zap.Error(err))
	} else {
		analysis.VolumeLevel = volumeAnalysis.Level
		analysis.SilenceRatio = volumeAnalysis.SilenceRatio
		analysis.EstimatedSpeech = volumeAnalysis.HasSignificantAudio
	}

	return analysis, nil
}

type AudioInfo struct {
	HasAudioStream bool
	Duration       float64
	SampleRate     int
	Channels       int
}

func (ae AudioExtractor) getAudioInfo(ctx context.Context, audioFilePath string) (*AudioInfo, error) {
	// Use ffprobe to get detailed audio information
	cmd := exec.CommandContext(ctx, "ffprobe",
		"-v", "quiet",
		"-select_streams", "a:0",
		"-show_entries", "stream=duration,sample_rate,channels",
		"-show_entries", "format=duration",
		"-of", "json",
		audioFilePath)

	output, err := cmd.Output()
	if err != nil {
		return nil, fmt.Errorf("ffprobe failed: %w", err)
	}

	var result struct {
		Streams []struct {
			Duration   string `json:"duration"`
			SampleRate string `json:"sample_rate"`
			Channels   int    `json:"channels"`
		} `json:"streams"`
		Format struct {
			Duration string `json:"duration"`
		} `json:"format"`
	}

	if err := json.Unmarshal(output, &result); err != nil {
		return nil, fmt.Errorf("failed to parse ffprobe output: %w", err)
	}

	info := &AudioInfo{
		HasAudioStream: len(result.Streams) > 0,
	}

	if info.HasAudioStream {
		stream := result.Streams[0]

		// Parse duration
		if stream.Duration != "" {
			info.Duration, _ = strconv.ParseFloat(stream.Duration, 64)
		} else if result.Format.Duration != "" {
			info.Duration, _ = strconv.ParseFloat(result.Format.Duration, 64)
		}

		// Parse sample rate
		if stream.SampleRate != "" {
			info.SampleRate, _ = strconv.Atoi(stream.SampleRate)
		}

		info.Channels = stream.Channels
	}

	return info, nil
}

type VolumeAnalysis struct {
	Level               string
	SilenceRatio        float64
	HasSignificantAudio bool
}

func (ae AudioExtractor) analyzeVolume(ctx context.Context, audioFilePath string) (*VolumeAnalysis, error) {
	// Use ffmpeg to analyze volume levels
	cmd := exec.CommandContext(ctx, "ffmpeg",
		"-i", audioFilePath,
		"-af", "volumedetect,silencedetect=noise=-30dB:duration=0.5",
		"-f", "null",
		"-")

	output, err := cmd.CombinedOutput()
	if err != nil {
		// ffmpeg returns non-zero for null output, but that's expected
		// We only care about the stderr output which contains the analysis
	}

	outputStr := string(output)
	analysis := &VolumeAnalysis{}

	// Parse volume detection
	if strings.Contains(outputStr, "mean_volume:") {
		// Extract mean volume
		lines := strings.Split(outputStr, "\n")
		for _, line := range lines {
			if strings.Contains(line, "mean_volume:") {
				// Parse mean volume value
				parts := strings.Split(line, "mean_volume:")
				if len(parts) > 1 {
					volumeStr := strings.TrimSpace(strings.Split(parts[1], "dB")[0])
					if volume, err := strconv.ParseFloat(volumeStr, 64); err == nil {
						if volume > -20 {
							analysis.Level = "high"
							analysis.HasSignificantAudio = true
						} else if volume > -40 {
							analysis.Level = "medium"
							analysis.HasSignificantAudio = true
						} else if volume > -60 {
							analysis.Level = "low"
							analysis.HasSignificantAudio = true
						} else {
							analysis.Level = "very_low"
							analysis.HasSignificantAudio = false
						}
					}
				}
			}
		}
	}

	// Count silence periods
	silenceCount := strings.Count(outputStr, "silence_start")
	totalDuration := 30.0 // Assuming we're analyzing a 30-second sample

	if silenceCount > 0 {
		// Rough estimation of silence ratio
		analysis.SilenceRatio = float64(silenceCount) * 0.5 / totalDuration
		if analysis.SilenceRatio > 0.8 {
			analysis.HasSignificantAudio = false
		}
	}

	return analysis, nil
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
