package ai

import (
	"context"
	"fmt"
	"maps"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/ifeanyidike/cenphi/internal/models"
	"github.com/ifeanyidike/cenphi/internal/queue"
	"github.com/ifeanyidike/cenphi/internal/repositories"
	"github.com/ifeanyidike/cenphi/internal/storage"
	"github.com/ifeanyidike/cenphi/internal/utils"
	"go.uber.org/zap"
)

type UploadWorker struct {
	logger         *zap.Logger
	queueService   queue.Service
	storageService *storage.StorageFactory
	repo           repositories.TestimonialRepository
	workspaceRepo  repositories.WorkspaceRepository
	db             repositories.DB
}

func NewUploadWorker(
	logger *zap.Logger,
	queueService queue.Service,
	storageService *storage.StorageFactory,
	repo repositories.TestimonialRepository,
	workspaceRepo repositories.WorkspaceRepository,
	db repositories.DB,
) *UploadWorker {
	return &UploadWorker{
		logger:         logger,
		queueService:   queueService,
		storageService: storageService,
		repo:           repo,
		workspaceRepo:  workspaceRepo,
		db:             db,
	}
}

func (uw *UploadWorker) Start() error {
	uw.logger.Info("🚀 Starting Upload Worker")

	ctx := context.Background()
	return uw.queueService.Consume(ctx, "video_uploads", uw.handleUploadJob)
}

func (uw *UploadWorker) Stop() {
	uw.logger.Info("🛑 Stopping Upload Worker")
}

func (uw *UploadWorker) Name() string {
	return "Upload Worker"
}

func (uw *UploadWorker) handleUploadJob(ctx context.Context, msg queue.Message) error {
	jobID := msg.ID

	uw.logger.Info("📤 Processing video upload job",
		zap.String("job_id", jobID))

	// Update status to processing
	uw.queueService.SetJobStatus(ctx, jobID, "processing", 10, map[string]interface{}{
		"message": "Starting video upload processing",
		"stage":   "initializing",
	})

	// Extract payload
	payload, ok := msg.Payload.(map[string]interface{})
	if !ok {
		return fmt.Errorf("invalid payload format")
	}

	tempPath, ok := payload["temp_path"].(string)
	if !ok {
		return fmt.Errorf("missing temp_path in payload")
	}

	workspaceIDStr, ok := payload["workspace_id"].(string)
	if !ok {
		return fmt.Errorf("missing workspace_id in payload")
	}

	workspaceID, err := uuid.Parse(workspaceIDStr)
	if err != nil {
		return fmt.Errorf("invalid workspace_id: %w", err)
	}

	// Extract author data
	authorName := utils.GetString(payload, "author_name")
	authorEmail := utils.GetString(payload, "author_email")
	authorCompany := utils.GetString(payload, "author_company")
	authorTitle := utils.GetString(payload, "author_title")

	// Extract testimonial data
	rating, ok := utils.GetInt(payload, "rating")
	if !ok {
		rating = 5
	}

	tags := utils.GetStringArray(payload, "tags")
	content := utils.GetString(payload, "content")
	collectionMethod := utils.GetString(payload, "collection_method")

	// Update progress
	uw.queueService.SetJobStatus(ctx, jobID, "processing", 20, map[string]any{
		"message": "Uploading file to cloud storage",
		"stage":   "uploading",
	})

	// Upload file to permanent storage
	fileURL, err := uw.uploadToStorage(ctx, tempPath, jobID)
	if err != nil {
		uw.cleanupTempFile(tempPath)
		return fmt.Errorf("failed to upload file: %w", err)
	}

	// Update progress
	uw.queueService.SetJobStatus(ctx, jobID, "processing", 60, map[string]any{
		"message":  "Creating testimonial record",
		"stage":    "saving",
		"file_url": fileURL,
	})

	// Create testimonial record
	testimonial, err := uw.createTestimonialRecord(ctx, workspaceID, fileURL, authorName, authorEmail, authorCompany, authorTitle, rating, tags, content, collectionMethod, tempPath)
	if err != nil {
		// Cleanup uploaded file on database error
		uw.storageService.Delete(ctx, fileURL)
		uw.cleanupTempFile(tempPath)
		return fmt.Errorf("failed to create testimonial: %w", err)
	}

	// Update progress
	uw.queueService.SetJobStatus(ctx, jobID, "processing", 80, map[string]interface{}{
		"message":        "Queuing AI processing jobs",
		"stage":          "queuing_ai",
		"testimonial_id": testimonial.ID.String(),
	})

	// Queue AI processing jobs (transcription, sentiment analysis, highlights)
	if err := uw.queueAIProcessingJobs(ctx, testimonial); err != nil {
		uw.logger.Error("Failed to queue AI processing jobs",
			zap.String("testimonial_id", testimonial.ID.String()),
			zap.Error(err))
		// Don't fail the upload job for AI queue failures
	}

	// Cleanup temp file
	uw.cleanupTempFile(tempPath)

	// Complete the upload job
	uw.queueService.SetJobStatus(ctx, jobID, "completed", 100, map[string]interface{}{
		"message":        "Video upload completed successfully",
		"testimonial_id": testimonial.ID.String(),
		"file_url":       fileURL,
		"ai_processing":  "queued",
	})

	uw.logger.Info("✅ Video upload job completed",
		zap.String("job_id", jobID),
		zap.String("testimonial_id", testimonial.ID.String()))

	return nil
}

