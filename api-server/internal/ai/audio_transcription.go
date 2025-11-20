package ai

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"math"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/ifeanyidike/cenphi/internal/cache"
	"github.com/ifeanyidike/cenphi/internal/models"
	"github.com/ifeanyidike/cenphi/internal/storage"
	"go.uber.org/zap"
)

type AudioTranscriptionService struct {
	assemblyAIKey  string
	httpClient     *http.Client
	cacheService   cache.RedisCache
	audioExtractor storage.AudioExtractor
	logger         *zap.Logger
}

type AudioQualityResult struct {
	Score          float64  `json:"score"`
	HasSpeech      bool     `json:"has_speech"`
	SpeechDuration float64  `json:"speech_duration"`
	TotalDuration  float64  `json:"total_duration"`
	NoiseLevel     string   `json:"noise_level"`
	Confidence     float64  `json:"confidence"`
	SpeechRatio    float64  `json:"speech_ratio"`
	Recommendation string   `json:"recommendation"`
	ShouldReject   bool     `json:"should_reject"`
	Issues         []string `json:"issues"`
}

type ValidationResult struct {
	Quality      *AudioQualityResult `json:"quality"`
	TempFilePath string              `json:"-"`
	IsValid      bool                `json:"is_valid"`
	ErrorMessage string              `json:"error_message,omitempty"`
}

func NewAudioTranscriptionService(assemblyAIKey string, cacheService cache.RedisCache, audioExtractor storage.AudioExtractor, logger *zap.Logger) AudioTranscriptionService {
	return AudioTranscriptionService{
		assemblyAIKey: assemblyAIKey,
		httpClient: &http.Client{
			Timeout: 10 * time.Minute,
			Transport: &http.Transport{
				ResponseHeaderTimeout: 2 * time.Minute,
				IdleConnTimeout:       90 * time.Second,
			},
		},
		cacheService:   cacheService,
		audioExtractor: audioExtractor,
		logger:         logger,
	}
}

func (s AudioTranscriptionService) TranscribeAudio(mediaURL string) (*models.TranscriptionResult, error) {
	// Increase timeout to 15 minutes to account for slow downloads from OCI storage
	transcribeCtx, cancel := context.WithTimeout(context.Background(), 15*time.Minute)
	defer cancel()

	// Check cache first
	cacheKey := fmt.Sprintf("transcript:%s", mediaURL)
	var cached models.TranscriptionResult
	if err := s.cacheService.Get(transcribeCtx, cacheKey, &cached); err == nil {
		s.logger.Info("Using cached transcription", zap.String("media_url", mediaURL))
		return &cached, nil
	}

	s.logger.Info("Downloading and preparing media for transcription", zap.String("media_url", mediaURL))
	mediaInfo, err := s.audioExtractor.DownloadAndPrepareForTranscription(transcribeCtx, mediaURL)
	if err != nil {
		s.logger.Error("Failed to download and prepare media", zap.Error(err), zap.String("media_url", mediaURL))
		return nil, fmt.Errorf("failed to prepare media: %w", err)
	}

	defer func() {
		s.audioExtractor.Cleanup(mediaInfo.FilePath)
		s.logger.Info("Temporary media files cleaned up")
	}()

	s.logger.Info("Media prepared for transcription", zap.String("type", func() string {
		if mediaInfo.IsVideo {
			return "video->audio"
		}
		return "audio"
	}()),
		zap.String("file_path", mediaInfo.FilePath))

	// Upload media to AssemblyAI
	uploadURL, err := s.uploadMediaToAssemblyAI(transcribeCtx, mediaInfo.FilePath, mediaInfo.ContentType)
	if err != nil {
		return nil, fmt.Errorf("failed to upload media: %w", err)
	}

	// Start transcription job
	jobID, err := s.startTranscription(transcribeCtx, uploadURL)
	if err != nil {
		return nil, fmt.Errorf("failed to start transcription: %w", err)
	}

	// Poll for completion
	result, err := s.pollTranscription(transcribeCtx, jobID)
	if err != nil {
		return nil, fmt.Errorf("transcription failed: %w", err)
	}

	// Cache for 24 hours
	s.cacheService.Set(transcribeCtx, cacheKey, result, 24*time.Hour)

	return result, nil
}

