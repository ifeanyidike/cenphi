// internal/services/testimonial_collection_service.go
package services

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"maps"
	"mime/multipart"
	"os"
	"path/filepath"
	"slices"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/ifeanyidike/cenphi/internal/ai"
	"github.com/ifeanyidike/cenphi/internal/mailing"
	"github.com/ifeanyidike/cenphi/internal/models"
	"github.com/ifeanyidike/cenphi/internal/queue"
	"github.com/ifeanyidike/cenphi/internal/repositories"
	"github.com/ifeanyidike/cenphi/internal/sse"
	"github.com/ifeanyidike/cenphi/internal/storage"
	"github.com/ifeanyidike/cenphi/internal/utils"
	"github.com/ifeanyidike/cenphi/internal/vector_store"
	"github.com/jmoiron/sqlx"
	"github.com/redis/go-redis/v9"
	"go.uber.org/zap"
	"golang.org/x/oauth2"
)

// TestimonialCollectionService handles testimonial collection and initial AI processing
type TestimonialCollectionService struct {
	repo                      repositories.TestimonialRepository
	jobRepo                   repositories.JobRepository
	storageService            *storage.StorageFactory
	documentProcessor         *DocumentProcessor
	driveService              *DriveService
	fileProcessor             *FileProcessor
	mailingService            *mailing.Service
	queueService              queue.Service
	audioTranscriptionService ai.AudioTranscriptionService
	vectorStoreService        *vector_store.VectorStoreService
	sseManager                *sse.SSEManager
	videoCompressor           *ai.VideoCompressor

	db     *sql.DB
	sqlxDB *sqlx.DB
	redis  *redis.Client
	logger *zap.Logger
}

func NewTestimonialCollectionService(
	repo repositories.TestimonialRepository,
	jobRepo repositories.JobRepository,
	storageService *storage.StorageFactory,
	driveService *DriveService,
	mailingService *mailing.Service,
	queueService queue.Service,
	audioTranscriptionService ai.AudioTranscriptionService,
	workspaceRepo repositories.WorkspaceRepository,
	vectorStoreService *vector_store.VectorStoreService,
	sseManager *sse.SSEManager,
	db *sql.DB,
	redis *redis.Client,
	logger *zap.Logger,
) TestimonialCollectionService {
	fileProcessor := NewFileProcessor(logger)
	documentProcessor := NewDocumentProcessor(logger)

	// Convert *sql.DB to *sqlx.DB for video compressor
	sqlxDB := sqlx.NewDb(db, "postgres")

	// Initialize video compressor with SSE manager
	videoCompressor := ai.NewVideoCompressor(logger, sseManager, sqlxDB)

	return TestimonialCollectionService{
		repo:                      repo,
		jobRepo:                   jobRepo,
		storageService:            storageService,
		fileProcessor:             fileProcessor,
		driveService:              driveService,
		mailingService:            mailingService,
		documentProcessor:         documentProcessor,
		queueService:              queueService,
		audioTranscriptionService: audioTranscriptionService,
		vectorStoreService:        vectorStoreService,
		sseManager:                sseManager,
		videoCompressor:           videoCompressor,

		db:     db,
		sqlxDB: sqlxDB,
		redis:  redis,
		logger: logger,
	}
}

