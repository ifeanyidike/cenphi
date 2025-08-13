package ai

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
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
	transcribeCtx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
	defer cancel()

	// Check cache first
	cacheKey := fmt.Sprintf("transcript:%s", mediaURL)
	var cached models.TranscriptionResult
	if err := s.cacheService.Get(transcribeCtx, cacheKey, &cached); err == nil {
		return &cached, nil
	}

	mediaInfo, err := s.audioExtractor.DownloadAndPrepareForTranscription(transcribeCtx, mediaURL)
	if err != nil {
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

	ticker := time.NewTicker(2 * time.Second)
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