func (s AudioTranscriptionService) uploadMediaToAssemblyAI(ctx context.Context, filePath, contentType string) (string, error) {
	file, err := os.Open(filePath)
	if err != nil {
		return "", fmt.Errorf("failed to open audio file: %w", err)
	}
	defer file.Close()

	// Get file size for progress tracking
	fileInfo, err := file.Stat()
	if err != nil {
		return "", fmt.Errorf("failed to get file info: %w", err)
	}

	s.logger.Info("Uploading to AssemblyAI",
		zap.String("file_path", filePath),
		zap.String("content_type", contentType),
		zap.Int64("file_size", fileInfo.Size()))

	req, err := http.NewRequestWithContext(ctx, "POST", "https://api.assemblyai.com/v2/upload", file)
	if err != nil {
		return "", err
	}

	req.Header.Set("Authorization", s.assemblyAIKey)
	req.Header.Set("Content-Type", contentType)

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("upload request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		s.logger.Error("AssemblyAI upload failed",
			zap.Int("status_code", resp.StatusCode),
			zap.String("response_body", string(body)),
			zap.String("content_type", resp.Header.Get("Content-Type")))
		return "", fmt.Errorf("upload failed with status %d: %s", resp.StatusCode, string(body))
	}

	var uploadResp struct {
		UploadURL string `json:"upload_url"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&uploadResp); err != nil {
		return "", fmt.Errorf("failed to decode upload response: %w", err)
	}

	return uploadResp.UploadURL, nil
}

func (s AudioTranscriptionService) startTranscription(ctx context.Context, uploadURL string) (string, error) {
	payload := map[string]any{
		"audio_url":          uploadURL,
		"punctuate":          true,
		"format_text":        true,
		"speaker_labels":     true,
		"language_detection": true,
		"auto_highlights":    true,
	}

	payloadBytes, err := json.Marshal(payload)
	if err != nil {
		return "", err
	}

	req, err := http.NewRequestWithContext(ctx, "POST", "https://api.assemblyai.com/v2/transcript", bytes.NewBuffer(payloadBytes))
	if err != nil {
		return "", err
	}

	req.Header.Set("Authorization", s.assemblyAIKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("transcription request failed with status %d: %s", resp.StatusCode, string(body))
	}

	var transcriptResp struct {
		ID string `json:"id"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&transcriptResp); err != nil {
		return "", err
	}

	return transcriptResp.ID, nil
}

func (s AudioTranscriptionService) pollTranscription(ctx context.Context, jobID string) (*models.TranscriptionResult, error) {
	url := fmt.Sprintf("https://api.assemblyai.com/v2/transcript/%s", jobID)

	ticker := time.NewTicker(5 * time.Second) // Optimized: Poll every 5 seconds (60% reduction, AssemblyAI processing takes time)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return nil, ctx.Err()
		case <-ticker.C:
			req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
			if err != nil {
				continue
			}

			req.Header.Set("Authorization", s.assemblyAIKey)

			resp, err := s.httpClient.Do(req)
			if err != nil {
				continue
			}

			var result struct {
				Status     string        `json:"status"`
				Text       string        `json:"text"`
				Words      []models.Word `json:"words"`
				Language   string        `json:"language_code"`
				Confidence float64       `json:"confidence"`
				Error      string        `json:"error"`
			}

			if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
				resp.Body.Close()
				continue
			}
			resp.Body.Close()

			switch result.Status {
			case "completed":
				return s.formatTranscriptionResult(result), nil
			case "error":
				return nil, fmt.Errorf("transcription error: %s", result.Error)
			case "processing", "queued":
				continue
			default:
				return nil, fmt.Errorf("unknown status: %s", result.Status)
			}
		}
	}
}