// CollectTextTestimonial handles text testimonial submission
func (tcs TestimonialCollectionService) CollectTextTestimonial(ctx context.Context, data models.TestimonialUpload) (*models.Testimonial, error) {
	testimonial := &models.Testimonial{
		ID:                 uuid.New(),
		WorkspaceID:        data.WorkspaceID,
		AuthorName:         &data.AuthorName,
		AuthorEmail:        &data.AuthorEmail,
		AuthorCompany:      &data.AuthorCompany,
		AuthorTitle:        &data.AuthorTitle,
		Type:               "text",
		Status:             "draft",
		Content:            &data.Content,
		CollectionMethod:   data.CollectionMethod,
		TranscriptSegments: nil,
		Rating:             data.Rating,
		ProcessingStatus:   "pending",
		Tags:               data.Tags,
		Metadata: models.JSONMap{
			"submission_type": "text",
			"content_length":  len(data.Content),
			"submitted_at":    time.Now().Unix(),
		},
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	// Save testimonial to database
	err := tcs.repo.Create(ctx, testimonial, tcs.db)
	if err != nil {
		return nil, fmt.Errorf("failed to save text testimonial: %w", err)
	}

	// Queue text processing jobs asynchronously
	go func() {
		if err := tcs.queueTextProcessingJobs(context.Background(), testimonial); err != nil {
			tcs.logger.Error("Failed to queue text processing jobs",
				zap.String("testimonial_id", testimonial.ID.String()),
				zap.Error(err))
		}
	}()

	tcs.logger.Info("Text testimonial collected",
		zap.String("testimonial_id", testimonial.ID.String()),
		zap.String("workspace_id", data.WorkspaceID.String()),
		zap.String("collection_method", data.CollectionMethod))

	// Upload to vector store asynchronously
	go func() {
		if err := tcs.uploadToVectorStore(context.Background(), testimonial); err != nil {
			tcs.logger.Error("Failed to upload testimonial to vector store",
				zap.String("testimonial_id", testimonial.ID.String()),
				zap.Error(err))
		}
	}()

	return testimonial, nil
}

// uploadToVectorStore uploads testimonial to vector store for "Talk to Your Data" functionality
func (tcs TestimonialCollectionService) uploadToVectorStore(ctx context.Context, testimonial *models.Testimonial) error {
	if tcs.vectorStoreService == nil {
		tcs.logger.Debug("Vector store service not available, skipping upload")
		return nil
	}

	return tcs.vectorStoreService.UploadTestimonialToVectorStore(ctx, testimonial)
}

// VideoCompressionResult holds the result of video compression and upload
type VideoCompressionResult struct {
	StorageURL       string
	OriginalSizeMB   float64
	FinalSizeMB      float64
	Compressed       bool
	ReductionPercent float64
	Metadata         models.JSONMap
}

// VideoUploadResult holds the testimonial and compression session ID for SSE tracking
type VideoUploadResult struct {
	Testimonial *models.Testimonial
	SessionID   uuid.UUID
}

// compressAndUploadVideo handles the complete video compression and upload pipeline
// It accepts an io.Reader (from multipart upload, Google Drive download, etc.),
// compresses the video, and uploads to storage
func (tcs TestimonialCollectionService) compressAndUploadVideo(
	ctx context.Context,
	reader io.Reader,
	filename string,
	contentType string,
	sessionID uuid.UUID,
) (*VideoCompressionResult, error) {
	// Determine file extension
	fileExt := extractFileExtension(filename, contentType)

	// Step 1: Save to temporary file for compression
	tempDir := "/tmp/video_uploads"
	if err := os.MkdirAll(tempDir, 0755); err != nil {
		return nil, fmt.Errorf("failed to create temp directory: %w", err)
	}

	tempPath := filepath.Join(tempDir, fmt.Sprintf("%s.%s", sessionID.String(), fileExt))
	tempFile, err := os.Create(tempPath)
	if err != nil {
		return nil, fmt.Errorf("failed to create temp file: %w", err)
	}

	// Copy reader to temp file
	originalSize, err := io.Copy(tempFile, reader)
	tempFile.Close()
	if err != nil {
		os.Remove(tempPath)
		return nil, fmt.Errorf("failed to save temp file: %w", err)
	}

	// Ensure cleanup of temp file
	defer func() {
		if _, err := os.Stat(tempPath); err == nil {
			os.Remove(tempPath)
		}
	}()

	// Step 2: Compress video
	compressionResult, err := tcs.videoCompressor.CompressVideoForStorage(ctx, tempPath, sessionID)
	if err != nil {
		tcs.logger.Error("Compression failed unexpectedly",
			zap.String("session_id", sessionID.String()),
			zap.Error(err))
		return nil, fmt.Errorf("video compression failed: %w", err)
	}

	// Step 3: Handle compression result
	var finalPath string
	var finalFileSize int64

	if !compressionResult.Success {
		// Compression failed
		if compressionResult.ShouldRetrySmaller {
			// File too large and compression failed
			return nil, fmt.Errorf("video file too large for compression. Please upload a file smaller than 200MB")
		}
		// Compression failed but file is small - use original
		tcs.logger.Warn("Using original file due to compression failure",
			zap.String("session_id", sessionID.String()),
			zap.Float64("file_size_mb", compressionResult.OriginalSizeMB))
		finalPath = tempPath
		finalFileSize = originalSize
	} else {
		// Compression succeeded
		if compressionResult.CompressedPath != tempPath {
			// Replace original with compressed
			if err := tcs.videoCompressor.ReplaceWithCompressed(tempPath, compressionResult.CompressedPath); err != nil {
				tcs.logger.Warn("Failed to replace with compressed, using compressed path",
					zap.Error(err))
				finalPath = compressionResult.CompressedPath
			} else {
				finalPath = tempPath
			}
		} else {
			finalPath = tempPath
		}
		finalFileSize = int64(compressionResult.CompressedSizeMB * 1024 * 1024)

		tcs.logger.Info("Video compression completed",
			zap.String("session_id", sessionID.String()),
			zap.Float64("original_mb", compressionResult.OriginalSizeMB),
			zap.Float64("compressed_mb", compressionResult.CompressedSizeMB),
			zap.Float64("reduction_percent", compressionResult.ReductionPercent))
	}

	// Step 4: Upload final file to storage
	finalFile, err := os.Open(finalPath)
	if err != nil {
		return nil, fmt.Errorf("failed to open final file for upload: %w", err)
	}
	defer finalFile.Close()

	// Create multipart header for upload
	finalHeader := &multipart.FileHeader{
		Filename: filename,
		Size:     finalFileSize,
		Header:   make(map[string][]string),
	}
	finalHeader.Header.Set("Content-Type", contentType)

	fileURL, err := tcs.storageService.UploadFile(ctx, finalFile, finalHeader, contentType)
	if err != nil {
		return nil, fmt.Errorf("failed to upload video: %w", err)
	}

	// Step 5: Build metadata
	metadata := models.JSONMap{
		"original_filename": strings.ReplaceAll(filename, "\x00", ""),
		"file_size":         originalSize,
		"final_file_size":   finalFileSize,
		"content_type":      contentType,
		"session_id":        sessionID.String(),
	}

	if compressionResult.Success {
		metadata["compressed"] = true
		metadata["original_size_mb"] = compressionResult.OriginalSizeMB
		metadata["compressed_size_mb"] = compressionResult.CompressedSizeMB
		metadata["compression_reduction_percent"] = compressionResult.ReductionPercent
		metadata["compression_quality"] = "visually_lossless_crf20"
	} else {
		metadata["compressed"] = false
		metadata["compression_skipped_reason"] = "compression_failed"
		if compressionResult.Error != nil {
			metadata["compression_error"] = compressionResult.Error.Error()
		}
	}

	return &VideoCompressionResult{
		StorageURL:       fileURL,
		OriginalSizeMB:   float64(originalSize) / (1024 * 1024),
		FinalSizeMB:      float64(finalFileSize) / (1024 * 1024),
		Compressed:       compressionResult.Success,
		ReductionPercent: compressionResult.ReductionPercent,
		Metadata:         metadata,
	}, nil
}

// ProcessRecordedVideo handles recorded video submissions
func (tcs TestimonialCollectionService) ProcessRecordedVideo(
	ctx context.Context,
	data models.TestimonialUpload,
	file multipart.File,
	header *multipart.FileHeader,
) (*VideoUploadResult, error) {
	return tcs.processVideo(ctx, data, file, header, "recorded", tcs.isValidRecordedVideoType, "Recorded video testimonial processed")
}

// ProcessUploadedVideo handles uploaded video submissions
func (tcs TestimonialCollectionService) ProcessUploadedVideo(
	ctx context.Context,
	data models.TestimonialUpload,
	file multipart.File,
	header *multipart.FileHeader,
) (*VideoUploadResult, error) {
	return tcs.processVideo(ctx, data, file, header, "uploaded", tcs.isValidUploadedVideoType, "Uploaded video testimonial processed")
}

// Unified video processing method with compression
func (tcs TestimonialCollectionService) processVideo(
	ctx context.Context,
	data models.TestimonialUpload,
	file multipart.File,
	header *multipart.FileHeader,
	videoSource string,
	validateFn func(string) bool,
	logMessage string,
) (*VideoUploadResult, error) {
	contentType := header.Header.Get("Content-Type")
	if !validateFn(contentType) {
		return nil, fmt.Errorf("invalid video format: %s", contentType)
	}

	// Create a session ID for SSE tracking
	sessionID := uuid.New()

	// Use the DRY compression and upload helper
	result, err := tcs.compressAndUploadVideo(ctx, file, header.Filename, contentType, sessionID)
	if err != nil {
		return nil, err
	}

	fileExt := extractFileExtension(header.Filename, contentType)

	testimonial := &models.Testimonial{
		ID:               uuid.New(),
		WorkspaceID:      data.WorkspaceID,
		AuthorName:       &data.AuthorName,
		AuthorEmail:      &data.AuthorEmail,
		AuthorCompany:    &data.AuthorCompany,
		AuthorTitle:      &data.AuthorTitle,
		Type:             "video",
		Format:           fileExt,
		Status:           "draft",
		MediaURL:         &result.StorageURL,
		CollectionMethod: data.CollectionMethod,
		ProcessingStatus: "pending",
		Rating:           data.Rating,
		Tags:             data.Tags,
		CreatedAt:        time.Now(),
		UpdatedAt:        time.Now(),
	}

	// Add video source and submission time to metadata
	result.Metadata["video_source"] = videoSource
	result.Metadata["submitted_at"] = time.Now().Unix()

	// Validate JSON before assignment
	if _, err := json.Marshal(result.Metadata); err != nil {
		return nil, fmt.Errorf("invalid metadata JSON: %w", err)
	}

	testimonial.Metadata = result.Metadata

	// Save testimonial to database
	if err := tcs.repo.Create(ctx, testimonial, tcs.db); err != nil {
		tcs.storageService.Delete(ctx, result.StorageURL)
		return nil, fmt.Errorf("failed to save video testimonial: %w", err)
	}

	// Queue video processing jobs asynchronously
	go func() {
		if err := tcs.queueVideoProcessingJobs(context.Background(), testimonial); err != nil {
			tcs.logger.Error("Failed to queue video processing jobs",
				zap.String("testimonial_id", testimonial.ID.String()),
				zap.Error(err))
		}
	}()

	tcs.logger.Info(logMessage,
		zap.String("testimonial_id", testimonial.ID.String()),
		zap.String("workspace_id", data.WorkspaceID.String()),
		zap.String("collection_method", data.CollectionMethod),
		zap.String("file_format", fileExt),
	)

	// Upload to vector store asynchronously
	go func() {
		if err := tcs.uploadToVectorStore(context.Background(), testimonial); err != nil {
			tcs.logger.Error("Failed to upload video testimonial to vector store",
				zap.String("testimonial_id", testimonial.ID.String()),
				zap.Error(err))
		}
	}()

	return &VideoUploadResult{
		Testimonial: testimonial,
		SessionID:   sessionID,
	}, nil
}

func (tcs TestimonialCollectionService) queueTextProcessingJobs(ctx context.Context, testimonial *models.Testimonial) error {
	if testimonial.Content == nil || *testimonial.Content == "" {
		tcs.logger.Warn("Skipping text processing - no content available",
			zap.String("testimonial_id", testimonial.ID.String()))
		return nil
	}

	// var jobs []*models.Job
	// Create jobs for text processing
	sentimentJob := &models.Job{
		ID:            uuid.New(),
		JobType:       "sentiment_analysis",
		TestimonialID: &testimonial.ID,
		WorkspaceID:   &testimonial.WorkspaceID,
		Status:        "pending",
		Priority:      1,
		Payload: models.JSONMap{
			"testimonial_id": testimonial.ID.String(),
			"content":        *testimonial.Content,
			"type":           "text",
		},
		MaxRetries:  3,
		ScheduledAt: &time.Time{},
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}
	*sentimentJob.ScheduledAt = time.Now()

	if err := tcs.createAndPublishJob(ctx, sentimentJob); err != nil {
		tcs.logger.Error("Failed to create and publish text processing job",
			zap.String("job_type", sentimentJob.JobType),
			zap.String("testimonial_id", testimonial.ID.String()),
			zap.Error(err))
	}

	tcs.logger.Info("Text processing jobs queued successfully",
		zap.String("testimonial_id", testimonial.ID.String()))

	return nil
}

// Proper video processing job queueing using RabbitMQ
func (tcs TestimonialCollectionService) queueVideoProcessingJobs(ctx context.Context, testimonial *models.Testimonial) error {
	if testimonial.MediaURL == nil || *testimonial.MediaURL == "" {
		tcs.logger.Warn("Skipping video processing - no media URL available",
			zap.String("testimonial_id", testimonial.ID.String()))
		return nil
	}

	// Create transcription job (highest priority)
	transcriptionJob := &models.Job{
		ID:            uuid.New(),
		JobType:       "transcription",
		TestimonialID: &testimonial.ID,
		WorkspaceID:   &testimonial.WorkspaceID,
		Status:        "pending",
		Priority:      1,
		Payload: models.JSONMap{
			"testimonial_id": testimonial.ID.String(),
			"media_url":      *testimonial.MediaURL,
			"type":           testimonial.Type,
			"format":         testimonial.Format,
			"language":       "en",
		},
		MaxRetries:  3,
		ScheduledAt: &time.Time{},
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}
	*transcriptionJob.ScheduledAt = time.Now()

	// Create dependent jobs
	dependentJobs := []*models.Job{
		{
			ID:            uuid.New(),
			JobType:       "sentiment_analysis",
			TestimonialID: &testimonial.ID,
			WorkspaceID:   &testimonial.WorkspaceID,
			Status:        "pending",
			Priority:      2,
			Payload: models.JSONMap{
				"testimonial_id": testimonial.ID.String(),
				"type":           "video",
				"depends_on":     transcriptionJob.ID.String(),
			},
			MaxRetries:  5,
			ScheduledAt: &time.Time{},
			CreatedAt:   time.Now(),
			UpdatedAt:   time.Now(),
		},
		{
			ID:            uuid.New(),
			JobType:       "highlight_extraction",
			TestimonialID: &testimonial.ID,
			WorkspaceID:   &testimonial.WorkspaceID,
			Status:        "pending",
			Priority:      3,
			Payload: models.JSONMap{
				"testimonial_id":       testimonial.ID.String(),
				"max_highlights":       5,
				"min_importance_score": 0.7,
				"depends_on":           transcriptionJob.ID.String(),
			},
			MaxRetries:  5,
			ScheduledAt: &time.Time{},
			CreatedAt:   time.Now(),
			UpdatedAt:   time.Now(),
		},
	}

	// Set scheduled times for dependent jobs
	for _, job := range dependentJobs {
		*job.ScheduledAt = time.Now()
	}

	// Combine all jobs
	allJobs := append([]*models.Job{transcriptionJob}, dependentJobs...)

	// Process each job
	for _, job := range allJobs {
		if err := tcs.createAndPublishJob(ctx, job); err != nil {
			tcs.logger.Error("Failed to create and publish video processing job",
				zap.String("job_type", job.JobType),
				zap.String("testimonial_id", testimonial.ID.String()),
				zap.Error(err))
			continue
		}
	}

	tcs.logger.Info("Video processing jobs queued successfully",
		zap.String("testimonial_id", testimonial.ID.String()),
		zap.String("transcription_job_id", transcriptionJob.ID.String()),
		zap.Int("jobs_count", len(allJobs)))

	return nil
}

// Create job in database and publish to RabbitMQ queue
func (tcs TestimonialCollectionService) createAndPublishJob(ctx context.Context, job *models.Job) error {
	// STEP 1: Add to Redis with job type for proper TTL
	jobPayload := map[string]interface{}{
		"job_type": job.JobType,
	}

	if job.TestimonialID != nil {
		jobPayload["testimonial_id"] = job.TestimonialID.String()
	}
	if job.WorkspaceID != nil {
		jobPayload["workspace_id"] = job.WorkspaceID.String()
	}

	tcs.queueService.SetJobStatus(ctx, job.ID.String(), "pending", 0, jobPayload)

	// STEP 2: Create and publish queue message
	queuePayload := make(map[string]any)
	maps.Copy(queuePayload, job.Payload)
	if _, exists := queuePayload["workspace_id"]; !exists && job.WorkspaceID != nil {
		queuePayload["workspace_id"] = job.WorkspaceID.String()
	}

	queueMessage := queue.Message{
		ID:      job.ID.String(),
		Type:    job.JobType,
		Payload: queuePayload,
	}

	queueName := tcs.getQueueNameForJobType(job.JobType)
	if _, err := tcs.queueService.Publish(ctx, queueName, queueMessage); err != nil {
		return fmt.Errorf("failed to publish job: %w", err)
	}

	tcs.logger.Debug("Job created and published (Redis only)",
		zap.String("job_id", job.ID.String()),
		zap.String("job_type", job.JobType),
		zap.String("queue", queueName))

	return nil
}

// Map job types to appropriate queue names
func (tcs TestimonialCollectionService) getQueueNameForJobType(jobType string) string {
	switch jobType {
	case "transcription":
		return "transcription" // High priority queue for transcription
	case "sentiment_analysis":
		return "sentiment_analysis" // Standard AI processing queue
	case "highlight_extraction":
		return "highlight_extraction"
	default:
		return "ai-processing" // Default queue
	}
}

// CollectFromWidget handles testimonial submission from widget
func (tcs TestimonialCollectionService) CollectFromWidget(ctx context.Context, data models.TestimonialUpload) (*models.Testimonial, error) {
	testimonial := &models.Testimonial{
		ID:                 uuid.New(),
		WorkspaceID:        data.WorkspaceID,
		AuthorName:         &data.AuthorName,
		AuthorEmail:        &data.AuthorEmail,
		AuthorCompany:      &data.AuthorCompany,
		AuthorTitle:        &data.AuthorTitle,
		Type:               "text",
		Status:             "draft",
		Content:            &data.Content,
		TranscriptSegments: nil,
		CollectionMethod:   data.CollectionMethod,
		Rating:             data.Rating,
		ProcessingStatus:   "pending",
		Tags:               data.Tags,
		Metadata: models.JSONMap{
			"source":          "widget",
			"user_agent":      "", // Would be populated from request
			"ip_address":      "", // Would be populated from request
			"submission_type": "form",
		},
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	err := tcs.repo.Create(ctx, testimonial, tcs.db)
	if err != nil {
		return nil, fmt.Errorf("failed to save testimonial: %w", err)
	}

	// Queue processing jobs asynchronously
	go func() {
		if err := tcs.queueTextProcessingJobs(context.Background(), testimonial); err != nil {
			tcs.logger.Error("Failed to queue widget testimonial processing",
				zap.String("testimonial_id", testimonial.ID.String()),
				zap.Error(err))
		}
	}()

	tcs.logger.Info("Testimonial collected from widget",
		zap.String("testimonial_id", testimonial.ID.String()),
		zap.String("workspace_id", data.WorkspaceID.String()))

	// Upload to vector store asynchronously
	go func() {
		if err := tcs.uploadToVectorStore(context.Background(), testimonial); err != nil {
			tcs.logger.Error("Failed to upload widget testimonial to vector store",
				zap.String("testimonial_id", testimonial.ID.String()),
				zap.Error(err))
		}
	}()

	return testimonial, nil
}

// CollectFromForm handles testimonial submission from web form
func (tcs TestimonialCollectionService) CollectFromForm(ctx context.Context, data models.TestimonialUpload) (*models.Testimonial, error) {
	testimonial := &models.Testimonial{
		ID:                 uuid.New(),
		WorkspaceID:        data.WorkspaceID,
		AuthorName:         &data.AuthorName,
		AuthorEmail:        &data.AuthorEmail,
		AuthorCompany:      &data.AuthorCompany,
		AuthorTitle:        &data.AuthorTitle,
		Type:               "text",
		Status:             "draft",
		Content:            &data.Content,
		TranscriptSegments: nil,
		CollectionMethod:   data.CollectionMethod,
		Rating:             data.Rating,
		ProcessingStatus:   "pending",
		Tags:               data.Tags,
		Metadata: models.JSONMap{
			"source":          "form",
			"submission_type": "form",
		},
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	err := tcs.repo.Create(ctx, testimonial, tcs.db)
	if err != nil {
		return nil, fmt.Errorf("failed to save testimonial: %w", err)
	}

	// Queue processing jobs asynchronously
	go func() {
		if err := tcs.queueTextProcessingJobs(context.Background(), testimonial); err != nil {
			tcs.logger.Error("Failed to queue form testimonial processing",
				zap.String("testimonial_id", testimonial.ID.String()),
				zap.Error(err))
		}
	}()

	tcs.logger.Info("Testimonial collected from form",
		zap.String("testimonial_id", testimonial.ID.String()),
		zap.String("workspace_id", data.WorkspaceID.String()))

	// Upload to vector store asynchronously
	go func() {
		if err := tcs.uploadToVectorStore(context.Background(), testimonial); err != nil {
			tcs.logger.Error("Failed to upload form testimonial to vector store",
				zap.String("testimonial_id", testimonial.ID.String()),
				zap.Error(err))
		}
	}()

	return testimonial, nil
}

func (tcs TestimonialCollectionService) ValidateVideoFile(
	ctx context.Context,
	file multipart.File,
	header *multipart.FileHeader,
) (*ai.ValidationResult, error) {
	// Basic validation first
	contentType := header.Header.Get("Content-Type")
	if !tcs.isValidVideoType(contentType) {
		return nil, fmt.Errorf("invalid video format: %s. Supported formats: MP4, AVI, MOV, WMV, FLV, WebM", contentType)
	}

	// File size check
	maxSize := int64(250 << 20) // 250MB
	if header.Size > maxSize {
		return nil, fmt.Errorf("video file too large: %d MB. Maximum size is %d MB", header.Size/(1<<20), maxSize/(1<<20))
	}

	if header.Size < 1024 { // Less than 1KB
		return nil, fmt.Errorf("video file too small, likely corrupt")
	}

	// Audio content validation using AI service
	validationResult, err := tcs.audioTranscriptionService.ValidateVideoFile(ctx, file, header)
	if err != nil {
		tcs.logger.Error("Failed to validate video audio content",
			zap.String("filename", header.Filename),
			zap.Error(err))
		return nil, fmt.Errorf("unable to validate video audio content: %v", err)
	}

	if !validationResult.IsValid {
		tcs.logger.Info("Video rejected due to poor audio quality",
			zap.String("filename", header.Filename),
			zap.String("reason", validationResult.ErrorMessage))
		return nil, fmt.Errorf("%s", validationResult.ErrorMessage)
	}

	tcs.logger.Info("Video validation passed",
		zap.String("filename", header.Filename),
		zap.Float64("quality_score", validationResult.Quality.Score),
		zap.Bool("has_speech", validationResult.Quality.HasSpeech))

	return validationResult, nil
}

// ProcessVideoUpload handles video file uploads with compression
func (tcs TestimonialCollectionService) ProcessVideoUpload(ctx context.Context, workspaceID uuid.UUID, file multipart.File, header *multipart.FileHeader, authorData models.TestimonialUpload) (*models.Testimonial, error) {
	contentType := header.Header.Get("Content-Type")

	// Validate file type
	if !tcs.isValidVideoType(contentType) {
		return nil, fmt.Errorf("invalid video file type: %s", contentType)
	}

	// Create a session ID for tracking
	sessionID := uuid.New()

	// Compress and upload video using DRY helper
	result, err := tcs.compressAndUploadVideo(ctx, file, header.Filename, contentType, sessionID)
	if err != nil {
		return nil, fmt.Errorf("failed to process video: %w", err)
	}

	// Extract video metadata (duration + thumbnail uploaded to OCI)
	var duration *float64
	var thumbnailURL *string

	// Use background context with custom timeout for thumbnail extraction
	thumbnailCtx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)
	defer cancel()

	metadata, err := utils.ExtractVideoMetadataWithOCI(thumbnailCtx, result.StorageURL, workspaceID.String(), tcs.storageService)
	if err != nil {
		tcs.logger.Warn("Failed to extract video metadata, continuing without it",
			zap.Error(err),
			zap.String("video_url", result.StorageURL))
	} else {
		duration = &metadata.Duration
		thumbnailURL = &metadata.ThumbnailURL
		tcs.logger.Info("Extracted video metadata",
			zap.Float64("duration", metadata.Duration),
			zap.String("thumbnail_url", metadata.ThumbnailURL))
	}

	// Create testimonial record
	format := strings.TrimPrefix(filepath.Ext(header.Filename), ".")
	testimonial := &models.Testimonial{
		ID:               uuid.New(),
		WorkspaceID:      workspaceID,
		AuthorName:       &authorData.AuthorName,
		AuthorEmail:      &authorData.AuthorEmail,
		AuthorCompany:    &authorData.AuthorCompany,
		AuthorTitle:      &authorData.AuthorTitle,
		Type:             "video",
		Status:           "processing",
		Format:           format,
		MediaURL:         &result.StorageURL,
		Duration:         duration,
		ThumbnailURL:     thumbnailURL,
		CollectionMethod: authorData.CollectionMethod,
		Rating:           authorData.Rating,
		ProcessingStatus: "pending",
		Tags:             authorData.Tags,
		CreatedAt:        time.Now(),
		UpdatedAt:        time.Now(),
	}

	// Add upload method to metadata
	result.Metadata["upload_method"] = "video_upload"
	testimonial.Metadata = result.Metadata

	err = tcs.repo.Create(ctx, testimonial, tcs.db)
	if err != nil {
		// Clean up uploaded file if testimonial creation fails
		tcs.storageService.Delete(ctx, result.StorageURL)
		return nil, fmt.Errorf("failed to save testimonial: %w", err)
	}

	// Queue video processing jobs asynchronously
	go func() {
		if err := tcs.queueVideoProcessingJobs(context.Background(), testimonial); err != nil {
			tcs.logger.Error("Failed to queue uploaded video processing",
				zap.String("testimonial_id", testimonial.ID.String()),
				zap.Error(err))
		}
	}()

	tcs.logger.Info("Video testimonial processed",
		zap.String("testimonial_id", testimonial.ID.String()),
		zap.String("file_url", result.StorageURL))

	// Upload to vector store asynchronously
	go func() {
		if err := tcs.uploadToVectorStore(context.Background(), testimonial); err != nil {
			tcs.logger.Error("Failed to upload video testimonial to vector store",
				zap.String("testimonial_id", testimonial.ID.String()),
				zap.Error(err))
		}
	}()

	return testimonial, nil
}

// ProcessCSVUpload handles CSV file uploads for bulk import
func (tcs TestimonialCollectionService) ProcessCSVUpload(ctx context.Context, workspaceID uuid.UUID, file multipart.File) (*models.BulkImportResult, error) {
	testimonials, err := tcs.fileProcessor.ProcessCSV(ctx, file)
	if err != nil {
		return nil, fmt.Errorf("failed to process CSV: %w", err)
	}

	return tcs.processBulkImport(ctx, workspaceID, testimonials, "csv_import")
}

// ProcessXLSUpload handles Excel file uploads for bulk import
func (tcs TestimonialCollectionService) ProcessXLSUpload(ctx context.Context, workspaceID uuid.UUID, file multipart.File) (*models.BulkImportResult, error) {
	testimonials, err := tcs.fileProcessor.ProcessXLS(ctx, file)
	if err != nil {
		return nil, fmt.Errorf("failed to process Excel file: %w", err)
	}

	return tcs.processBulkImport(ctx, workspaceID, testimonials, "xls_import")
}

// ProcessGoogleDriveImport handles imports from Google Drive
func (tcs TestimonialCollectionService) ProcessGoogleDriveImport(ctx context.Context, workspaceID uuid.UUID, fileIDs []string) (*models.BulkImportResult, error) {
	if tcs.driveService == nil {
		return nil, fmt.Errorf("google Drive service not configured")
	}

	result := &models.BulkImportResult{
		Testimonials: make([]uuid.UUID, 0),
	}

	for _, fileID := range fileIDs {
		fileMetadata, err := tcs.driveService.GetFileMetadata(ctx, fileID)
		if err != nil {
			result.FailureCount++
			result.Errors = append(result.Errors, models.BulkImportError{
				Message: fmt.Sprintf("Failed to get metadata for file %s: %v", fileID, err),
				Data:    map[string]string{"file_id": fileID},
			})
			continue
		}

		// Process based on file type
		if strings.HasPrefix(fileMetadata.MimeType, "video/") {
			testimonial, err := tcs.processGoogleDriveVideo(ctx, workspaceID, fileID, fileMetadata)
			if err != nil {
				result.FailureCount++
				result.Errors = append(result.Errors, models.BulkImportError{
					Message: fmt.Sprintf("Failed to process video file %s: %v", fileMetadata.Name, err),
					Data:    fileMetadata,
				})
				continue
			}
			result.SuccessCount++
			result.Testimonials = append(result.Testimonials, testimonial.ID)
		}

		result.TotalProcessed++
	}

	return result, nil
}

// SendTestimonialRequest sends an email request for testimonials
func (tcs TestimonialCollectionService) SendTestimonialRequest(ctx context.Context, workspaceID uuid.UUID, contactEmail, contactName, companyName string) error {
	req := models.SendEmailRequest{
		WorkspaceID:   workspaceID.String(),
		ContactName:   companyName,
		ContactEmail:  contactEmail,
		CompanyName:   contactName,
		CustomMessage: "",
	}

	resp, err := tcs.mailingService.SendTestimonialRequest(ctx, req)
	fmt.Printf("email response %#v", resp)
	return err
}

// ProcessGoogleDriveImportWithAuth handles imports from Google Drive with authentication
func (tcs TestimonialCollectionService) ProcessGoogleDriveImportWithAuth(
	ctx context.Context,
	workspaceID uuid.UUID,
	fileIDs []string,
	token *oauth2.Token,
) (*models.BulkImportResult, error) {
	if tcs.driveService == nil {
		return nil, fmt.Errorf("google Drive service not configured")
	}

	authenticatedService, err := tcs.driveService.CreateServiceWithToken(ctx, token)
	if err != nil {
		return nil, fmt.Errorf("failed to authenticate with Google Drive: %w", err)
	}

	result := &models.BulkImportResult{
		Testimonials: make([]uuid.UUID, 0),
	}

	for _, fileID := range fileIDs {
		fileMetadata, err := authenticatedService.GetFileMetadata(ctx, fileID)
		if err != nil {
			result.FailureCount++
			result.Errors = append(result.Errors, models.BulkImportError{
				Message: fmt.Sprintf("Failed to get metadata for file %s: %v", fileID, err),
				Data:    map[string]string{"file_id": fileID},
			})
			continue
		}

		// Handle different file types appropriately
		switch {
		// Handle CSV files
		case strings.Contains(fileMetadata.MimeType, "text/csv") ||
			strings.HasSuffix(strings.ToLower(fileMetadata.Name), ".csv"):

			testimonials, err := tcs.processGoogleDriveCSV(ctx, workspaceID, fileID, fileMetadata, authenticatedService)
			if err != nil {
				result.FailureCount++
				result.Errors = append(result.Errors, models.BulkImportError{
					Message: fmt.Sprintf("Failed to process CSV file %s: %v", fileMetadata.Name, err),
					Data:    fileMetadata,
				})
				continue
			}
			result.SuccessCount += len(testimonials)
			for _, t := range testimonials {
				result.Testimonials = append(result.Testimonials, t.ID)
			}

		// Handle Excel files
		case strings.Contains(fileMetadata.MimeType, "spreadsheet") ||
			strings.Contains(fileMetadata.MimeType, "excel") ||
			strings.HasSuffix(strings.ToLower(fileMetadata.Name), ".xlsx") ||
			strings.HasSuffix(strings.ToLower(fileMetadata.Name), ".xls"):

			testimonials, err := tcs.processGoogleDriveExcel(ctx, workspaceID, fileID, fileMetadata, authenticatedService)
			if err != nil {
				result.FailureCount++
				result.Errors = append(result.Errors, models.BulkImportError{
					Message: fmt.Sprintf("Failed to process Excel file %s: %v", fileMetadata.Name, err),
					Data:    fileMetadata,
				})
				continue
			}
			result.SuccessCount += len(testimonials)
			for _, t := range testimonials {
				result.Testimonials = append(result.Testimonials, t.ID)
			}

		// Handle video files
		case strings.HasPrefix(fileMetadata.MimeType, "video/"):
			testimonial, err := tcs.processGoogleDriveVideoWithAuth(ctx, workspaceID, fileID, fileMetadata, authenticatedService)
			if err != nil {
				result.FailureCount++
				result.Errors = append(result.Errors, models.BulkImportError{
					Message: fmt.Sprintf("Failed to process video file %s: %v", fileMetadata.Name, err),
					Data:    fileMetadata,
				})
				continue
			}
			result.SuccessCount++
			result.Testimonials = append(result.Testimonials, testimonial.ID)

		// Handle document files (PDF, DOCX, etc.)
		case strings.HasPrefix(fileMetadata.MimeType, "text/") ||
			fileMetadata.MimeType == "application/pdf" ||
			strings.Contains(fileMetadata.MimeType, "document"):

			testimonial, err := tcs.processGoogleDriveDocument(ctx, workspaceID, fileID, fileMetadata, authenticatedService)
			if err != nil {
				result.FailureCount++
				result.Errors = append(result.Errors, models.BulkImportError{
					Message: fmt.Sprintf("Failed to process document %s: %v", fileMetadata.Name, err),
					Data:    fileMetadata,
				})
				continue
			}
			result.SuccessCount++
			result.Testimonials = append(result.Testimonials, testimonial.ID)

		default:
			result.FailureCount++
			result.Errors = append(result.Errors, models.BulkImportError{
				Message: fmt.Sprintf("Unsupported file type: %s (mime: %s)", fileMetadata.Name, fileMetadata.MimeType),
				Data:    fileMetadata,
			})
			continue
		}

		result.TotalProcessed++
	}

	return result, nil
}

// ============================================================================
// PRIVATE HELPER METHODS
// ============================================================================

func (tcs TestimonialCollectionService) processGoogleDriveCSV(ctx context.Context, workspaceID uuid.UUID, fileID string, metadata *DriveFile, authenticatedService *DriveService) ([]*models.Testimonial, error) {
	// Download CSV file
	reader, err := authenticatedService.DownloadFile(ctx, fileID)
	if err != nil {
		return nil, fmt.Errorf("failed to download CSV: %w", err)
	}
	defer reader.Close()

	// Process CSV using existing file processor
	testimonialUploads, err := tcs.fileProcessor.ProcessCSV(ctx, reader)
	if err != nil {
		return nil, fmt.Errorf("failed to process CSV: %w", err)
	}

	// Convert to testimonials
	var testimonials []*models.Testimonial
	for i, upload := range testimonialUploads {
		upload.WorkspaceID = workspaceID
		upload.CollectionMethod = "drive_csv_import"

		testimonial, err := tcs.CollectFromForm(ctx, upload)
		if err != nil {
			tcs.logger.Error("Failed to create testimonial from CSV row",
				zap.Int("row", i+2), // +2 for header and 1-based indexing
				zap.String("filename", metadata.Name),
				zap.Error(err))
			continue // Skip this row, continue with others
		}

		testimonials = append(testimonials, testimonial)
	}

	tcs.logger.Info("Successfully processed CSV from Google Drive",
		zap.String("filename", metadata.Name),
		zap.Int("total_rows", len(testimonialUploads)),
		zap.Int("successful_testimonials", len(testimonials)))

	return testimonials, nil
}

// NEW: Process Excel files from Google Drive
func (tcs TestimonialCollectionService) processGoogleDriveExcel(ctx context.Context, workspaceID uuid.UUID, fileID string, metadata *DriveFile, authenticatedService *DriveService) ([]*models.Testimonial, error) {
	// Download Excel file
	reader, err := authenticatedService.DownloadFile(ctx, fileID)
	if err != nil {
		return nil, fmt.Errorf("failed to download Excel file: %w", err)
	}
	defer reader.Close()

	// Process Excel using existing file processor
	testimonialUploads, err := tcs.fileProcessor.ProcessXLS(ctx, reader)
	if err != nil {
		return nil, fmt.Errorf("failed to process Excel file: %w", err)
	}

	// Convert to testimonials
	var testimonials []*models.Testimonial
	for i, upload := range testimonialUploads {
		upload.WorkspaceID = workspaceID
		upload.CollectionMethod = "drive_excel_import"

		testimonial, err := tcs.CollectFromForm(ctx, upload)
		if err != nil {
			tcs.logger.Error("Failed to create testimonial from Excel row",
				zap.Int("row", i+2), // +2 for header and 1-based indexing
				zap.String("filename", metadata.Name),
				zap.Error(err))
			continue // Skip this row, continue with others
		}

		testimonials = append(testimonials, testimonial)
	}

	tcs.logger.Info("Successfully processed Excel from Google Drive",
		zap.String("filename", metadata.Name),
		zap.Int("total_rows", len(testimonialUploads)),
		zap.Int("successful_testimonials", len(testimonials)))

	return testimonials, nil
}

func (tcs TestimonialCollectionService) processBulkImport(ctx context.Context, workspaceID uuid.UUID, uploads []models.TestimonialUpload, source string) (*models.BulkImportResult, error) {
	result := &models.BulkImportResult{
		TotalProcessed: len(uploads),
		Testimonials:   make([]uuid.UUID, 0),
	}

	for i, upload := range uploads {
		upload.WorkspaceID = workspaceID
		upload.CollectionMethod = source

		testimonial, err := tcs.CollectFromForm(ctx, upload)
		if err != nil {
			result.FailureCount++
			result.Errors = append(result.Errors, models.BulkImportError{
				Row:     i + 2, // Account for header row
				Message: err.Error(),
				Data:    upload,
			})
			continue
		}

		result.SuccessCount++
		result.Testimonials = append(result.Testimonials, testimonial.ID)
	}

	tcs.logger.Info("Bulk import completed",
		zap.String("workspace_id", workspaceID.String()),
		zap.String("source", source),
		zap.Int("total", result.TotalProcessed),
		zap.Int("success", result.SuccessCount),
		zap.Int("failures", result.FailureCount))

	return result, nil
}

func (tcs TestimonialCollectionService) processGoogleDriveVideo(ctx context.Context, workspaceID uuid.UUID, fileID string, metadata *DriveFile) (*models.Testimonial, error) {
	// Download file from Google Drive
	reader, err := tcs.driveService.DownloadFile(ctx, fileID)
	if err != nil {
		return nil, fmt.Errorf("failed to download file from Drive: %w", err)
	}
	defer reader.Close()

	// Save to temp file for validation
	tempDir := "/tmp/drive_downloads"
	if err := os.MkdirAll(tempDir, 0755); err != nil {
		return nil, fmt.Errorf("failed to create temp directory: %w", err)
	}

	fileExt := extractFileExtension(metadata.Name, metadata.MimeType)
	tempPath := filepath.Join(tempDir, fmt.Sprintf("drive_%s.%s", fileID, fileExt))
	tempFile, err := os.Create(tempPath)
	if err != nil {
		return nil, fmt.Errorf("failed to create temp file: %w", err)
	}

	fileSize, err := io.Copy(tempFile, reader)
	tempFile.Close()
	if err != nil {
		os.Remove(tempPath)
		return nil, fmt.Errorf("failed to save temp file: %w", err)
	}
	defer os.Remove(tempPath)

	// Validate video has audio/voice
	validationFile, err := os.Open(tempPath)
	if err != nil {
		return nil, fmt.Errorf("failed to open file for validation: %w", err)
	}
	defer validationFile.Close()

	validationHeader := &multipart.FileHeader{
		Filename: metadata.Name,
		Size:     fileSize,
		Header:   make(map[string][]string),
	}
	validationHeader.Header.Set("Content-Type", metadata.MimeType)

	validationResult, validationErr := tcs.audioTranscriptionService.ValidateVideoFile(ctx, validationFile, validationHeader)
	if validationErr != nil {
		tcs.logger.Error("Google Drive video validation system error",
			zap.String("filename", metadata.Name),
			zap.String("file_id", fileID),
			zap.Error(validationErr))
		return nil, fmt.Errorf("unable to validate video: %w", validationErr)
	}

	if !validationResult.IsValid {
		tcs.logger.Info("Google Drive video rejected - no voice detected",
			zap.String("filename", metadata.Name),
			zap.String("file_id", fileID),
			zap.String("reason", validationResult.ErrorMessage))
		return nil, fmt.Errorf("video validation failed: %s", validationResult.ErrorMessage)
	}

	// Reopen file as reader for compression
	validatedReader, err := os.Open(tempPath)
	if err != nil {
		return nil, fmt.Errorf("failed to reopen validated file: %w", err)
	}
	defer validatedReader.Close()

	// Create a session ID for tracking
	sessionID := uuid.New()

	// Compress and upload video using DRY helper
	result, err := tcs.compressAndUploadVideo(ctx, validatedReader, metadata.Name, metadata.MimeType, sessionID)
	if err != nil {
		return nil, fmt.Errorf("failed to process Google Drive video: %w", err)
	}

	// Create testimonial record
	format := strings.TrimPrefix(filepath.Ext(metadata.Name), ".")
	testimonial := &models.Testimonial{
		ID:               uuid.New(),
		WorkspaceID:      workspaceID,
		Type:             "video",
		Status:           "processing",
		Format:           format,
		MediaURL:         &result.StorageURL,
		CollectionMethod: "drive_import",
		ProcessingStatus: "pending",
		CreatedAt:        time.Now(),
		UpdatedAt:        time.Now(),
	}

	// Add Google Drive specific metadata
	result.Metadata["upload_method"] = "google_drive"
	result.Metadata["drive_file_id"] = fileID
	result.Metadata["drive_web_link"] = metadata.WebViewLink
	testimonial.Metadata = result.Metadata

	err = tcs.repo.Create(ctx, testimonial, tcs.db)
	if err != nil {
		// Clean up uploaded file if testimonial creation fails
		tcs.storageService.Delete(ctx, result.StorageURL)
		return nil, fmt.Errorf("failed to save testimonial: %w", err)
	}

	// Queue video processing jobs asynchronously
	go func() {
		if err := tcs.queueVideoProcessingJobs(context.Background(), testimonial); err != nil {
			tcs.logger.Error("Failed to queue Google Drive video processing",
				zap.String("testimonial_id", testimonial.ID.String()),
				zap.Error(err))
		}
	}()

	// Upload to vector store asynchronously
	go func() {
		if err := tcs.uploadToVectorStore(context.Background(), testimonial); err != nil {
			tcs.logger.Error("Failed to upload Google Drive video to vector store",
				zap.String("testimonial_id", testimonial.ID.String()),
				zap.Error(err))
		}
	}()

	return testimonial, nil
}

func (tcs TestimonialCollectionService) processGoogleDriveVideoWithAuth(
	ctx context.Context,
	workspaceID uuid.UUID,
	fileID string,
	metadata *DriveFile,
	authenticatedService *DriveService,
) (*models.Testimonial, error) {
	// Download file from Google Drive
	reader, err := authenticatedService.DownloadFile(ctx, fileID)
	if err != nil {
		return nil, fmt.Errorf("failed to download file from Drive: %w", err)
	}
	defer reader.Close()

	// Save to temp file for validation
	tempDir := "/tmp/drive_downloads"
	if err := os.MkdirAll(tempDir, 0755); err != nil {
		return nil, fmt.Errorf("failed to create temp directory: %w", err)
	}

	fileExt := extractFileExtension(metadata.Name, metadata.MimeType)
	tempPath := filepath.Join(tempDir, fmt.Sprintf("drive_auth_%s.%s", fileID, fileExt))
	tempFile, err := os.Create(tempPath)
	if err != nil {
		return nil, fmt.Errorf("failed to create temp file: %w", err)
	}

	fileSize, err := io.Copy(tempFile, reader)
	tempFile.Close()
	if err != nil {
		os.Remove(tempPath)
		return nil, fmt.Errorf("failed to save temp file: %w", err)
	}
	defer os.Remove(tempPath)

	// Validate video has audio/voice
	validationFile, err := os.Open(tempPath)
	if err != nil {
		return nil, fmt.Errorf("failed to open file for validation: %w", err)
	}
	defer validationFile.Close()

	validationHeader := &multipart.FileHeader{
		Filename: metadata.Name,
		Size:     fileSize,
		Header:   make(map[string][]string),
	}
	validationHeader.Header.Set("Content-Type", metadata.MimeType)

	validationResult, validationErr := tcs.audioTranscriptionService.ValidateVideoFile(ctx, validationFile, validationHeader)
	if validationErr != nil {
		tcs.logger.Error("Google Drive video validation system error (authenticated)",
			zap.String("filename", metadata.Name),
			zap.String("file_id", fileID),
			zap.Error(validationErr))
		return nil, fmt.Errorf("unable to validate video: %w", validationErr)
	}

	if !validationResult.IsValid {
		tcs.logger.Info("Google Drive video rejected - no voice detected (authenticated)",
			zap.String("filename", metadata.Name),
			zap.String("file_id", fileID),
			zap.String("reason", validationResult.ErrorMessage))
		return nil, fmt.Errorf("video validation failed: %s", validationResult.ErrorMessage)
	}

	// Reopen file as reader for compression
	validatedReader, err := os.Open(tempPath)
	if err != nil {
		return nil, fmt.Errorf("failed to reopen validated file: %w", err)
	}
	defer validatedReader.Close()

	// Create a session ID for tracking
	sessionID := uuid.New()

	// Compress and upload video using DRY helper
	result, err := tcs.compressAndUploadVideo(ctx, validatedReader, metadata.Name, metadata.MimeType, sessionID)
	if err != nil {
		return nil, fmt.Errorf("failed to process Google Drive video: %w", err)
	}

	// Create testimonial record
	format := strings.TrimPrefix(filepath.Ext(metadata.Name), ".")
	testimonial := &models.Testimonial{
		ID:               uuid.New(),
		WorkspaceID:      workspaceID,
		Type:             "video",
		Status:           "processing",
		Format:           format,
		MediaURL:         &result.StorageURL,
		CollectionMethod: "drive_import",
		ProcessingStatus: "pending",
		CreatedAt:        time.Now(),
		UpdatedAt:        time.Now(),
	}

	// Add Google Drive specific metadata
	result.Metadata["upload_method"] = "google_drive"
	result.Metadata["drive_file_id"] = fileID
	result.Metadata["drive_web_link"] = metadata.WebViewLink
	result.Metadata["created_time"] = metadata.CreatedTime
	result.Metadata["modified_time"] = metadata.ModifiedTime
	testimonial.Metadata = result.Metadata

	err = tcs.repo.Create(ctx, testimonial, tcs.db)
	if err != nil {
		// Clean up uploaded file if testimonial creation fails
		tcs.storageService.Delete(ctx, result.StorageURL)
		return nil, fmt.Errorf("failed to save testimonial: %w", err)
	}

	// Queue video processing jobs asynchronously
	go func() {
		if err := tcs.queueVideoProcessingJobs(context.Background(), testimonial); err != nil {
			tcs.logger.Error("Failed to queue authenticated Google Drive video processing",
				zap.String("testimonial_id", testimonial.ID.String()),
				zap.Error(err))
		}
	}()

	// Upload to vector store asynchronously
	go func() {
		if err := tcs.uploadToVectorStore(context.Background(), testimonial); err != nil {
			tcs.logger.Error("Failed to upload authenticated Google Drive video to vector store",
				zap.String("testimonial_id", testimonial.ID.String()),
				zap.Error(err))
		}
	}()

	return testimonial, nil
}

func (tcs TestimonialCollectionService) processGoogleDriveDocument(ctx context.Context, workspaceID uuid.UUID, fileID string, metadata *DriveFile, authenticatedService *DriveService) (*models.Testimonial, error) {
	// Download file
	reader, err := authenticatedService.DownloadFile(ctx, fileID)
	if err != nil {
		return nil, fmt.Errorf("failed to download document: %w", err)
	}
	defer reader.Close()

	// Read content
	// content, err := io.ReadAll(reader)
	testimonialContent, err := tcs.documentProcessor.ProcessDocumentFromReader(reader, metadata.MimeType, metadata.Name)
	if err != nil {
		return nil, fmt.Errorf("failed to extract text from document: %w", err)
	}

	if err := tcs.documentProcessor.ValidateDocumentContent(testimonialContent); err != nil {
		tcs.logger.Warn("Rejecting document due to poor content quality",
			zap.String("filename", metadata.Name),
			zap.String("file_id", fileID),
			zap.String("reason", err.Error()),
			zap.String("content_preview", testimonialContent[:min(200, len(testimonialContent))]))
		return nil, fmt.Errorf("invalid document content: %w", err)
	}

	var metadataName string
	if metadata != nil {
		metadataName = metadata.Name
	}

	format := safeExtractFormat(metadataName)

	documentMetadata := tcs.documentProcessor.ExtractDocumentMetadata(testimonialContent)

	metadataMap := make(models.JSONMap)
	if metadata != nil {
		if metadata.Name != "" {
			metadataMap["original_filename"] = metadata.Name
		}
		if metadata.Size > 0 {
			metadataMap["file_size"] = metadata.Size
		}
		if metadata.MimeType != "" {
			metadataMap["content_type"] = metadata.MimeType
		}
		metadataMap["upload_method"] = "google_drive"
		if fileID != "" {
			metadataMap["drive_file_id"] = fileID
		}
		if metadata.WebViewLink != "" {
			metadataMap["drive_web_link"] = metadata.WebViewLink
		}
		if metadata.CreatedTime != "" {
			metadataMap["created_time"] = metadata.CreatedTime
		}
		if metadata.ModifiedTime != "" {
			metadataMap["modified_time"] = metadata.ModifiedTime
		}

		// Add document analysis metadata
		for key, value := range documentMetadata {
			metadataMap[fmt.Sprintf("doc_%s", key)] = value
		}
	}

	status := "draft"
	if docMeta, ok := documentMetadata["likely_testimonial"].(bool); ok && docMeta {
		status = "approved" // Auto-approve if it looks like a testimonial
	}

	// Create text testimonial
	testimonial := &models.Testimonial{
		ID:               uuid.New(),
		WorkspaceID:      workspaceID,
		Type:             "text",
		Format:           format,
		Status:           status,
		Content:          &testimonialContent,
		CollectionMethod: "drive_import",
		ProcessingStatus: "completed",
		Metadata:         metadataMap,
		CreatedAt:        time.Now(),
		UpdatedAt:        time.Now(),
	}

	err = tcs.repo.Create(ctx, testimonial, tcs.db)
	if err != nil {
		return nil, fmt.Errorf("failed to save text testimonial: %w", err)
	}

	tcs.logger.Info("Successfully processed Google Drive document",
		zap.String("testimonial_id", testimonial.ID.String()),
		zap.String("filename", metadata.Name),
		zap.String("format", format),
		zap.Int("content_length", len(testimonialContent)))

	// Queue text processing jobs asynchronously
	go func() {
		if err := tcs.queueTextProcessingJobs(context.Background(), testimonial); err != nil {
			tcs.logger.Error("Failed to queue Google Drive document processing",
				zap.String("testimonial_id", testimonial.ID.String()),
				zap.Error(err))
		}
	}()

	// Upload to vector store asynchronously
	go func() {
		if err := tcs.uploadToVectorStore(context.Background(), testimonial); err != nil {
			tcs.logger.Error("Failed to upload Google Drive document to vector store",
				zap.String("testimonial_id", testimonial.ID.String()),
				zap.Error(err))
		}
	}()

	return testimonial, nil
}

// Validation methods
func (tcs TestimonialCollectionService) isValidRecordedVideoType(contentType string) bool {
	validTypes := []string{
		"video/webm", // Most common for browser recording
		"video/mp4",  // Common mobile format
	}

	return slices.Contains(validTypes, contentType)
}

func (tcs TestimonialCollectionService) isValidUploadedVideoType(contentType string) bool {
	validTypes := []string{
		"video/mp4",       // Most common
		"video/avi",       // Windows standard
		"video/quicktime", // MOV files from iOS/macOS
		"video/webm",      // Web standard
		"video/x-msvideo", // AVI alternative
	}

	for _, validType := range validTypes {
		if contentType == validType {
			return true
		}
	}
	return false
}

func (tcs TestimonialCollectionService) isValidVideoType(contentType string) bool {
	validTypes := []string{
		"video/mp4", "video/avi", "video/quicktime", "video/webm", "video/mov",
	}
	for _, validType := range validTypes {
		if contentType == validType {
			return true
		}
	}
	return false
}

func safeExtractFormat(filename string) string {
	if filename == "" {
		return "unknown"
	}

	ext := filepath.Ext(filename)
	if ext == "" {
		return "unknown"
	}

	// Safe string manipulation to prevent slice bounds errors
	if len(ext) > 1 && ext[0] == '.' {
		return strings.ToLower(ext[1:])
	}

	return strings.ToLower(ext)
}

func extractFileExtension(filename, contentType string) string {
	// Try to get extension from filename first
	if filename != "" {
		ext := strings.TrimPrefix(filepath.Ext(filename), ".")
		if ext != "" {
			return ext
		}
	}

	// Fallback to content type
	switch contentType {
	case "video/mp4":
		return "mp4"
	case "video/webm":
		return "webm"
	case "video/quicktime":
		return "mov"
	case "video/avi", "video/x-msvideo":
		return "avi"
	case "video/x-matroska":
		return "mkv"
	default:
		return "mp4" // Safe default
	}
}

// VoiceTestimonialRequest represents the request data for scheduling a voice testimonial
type VoiceTestimonialRequest struct {
	CustomerName      string `json:"customerName"`
	CustomerEmail     string `json:"customerEmail"`
	CustomerPhone     string `json:"customerPhone"`
	Company           string `json:"company"`
	PreferredCallTime string `json:"preferredCallTime"`
	Timezone          string `json:"timezone"`
	AdditionalNotes   string `json:"additionalNotes"`
	Rating            int    `json:"rating"`
	InitialText       string `json:"initialText"`
}

// ScheduleVoiceTestimonial schedules a voice testimonial call for later execution
func (tcs TestimonialCollectionService) ScheduleVoiceTestimonial(ctx context.Context, workspaceID uuid.UUID, req VoiceTestimonialRequest) (*models.Testimonial, error) {
	// Create a testimonial record with voice type and processing status
	testimonial := &models.Testimonial{
		ID:               uuid.New(),
		WorkspaceID:      workspaceID,
		AuthorName:       &req.CustomerName,
		AuthorEmail:      &req.CustomerEmail,
		AuthorCompany:    &req.Company,
		Type:             "voice",
		Status:           "draft",
		Content:          &req.InitialText,
		CollectionMethod: "voice",
		Rating:           &req.Rating,
		ProcessingStatus: "scheduled", // Will be updated when call completes
		Metadata: models.JSONMap{
			"submission_type":     "voice",
			"customer_phone":      req.CustomerPhone,
			"preferred_call_time": req.PreferredCallTime,
			"timezone":            req.Timezone,
			"additional_notes":    req.AdditionalNotes,
			"call_scheduled_at":   time.Now().Unix(),
		},
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	// Save the testimonial to database
	if err := tcs.repo.Create(ctx, testimonial, tcs.db); err != nil {
		tcs.logger.Error("Failed to create voice testimonial record", zap.Error(err))
		return nil, fmt.Errorf("failed to create testimonial record: %w", err)
	}

	// ENHANCED: Use the call scheduler service for proper scheduling
	vapiService := NewVapiService(tcs.logger, tcs.repo, tcs.jobRepo, tcs.queueService, tcs.db)
	twilioService := NewTwilioVoiceService(tcs.logger, tcs.repo, tcs.jobRepo, tcs.queueService, tcs.db)

	// Initialize scheduled call repository (this would typically be injected)
	scheduledCallRepo := repositories.NewScheduledCallRepository(tcs.logger)

	callScheduler := NewCallSchedulerService(
		scheduledCallRepo, tcs.repo, tcs.jobRepo, tcs.queueService,
		vapiService, twilioService, tcs.db, tcs.logger,
	)

	// Schedule the call properly for later execution
	scheduledCall, err := callScheduler.ScheduleCall(ctx, req, workspaceID, testimonial.ID)
	if err != nil {
		tcs.logger.Error("Failed to schedule voice call",
			zap.Error(err),
			zap.String("testimonial_id", testimonial.ID.String()),
		)
		// Update testimonial processing status to indicate scheduling failed
		testimonial.ProcessingStatus = "scheduling_failed"
		testimonial.Metadata["scheduling_error"] = err.Error()
		tcs.repo.Update(ctx, testimonial, testimonial.ID, tcs.db)

		return testimonial, fmt.Errorf("failed to schedule call: %w", err)
	}

	// Update testimonial metadata with scheduled call ID
	if testimonial.Metadata == nil {
		testimonial.Metadata = make(models.JSONMap)
	}
	testimonial.Metadata["scheduled_call_id"] = scheduledCall.ID.String()
	testimonial.Metadata["call_provider"] = scheduledCall.Provider

	tcs.logger.Info("Voice testimonial scheduled successfully",
		zap.String("testimonial_id", testimonial.ID.String()),
		zap.String("scheduled_call_id", scheduledCall.ID.String()),
		zap.String("provider", scheduledCall.Provider),
		zap.Time("scheduled_at", scheduledCall.ScheduledAt),
		zap.String("customer_phone", req.CustomerPhone),
	)

	return testimonial, nil
}

// InstantVoiceTestimonial creates a testimonial record and immediately initiates a voice call
func (tcs TestimonialCollectionService) InstantVoiceTestimonial(ctx context.Context, workspaceID uuid.UUID, req VoiceTestimonialRequest) (*models.Testimonial, error) {
	tcs.logger.Info("Creating instant voice testimonial",
		zap.String("workspace_id", workspaceID.String()),
		zap.String("customer_name", req.CustomerName),
		zap.String("customer_phone", req.CustomerPhone),
	)

	// Note: Workspace validation handled by parent controller

	// Create the testimonial record
	testimonial := &models.Testimonial{
		ID:               uuid.New(),
		WorkspaceID:      workspaceID,
		AuthorName:       &req.CustomerName,
		AuthorEmail:      &req.CustomerEmail,
		AuthorCompany:    &req.Company,
		Type:             "voice",
		Status:           "draft",
		CollectionMethod: "voice",
		Rating:           &req.Rating,
		Content:          &req.InitialText,
		ProcessingStatus: "pending",
		CreatedAt:        time.Now(),
		UpdatedAt:        time.Now(),
		Metadata: models.JSONMap{
			"customer_phone":   req.CustomerPhone,
			"submission_type":  "voice",
			"additional_notes": req.AdditionalNotes,
			"call_type":        "instant",
			"timezone":         req.Timezone,
		},
	}

	// Save testimonial to database
	if err := tcs.repo.Create(ctx, testimonial, tcs.db); err != nil {
		return nil, fmt.Errorf("failed to create testimonial record: %w", err)
	}

	tcs.logger.Info("Testimonial record created successfully",
		zap.String("testimonial_id", testimonial.ID.String()),
		zap.String("workspace_id", workspaceID.String()),
	)

	// ENHANCED: Support both Vapi and Twilio for instant calls
	vapiService := NewVapiService(tcs.logger, tcs.repo, tcs.jobRepo, tcs.queueService, tcs.db)
	twilioService := NewTwilioVoiceService(tcs.logger, tcs.repo, tcs.jobRepo, tcs.queueService, tcs.db)

	// Prepare call request
	callRequest := VoiceCallRequest{
		TestimonialID:     testimonial.ID,
		CustomerName:      req.CustomerName,
		CustomerEmail:     req.CustomerEmail,
		CustomerPhone:     req.CustomerPhone,
		Company:           req.Company,
		PreferredCallTime: "now", // Immediate call
		Timezone:          req.Timezone,
		AdditionalNotes:   req.AdditionalNotes,
	}

	var callID *string
	var err error
	var provider string

	// Determine which service to use based on phone number
	if twilioService.ShouldUseTwilio(req.CustomerPhone) {
		provider = "twilio"
		callID, err = twilioService.InitiateInternationalCall(ctx, callRequest)
	} else {
		provider = "vapi"
		callID, err = vapiService.ScheduleVoiceCall(ctx, callRequest)
	}

	if err != nil {
		tcs.logger.Error("Failed to initiate instant call",
			zap.String("provider", provider),
			zap.Error(err))
		// Don't return error - testimonial is saved, just log the call failure
		tcs.logger.Warn("Instant call failed, testimonial saved but call not initiated",
			zap.Error(err),
			zap.String("testimonial_id", testimonial.ID.String()),
			zap.String("provider", provider),
		)
	} else {
		tcs.logger.Info("Instant voice testimonial call initiated successfully",
			zap.String("testimonial_id", testimonial.ID.String()),
			zap.String("call_id", *callID),
			zap.String("provider", provider),
			zap.String("customer_phone", req.CustomerPhone),
		)

		// Update testimonial metadata with call ID and provider
		if testimonial.Metadata == nil {
			testimonial.Metadata = make(models.JSONMap)
		}

		if provider == "twilio" {
			testimonial.Metadata["twilio_call_sid"] = *callID
		} else {
			testimonial.Metadata["vapi_call_id"] = *callID
		}

		testimonial.Metadata["call_provider"] = provider
		testimonial.Metadata["call_initiated_at"] = time.Now().Unix()
	}

	return testimonial, nil
}

// HandleVapiWebhook processes webhook from Vapi.ai when voice calls complete
func (tcs TestimonialCollectionService) HandleVapiWebhook(ctx context.Context, webhookData map[string]interface{}) error {
	// Create VapiService with access to dependencies
	vapiService := NewVapiService(tcs.logger, tcs.repo, tcs.jobRepo, tcs.queueService, tcs.db)

	// Delegate to the VapiService to handle the webhook
	return vapiService.HandleCallWebhook(ctx, webhookData)
}