func (uw *UploadWorker) uploadToStorage(ctx context.Context, tempPath, jobID string) (string, error) {
	// Validate temp file exists
	if _, err := os.Stat(tempPath); os.IsNotExist(err) {
		return "", fmt.Errorf("temp file not found: %s", tempPath)
	}

	// Generate object name for permanent storage
	filename := filepath.Base(tempPath)
	ext := filepath.Ext(filename)
	objectName := fmt.Sprintf("video/%s/%s%s",
		time.Now().Format("2006/01"),
		jobID,
		ext,
	)

	uw.logger.Info("📤 Uploading to permanent storage",
		zap.String("temp_path", tempPath),
		zap.String("object_name", objectName))

	// Upload file to storage using the standard Upload method
	fileURL, err := uw.storageService.Upload(ctx, tempPath, objectName, uw.getContentType(ext))
	if err != nil {
		return "", fmt.Errorf("storage upload failed: %w", err)
	}

	return fileURL, nil
}

func (uw *UploadWorker) createTestimonialRecord(ctx context.Context, workspaceID uuid.UUID, fileURL, authorName, authorEmail, authorCompany, authorTitle string, rating int, tags []string, content, collectionMethod, tempPath string) (*models.Testimonial, error) {
	// Get file info
	fileInfo, err := os.Stat(tempPath)
	if err != nil {
		return nil, fmt.Errorf("failed to get file info: %w", err)
	}

	// Determine file format
	ext := strings.ToLower(filepath.Ext(tempPath))
	format := strings.TrimPrefix(ext, ".")
	fmt.Println("rating is ", rating)

	// Extract video metadata (duration + thumbnail uploaded to OCI)
	var duration *float64
	var thumbnailURL *string

	// Use background context with custom timeout for thumbnail extraction
	thumbnailCtx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)
	defer cancel()

	metadata, err := utils.ExtractVideoMetadataWithOCI(thumbnailCtx, fileURL, workspaceID.String(), uw.storageService)
	if err != nil {
		uw.logger.Warn("Failed to extract video metadata, continuing without it",
			zap.Error(err),
			zap.String("file_url", fileURL))
	} else {
		duration = &metadata.Duration
		thumbnailURL = &metadata.ThumbnailURL
		uw.logger.Info("Extracted video metadata",
			zap.Float64("duration", metadata.Duration),
			zap.String("thumbnail_url", metadata.ThumbnailURL))
	}

	// Create testimonial
	testimonial := &models.Testimonial{
		ID:               uuid.New(),
		WorkspaceID:      workspaceID,
		AuthorName:       &authorName,
		AuthorEmail:      &authorEmail,
		AuthorCompany:    &authorCompany,
		AuthorTitle:      &authorTitle,
		Type:             "video",
		Format:           format,
		Status:           "draft",
		MediaURL:         &fileURL,
		Duration:         duration,
		ThumbnailURL:     thumbnailURL,
		Content:          &content,
		CollectionMethod: collectionMethod,
		ProcessingStatus: "pending",
		Rating:           &rating,
		Tags:             tags,
		Metadata: models.JSONMap{
			"file_size":         fileInfo.Size(),
			"original_filename": filepath.Base(tempPath),
			"content_type":      uw.getContentType(ext),
			"uploaded_via":      "queued_upload",
			"submitted_at":      time.Now().Unix(),
		},
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	// Save to database
	if err := uw.repo.Create(ctx, testimonial, uw.db); err != nil {
		return nil, fmt.Errorf("failed to save testimonial: %w", err)
	}

	return testimonial, nil
}