func (s AudioTranscriptionService) formatTranscriptionResult(result struct {
	Status     string        `json:"status"`
	Text       string        `json:"text"`
	Words      []models.Word `json:"words"`
	Language   string        `json:"language_code"`
	Confidence float64       `json:"confidence"`
	Error      string        `json:"error"`
}) *models.TranscriptionResult {
	segments := s.groupWordsIntoSegments(result.Words)

	return &models.TranscriptionResult{
		Transcript: result.Text,
		Segments:   segments,
		Language:   result.Language,
		Confidence: result.Confidence,
	}
}

func (s AudioTranscriptionService) groupWordsIntoSegments(words []models.Word) []models.TranscriptionSegment {
	if len(words) == 0 {
		return nil
	}

	var segments []models.TranscriptionSegment
	currentSegment := models.TranscriptionSegment{
		StartTime: words[0].Start,
		Speaker:   words[0].Speaker,
	}

	var segmentWords []string
	var segmentWordObjects []models.Word

	for i, word := range words {
		// New segment if speaker changes or long pause (>2 seconds)
		if i > 0 && (word.Speaker != currentSegment.Speaker || word.Start-words[i-1].End > 2.0) {
			currentSegment.Text = fmt.Sprintf("%s.", strings.Join(segmentWords, " "))
			currentSegment.EndTime = words[i-1].End
			currentSegment.Words = segmentWordObjects
			segments = append(segments, currentSegment)

			// Start new segment
			currentSegment = models.TranscriptionSegment{
				StartTime: word.Start,
				Speaker:   word.Speaker,
			}
			segmentWords = nil
			segmentWordObjects = nil
		}

		segmentWords = append(segmentWords, word.Text)
		segmentWordObjects = append(segmentWordObjects, word)
	}

	// Add final segment
	currentSegment.Text = fmt.Sprintf("%s.", strings.Join(segmentWords, " "))
	currentSegment.EndTime = words[len(words)-1].End
	currentSegment.Words = segmentWordObjects
	segments = append(segments, currentSegment)

	return segments
}

func (s AudioTranscriptionService) ValidateVideoFile(
	ctx context.Context,
	file multipart.File,
	header *multipart.FileHeader,
) (*ValidationResult, error) {

	return &ValidationResult{
		IsValid: true,
	}, nil

}

// func (s AudioTranscriptionService) ValidateVideoFile(
// 	ctx context.Context,
// 	file multipart.File,
// 	header *multipart.FileHeader,
// ) (*ValidationResult, error) {
// 	validationCtx, cancel := context.WithTimeout(ctx, 45*time.Second) // Reduced timeout
// 	defer cancel()

// 	s.logger.Info("Starting video audio validation", zap.String("filename", header.Filename), zap.Int64("size", header.Size))

// 	// Check cache first
// 	cacheKey := fmt.Sprintf("validation:%s:%d", header.Filename, header.Size)
// 	var cached ValidationResult
// 	if err := s.cacheService.Get(validationCtx, cacheKey, &cached); err == nil {
// 		s.logger.Info("Using cached validation result", zap.String("filename", header.Filename))
// 		return &cached, nil
// 	}

// 	// Create temporary file
// 	tempFilePath, err := s.createTempFileFromMultipart(file, header)
// 	if err != nil {
// 		return &ValidationResult{
// 			IsValid:      false,
// 			ErrorMessage: fmt.Sprintf("Failed to prepare file: %v", err),
// 		}, nil
// 	}
// 	defer s.audioExtractor.Cleanup(tempFilePath)

// 	// Extract audio (quick)
// 	audioFilePath, err := s.audioExtractor.ExtractAudioFromLocalVideo(validationCtx, tempFilePath)
// 	if err != nil {
// 		s.logger.Error("Audio extraction failed", zap.String("temp_path", tempFilePath), zap.String("filename", header.Filename), zap.Error(err))
// 		return &ValidationResult{
// 			IsValid:      false,
// 			ErrorMessage: "Unable to extract audio from video file. Please ensure the file is a valid video format.",
// 		}, nil
// 	}
// 	defer s.audioExtractor.Cleanup(audioFilePath)

// 	// STEP 1: Local validation first (very fast - under 2 seconds)
// 	quality, err := s.performLocalValidation(validationCtx, audioFilePath)
// 	if err != nil {
// 		return &ValidationResult{
// 			IsValid:      false,
// 			ErrorMessage: fmt.Sprintf("Audio validation failed: %v", err),
// 		}, nil
// 	}

// 	// If local validation strongly rejects, don't waste time on AssemblyAI
// 	if quality.ShouldReject && quality.Score < 30 {
// 		result := &ValidationResult{
// 			Quality:      quality,
// 			IsValid:      false,
// 			ErrorMessage: quality.Recommendation,
// 		}

// 		// Cache negative results for shorter time
// 		s.cacheService.Set(validationCtx, cacheKey, result, 10*time.Minute)
// 		s.logger.Info("Video rejected by local validation", zap.String("filename", header.Filename), zap.Float64("score", quality.Score), zap.String("reason", quality.Recommendation))

// 		return result, nil
// 	}

// 	// STEP 2: If local validation is uncertain or positive, do minimal AssemblyAI check
// 	if quality.Score > 30 && !quality.ShouldReject {
// 		s.logger.Info("Local validation passed, performing AssemblyAI verification", zap.String("filename", header.Filename), zap.Float64("local_score", quality.Score))

// 		// Perform minimal AssemblyAI validation
// 		assemblyQuality, err := s.performSmallAssemblyValidation(validationCtx, audioFilePath, quality.TotalDuration)
// 		if err != nil {
// 			// If AssemblyAI fails, fall back to local analysis
// 			s.logger.Warn("AssemblyAI validation failed, using local analysis",
// 				zap.Error(err))
// 		} else {
// 			// Use AssemblyAI result if it's available
// 			quality = assemblyQuality
// 		}
// 	}

// 	result := &ValidationResult{
// 		Quality: quality,
// 		IsValid: !quality.ShouldReject,
// 	}

// 	if quality.ShouldReject {
// 		result.ErrorMessage = quality.Recommendation
// 	}

// 	// Cache for 30 minutes
// 	s.cacheService.Set(validationCtx, cacheKey, result, 30*time.Minute)

// 	s.logger.Info("Video validation completed", zap.String("filename", header.Filename), zap.Bool("is_valid", result.IsValid),
// 		zap.Float64("quality_score", quality.Score), zap.Bool("used_assembly_ai", quality.Confidence > 0))

// 	return result, nil
// }

func (s AudioTranscriptionService) createTempFileFromMultipart(file multipart.File, header *multipart.FileHeader) (string, error) {
	// Extract file extension from original filename
	ext := filepath.Ext(header.Filename)
	if ext == "" {
		// Fallback based on content type
		contentType := header.Header.Get("Content-Type")
		switch contentType {
		case "video/webm":
			ext = ".webm"
		case "video/mp4":
			ext = ".mp4"
		case "video/quicktime":
			ext = ".mov"
		default:
			ext = ".tmp"
		}
	}

	// Create temporary file with proper extension
	tempFile, err := os.CreateTemp("", fmt.Sprintf("validation_*%s", ext))
	if err != nil {
		return "", fmt.Errorf("failed to create temp file: %w", err)
	}
	defer tempFile.Close()

	// Reset file pointer
	file.Seek(0, 0)

	// Copy multipart file to temp file
	_, err = io.Copy(tempFile, file)
	if err != nil {
		os.Remove(tempFile.Name())
		return "", fmt.Errorf("failed to copy file: %w", err)
	}

	// Reset file pointer for potential reuse
	file.Seek(0, 0)

	s.logger.Info("Created temp file for validation",
		zap.String("original_filename", header.Filename),
		zap.String("temp_path", tempFile.Name()),
		zap.String("extension", ext))

	return tempFile.Name(), nil
}