func (uw *UploadWorker) queueAIProcessingJobs(ctx context.Context, testimonial *models.Testimonial) error {
	if testimonial.MediaURL == nil || *testimonial.MediaURL == "" {
		uw.logger.Warn("Skipping video processing - no media URL available",
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

	// Create dependent AI jobs
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

	// Queue each job
	for _, job := range allJobs {
		if err := uw.createAndPublishJob(ctx, job); err != nil {
			uw.logger.Error("Failed to queue AI processing job",
				zap.String("job_type", job.JobType),
				zap.String("testimonial_id", testimonial.ID.String()),
				zap.Error(err))
			continue
		}
	}

	uw.logger.Info("AI processing jobs queued successfully",
		zap.String("testimonial_id", testimonial.ID.String()),
		zap.Int("jobs_count", len(allJobs)))

	return nil
}

func (uw *UploadWorker) createAndPublishJob(ctx context.Context, job *models.Job) error {
	// Set job status in Redis
	jobPayload := map[string]interface{}{
		"job_type": job.JobType,
	}

	if job.TestimonialID != nil {
		jobPayload["testimonial_id"] = job.TestimonialID.String()
	}
	if job.WorkspaceID != nil {
		jobPayload["workspace_id"] = job.WorkspaceID.String()
	}

	uw.queueService.SetJobStatus(ctx, job.ID.String(), "pending", 0, jobPayload)

	queuePayload := make(map[string]any)
	maps.Copy(queuePayload, job.Payload)
	if _, exists := queuePayload["workspace_id"]; !exists && job.WorkspaceID != nil {
		queuePayload["workspace_id"] = job.WorkspaceID.String()
	}

	// Create queue message
	queueMessage := queue.Message{
		ID:      job.ID.String(),
		Type:    job.JobType,
		Payload: queuePayload,
	}

	// Determine queue name
	queueName := uw.getQueueNameForJobType(job.JobType)

	// Publish to queue
	if _, err := uw.queueService.Publish(ctx, queueName, queueMessage); err != nil {
		return fmt.Errorf("failed to publish AI job: %w", err)
	}

	return nil
}

func (uw *UploadWorker) getQueueNameForJobType(jobType string) string {
	switch jobType {
	case "transcription":
		return "transcription"
	case "sentiment_analysis":
		return "sentiment_analysis"
	case "highlight_extraction":
		return "highlight_extraction"
	default:
		return "ai-processing"
	}
}

func (uw *UploadWorker) getContentType(ext string) string {
	switch ext {
	case ".mp4":
		return "video/mp4"
	case ".mov":
		return "video/quicktime"
	case ".avi":
		return "video/x-msvideo"
	case ".webm":
		return "video/webm"
	default:
		return "video/mp4"
	}
}

func (uw *UploadWorker) cleanupTempFile(tempPath string) {
	if err := os.Remove(tempPath); err != nil {
		uw.logger.Warn("Failed to cleanup temp file",
			zap.String("path", tempPath),
			zap.Error(err))
	} else {
		uw.logger.Debug("Cleaned up temp file", zap.String("path", tempPath))
	}
}