func (s AudioTranscriptionService) analyzeFastQualityFromTranscription(result *models.TranscriptionResult) *AudioQualityResult {
	var issues []string
	var recommendation string
	shouldReject := false

	// Calculate basic metrics
	transcript := strings.TrimSpace(result.Transcript)
	wordCount := len(strings.Fields(transcript))
	hasVoice := len(transcript) > 0
	log.Printf("confidence %v", result.Confidence)
	// Simple binary decision for fast validation
	score := 50.0 // Base score

	// Primary check: Is there any speech at all?
	if wordCount == 0 {
		issues = append(issues, "No speech detected in the audio")
		shouldReject = true
		recommendation = "No speech was detected in your video. Please ensure your microphone is working and speak clearly during recording."
		score = 0
	} else {
		// There's speech, check confidence
		if result.Confidence >= 0.6 {
			score = 80 // Good enough
			recommendation = "Audio quality looks good for processing."
		} else if result.Confidence >= 0.4 {
			score = 60
			recommendation = "Audio quality is acceptable but could be improved."
		} else if result.Confidence >= 0.3 {
			score = 40
			recommendation = "Audio quality needs improvement. Consider recording in a quieter space."
		} else {
			score = 20
			shouldReject = true
			recommendation = "Audio quality is too poor for processing. Please record in a quieter environment with better microphone positioning."
			issues = append(issues, "Very poor audio quality detected")
		}

		// Additional check for very short speech
		if wordCount < 3 {
			score -= 20
			issues = append(issues, "Very little speech detected")
			if wordCount == 1 {
				shouldReject = true
				recommendation = "Almost no speech detected. Please ensure you speak clearly for a longer duration."
			}
		}
	}

	// Estimate noise level quickly
	noiseLevel := "medium" // Default
	if result.Confidence >= 0.8 {
		noiseLevel = "low"
	} else if result.Confidence < 0.4 {
		noiseLevel = "high"
	}

	return &AudioQualityResult{
		Score:          math.Max(0, math.Min(100, score)),
		HasSpeech:      hasVoice,
		SpeechDuration: float64(wordCount) * 0.4, // Rough estimate
		TotalDuration:  20.0,                     // We only process 20 seconds
		NoiseLevel:     noiseLevel,
		Confidence:     result.Confidence,
		SpeechRatio:    float64(wordCount) * 0.4 / 20.0,
		Recommendation: recommendation,
		ShouldReject:   shouldReject,
		Issues:         issues,
	}
}
func (s AudioTranscriptionService) CleanupValidationFile(tempFilePath string) {
	if tempFilePath != "" {
		s.audioExtractor.Cleanup(tempFilePath)
	}
}

// Enhanced validation method
func (s AudioTranscriptionService) performLocalValidation(ctx context.Context, audioFilePath string) (*AudioQualityResult, error) {
	// Step 1: Local audio analysis (very fast)
	analysis, err := s.audioExtractor.AnalyzeAudioLocally(ctx, audioFilePath)
	if err != nil {
		return nil, fmt.Errorf("local audio analysis failed: %w", err)
	}

	result := &AudioQualityResult{
		SpeechDuration: analysis.Duration,
		TotalDuration:  analysis.Duration,
		HasSpeech:      analysis.EstimatedSpeech,
		NoiseLevel:     analysis.VolumeLevel,
	}

	// Quick rejection criteria
	if !analysis.HasAudio {
		result.ShouldReject = true
		result.Score = 0
		result.Recommendation = "No audio track detected in the video file."
		result.Issues = []string{"No audio stream found"}
		return result, nil
	}

	if analysis.Duration < 3.0 {
		result.ShouldReject = true
		result.Score = 10
		result.Recommendation = "Video is too short. Please record at least 5 seconds of content."
		result.Issues = []string{"Video too short"}
		return result, nil
	}

	if !analysis.EstimatedSpeech || analysis.SilenceRatio > 0.9 {
		result.ShouldReject = true
		result.Score = 20
		result.Recommendation = "Very little to no speech detected in the audio. Please ensure your microphone is working."
		result.Issues = []string{"No speech detected", "Too much silence"}
		return result, nil
	}

	// If local analysis looks promising, do a small AssemblyAI validation
	if analysis.EstimatedSpeech && analysis.Duration > 5 {
		return s.performSmallAssemblyValidation(ctx, audioFilePath, analysis.Duration)
	}

	// Default to local analysis result
	result.Score = 75
	result.Confidence = 0.7 // Estimated
	result.Recommendation = "Audio appears to be valid based on local analysis."

	return result, nil
}

// Optimized validation with tiny samples
func (s AudioTranscriptionService) performSmallAssemblyValidation(ctx context.Context, audioFilePath string, totalDuration float64) (*AudioQualityResult, error) {
	// Extract more samples to handle videos with intro/animation content
	// This ensures we catch testimonial speech even if it starts later in the video
	sampleDuration := 3.0 // 3 seconds each

	// Use more sample points to better cover the entire video duration
	// This handles cases where speech doesn't start immediately (intro, animation, etc.)
	var samples []float64
	if totalDuration <= 30 {
		// Short videos: sample at 15%, 40%, 65%, 85%
		samples = []float64{
			totalDuration * 0.15,
			totalDuration * 0.40,
			totalDuration * 0.65,
			totalDuration * 0.85,
		}
	} else if totalDuration <= 60 {
		// Medium videos: sample at 10%, 25%, 40%, 55%, 75%, 90%
		samples = []float64{
			totalDuration * 0.10,
			totalDuration * 0.25,
			totalDuration * 0.40,
			totalDuration * 0.55,
			totalDuration * 0.75,
			totalDuration * 0.90,
		}
	} else {
		// Longer videos: sample at 5%, 15%, 25%, 35%, 50%, 65%, 80%, 92%
		samples = []float64{
			totalDuration * 0.05,
			totalDuration * 0.15,
			totalDuration * 0.25,
			totalDuration * 0.35,
			totalDuration * 0.50,
			totalDuration * 0.65,
			totalDuration * 0.80,
			totalDuration * 0.92,
		}
	}

	var bestResult *models.TranscriptionResult
	var bestConfidence float64
	var successfulSamples int

	for i, startTime := range samples {
		if startTime+sampleDuration > totalDuration {
			startTime = math.Max(0, totalDuration-sampleDuration)
		}

		// Extract tiny sample
		samplePath, err := s.audioExtractor.ExtractValidationSample(ctx, audioFilePath, startTime, sampleDuration)
		if err != nil {
			s.logger.Warn("Failed to extract validation sample", zap.Int("sample", i), zap.Error(err))
			continue
		}
		defer s.audioExtractor.Cleanup(samplePath)

		// Upload tiny sample (should be very fast - typically <100KB)
		uploadURL, err := s.uploadMediaToAssemblyAI(ctx, samplePath, "audio/mp3")
		if err != nil {
			s.logger.Warn("Failed to upload validation sample", zap.Int("sample", i), zap.Error(err))
			continue
		}

		// Quick transcription with minimal features
		jobID, err := s.startMinimalTranscription(ctx, uploadURL)
		if err != nil {
			s.logger.Warn("Failed to start sample transcription", zap.Int("sample", i), zap.Error(err))
			continue
		}

		// Poll with short timeout
		result, err := s.pollWithTimeout(ctx, jobID, 30*time.Second)
		if err != nil {
			s.logger.Warn("Sample transcription failed", zap.Int("sample", i), zap.Error(err))
			continue
		}

		// Count successful transcriptions (even if low confidence)
		if result != nil && len(result.Transcript) > 0 {
			successfulSamples++
		}

		// Keep the best result
		if result.Confidence > bestConfidence {
			bestConfidence = result.Confidence
			bestResult = result
		}

		// Early success - if we get good confidence with actual words, accept immediately
		// Lowered threshold from 0.7 to 0.6 to be more lenient with intro videos
		if result.Confidence > 0.6 && len(strings.Fields(result.Transcript)) > 3 {
			s.logger.Info("Found clear speech in sample, accepting video",
				zap.Int("sample_number", i+1),
				zap.Float64("confidence", result.Confidence),
				zap.Int("word_count", len(strings.Fields(result.Transcript))))
			bestResult = result
			break
		}
	}

	// Be more lenient: accept if we got any reasonable transcription from any sample
	// This handles videos with intro/animation where only some samples contain speech
	if bestResult == nil || (bestConfidence < 0.4 && successfulSamples == 0) {
		return &AudioQualityResult{
			Score:          0,
			HasSpeech:      false,
			ShouldReject:   true,
			Recommendation: "Unable to detect clear speech in the audio samples. Please ensure the video contains spoken content.",
			Issues:         []string{"No transcribable speech content found in multiple samples"},
		}, nil
	}

	// If we found at least some transcription, be lenient and accept it
	// This is important for videos with intro sections before the main content
	if bestConfidence >= 0.4 || successfulSamples > 0 {
		s.logger.Info("Accepting video with detected speech",
			zap.Float64("best_confidence", bestConfidence),
			zap.Int("successful_samples", successfulSamples),
			zap.Int("total_samples", len(samples)))
	}

	return s.analyzeFastQualityFromTranscription(bestResult), nil
}

// Minimal transcription for validation (fastest possible)
func (s AudioTranscriptionService) startMinimalTranscription(ctx context.Context, uploadURL string) (string, error) {
	payload := map[string]any{
		"audio_url":          uploadURL,
		"punctuate":          false,
		"format_text":        false,
		"speaker_labels":     false,
		"auto_highlights":    false,
		"sentiment_analysis": false,
		"language_detection": false,
		"dual_channel":       false,
		"speech_model":       "nano", // Fastest model
		"boost_param":        "low",  // Lowest processing
	}

	payloadBytes, err := json.Marshal(payload)
	if err != nil {
		return "", err
	}

	req, err := http.NewRequestWithContext(ctx, "POST", "https://api.assemblyai.com/v2/transcript", bytes.NewBuffer(payloadBytes))
	if err != nil {
		return "", err
	}

	req.Header.Set("Authorization", s.assemblyAIKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("transcription request failed with status %d: %s", resp.StatusCode, string(body))
	}

	var transcriptResp struct {
		ID string `json:"id"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&transcriptResp); err != nil {
		return "", err
	}

	return transcriptResp.ID, nil
}

// Poll with timeout for validation
func (s AudioTranscriptionService) pollWithTimeout(ctx context.Context, jobID string, timeout time.Duration) (*models.TranscriptionResult, error) {
	url := fmt.Sprintf("https://api.assemblyai.com/v2/transcript/%s", jobID)
	ticker := time.NewTicker(3 * time.Second) // Optimized: Check every 3 seconds (67% reduction, transcription takes minutes anyway)
	defer ticker.Stop()
	timeoutTimer := time.After(timeout)

	for {
		select {
		case <-ctx.Done():
			return nil, ctx.Err()
		case <-timeoutTimer:
			return nil, fmt.Errorf("validation timeout after %v", timeout)
		case <-ticker.C:
			req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
			if err != nil {
				continue
			}

			req.Header.Set("Authorization", s.assemblyAIKey)

			resp, err := s.httpClient.Do(req)
			if err != nil {
				continue
			}

			var result struct {
				Status     string  `json:"status"`
				Text       string  `json:"text"`
				Confidence float64 `json:"confidence"`
				Language   string  `json:"language_code"`
				Error      string  `json:"error"`
			}

			if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
				resp.Body.Close()
				continue
			}
			resp.Body.Close()

			switch result.Status {
			case "completed":
				return &models.TranscriptionResult{
					Transcript: result.Text,
					Language:   result.Language,
					Confidence: result.Confidence,
				}, nil
			case "error":
				return nil, fmt.Errorf("transcription failed: %s", result.Error)
			case "queued", "processing":
				continue
			default:
				return nil, fmt.Errorf("unexpected status: %s", result.Status)
			}
		}
	}
}
