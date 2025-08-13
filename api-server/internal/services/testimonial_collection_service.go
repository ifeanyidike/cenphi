// internal/services/testimonial_collection_service.go
package services

import (
	"context"
	"database/sql"
	"fmt"
	"maps"
	"mime/multipart"
	"path/filepath"
	"slices"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/ifeanyidike/cenphi/internal/mailing"
	"github.com/ifeanyidike/cenphi/internal/models"
	"github.com/ifeanyidike/cenphi/internal/queue"
	"github.com/ifeanyidike/cenphi/internal/repositories"
	"github.com/ifeanyidike/cenphi/internal/storage"
	"github.com/redis/go-redis/v9"
	"go.uber.org/zap"
	"golang.org/x/oauth2"
)

// TestimonialCollectionService handles testimonial collection and initial AI processing
type TestimonialCollectionService struct {
	repo              repositories.TestimonialRepository
	jobRepo           repositories.JobRepository
	storageService    *storage.StorageFactory
	documentProcessor *DocumentProcessor
	driveService      *DriveService
	fileProcessor     *FileProcessor
	mailingService    *mailing.Service
	queueService      queue.Service
	db                *sql.DB
	redis             *redis.Client
	logger            *zap.Logger
}

func NewTestimonialCollectionService(
	repo repositories.TestimonialRepository,
	jobRepo repositories.JobRepository,
	storageService *storage.StorageFactory,
	driveService *DriveService,
	mailingService *mailing.Service,
	queueService queue.Service,
	db *sql.DB,
	redis *redis.Client,
	logger *zap.Logger,
) TestimonialCollectionService {
	fileProcessor := NewFileProcessor(logger)
	documentProcessor := NewDocumentProcessor(logger)
	return TestimonialCollectionService{
		repo:              repo,
		jobRepo:           jobRepo,
		storageService:    storageService,
		fileProcessor:     fileProcessor,
		driveService:      driveService,
		mailingService:    mailingService,
		documentProcessor: documentProcessor,
		queueService:      queueService,
		db:                db,
		redis:             redis,
		logger:            logger,
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

	return testimonial, nil
}

// ProcessRecordedVideo handles recorded video submissions
func (tcs TestimonialCollectionService) ProcessRecordedVideo(
	ctx context.Context,
	data models.TestimonialUpload,
	file multipart.File,
	header *multipart.FileHeader,
) (*models.Testimonial, error) {
	return tcs.processVideo(ctx, data, file, header, "recorded", tcs.isValidRecordedVideoType, "Recorded video testimonial processed")
}

// ProcessUploadedVideo handles uploaded video submissions
func (tcs TestimonialCollectionService) ProcessUploadedVideo(
	ctx context.Context,
	data models.TestimonialUpload,
	file multipart.File,
	header *multipart.FileHeader,
) (*models.Testimonial, error) {
	return tcs.processVideo(ctx, data, file, header, "uploaded", tcs.isValidUploadedVideoType, "Uploaded video testimonial processed")
}

// FIXED: Unified video processing method
func (tcs TestimonialCollectionService) processVideo(
	ctx context.Context,
	data models.TestimonialUpload,
	file multipart.File,
	header *multipart.FileHeader,
	videoSource string,
	validateFn func(string) bool,
	logMessage string,
) (*models.Testimonial, error) {
	contentType := header.Header.Get("Content-Type")
	if !validateFn(contentType) {
		return nil, fmt.Errorf("invalid video format: %s", contentType)
	}

	// Upload file to storage
	fileURL, err := tcs.storageService.UploadFile(ctx, file, header, contentType)
	if err != nil {
		return nil, fmt.Errorf("failed to upload video: %w", err)
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
		MediaURL:         &fileURL,
		CollectionMethod: data.CollectionMethod,
		ProcessingStatus: "pending",
		Rating:           data.Rating,
		Tags:             data.Tags,
		Metadata: models.JSONMap{
			"original_filename": header.Filename,
			"file_size":         header.Size,
			"content_type":      contentType,
			"video_source":      videoSource,
			"submitted_at":      time.Now().Unix(),
		},
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	// Save testimonial to database
	if err := tcs.repo.Create(ctx, testimonial, tcs.db); err != nil {
		tcs.storageService.Delete(ctx, fileURL)
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

	return testimonial, nil
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

// FIXED: Proper video processing job queueing using RabbitMQ
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

// FIXED: Create job in database and publish to RabbitMQ queue
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

// FIXED: Map job types to appropriate queue names
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
			"source":          "webform",
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

	return testimonial, nil
}

// ProcessVideoUpload handles video file uploads
func (tcs TestimonialCollectionService) ProcessVideoUpload(ctx context.Context, workspaceID uuid.UUID, file multipart.File, header *multipart.FileHeader, authorData models.TestimonialUpload) (*models.Testimonial, error) {
	// Validate file type
	if !tcs.isValidVideoType(header.Header.Get("Content-Type")) {
		return nil, fmt.Errorf("invalid video file type: %s", header.Header.Get("Content-Type"))
	}

	// Upload file to storage
	fileURL, err := tcs.storageService.UploadFile(ctx, file, header, header.Header.Get("Content-Type"))
	if err != nil {
		return nil, fmt.Errorf("failed to upload video: %w", err)
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
		MediaURL:         &fileURL,
		CollectionMethod: authorData.CollectionMethod,
		Rating:           authorData.Rating,
		ProcessingStatus: "pending",
		Tags:             authorData.Tags,
		Metadata: models.JSONMap{
			"original_filename": header.Filename,
			"file_size":         header.Size,
			"content_type":      header.Header.Get("Content-Type"),
			"upload_method":     "video_upload",
		},
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	err = tcs.repo.Create(ctx, testimonial, tcs.db)
	if err != nil {
		// Clean up uploaded file if testimonial creation fails
		tcs.storageService.Delete(ctx, fileURL)
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
		zap.String("file_url", fileURL))

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

		// ENHANCED: Handle different file types appropriately
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

	// Upload to our storage
	fileURL, err := tcs.storageService.UploadFromReader(ctx, reader, fmt.Sprintf("drive-imports/%s", metadata.Name), metadata.MimeType)
	if err != nil {
		return nil, fmt.Errorf("failed to upload to storage: %w", err)
	}

	// Create testimonial record
	format := strings.TrimPrefix(filepath.Ext(metadata.Name), ".")
	testimonial := &models.Testimonial{
		ID:               uuid.New(),
		WorkspaceID:      workspaceID,
		Type:             "video",
		Status:           "processing",
		Format:           format,
		MediaURL:         &fileURL,
		CollectionMethod: "drive_import",
		ProcessingStatus: "pending",
		Metadata: models.JSONMap{
			"original_filename": metadata.Name,
			"file_size":         metadata.Size,
			"content_type":      metadata.MimeType,
			"upload_method":     "google_drive",
			"drive_file_id":     fileID,
			"drive_web_link":    metadata.WebViewLink,
		},
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	err = tcs.repo.Create(ctx, testimonial, tcs.db)
	if err != nil {
		// Clean up uploaded file if testimonial creation fails
		tcs.storageService.Delete(ctx, fileURL)
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

	// Upload to our storage
	fileURL, err := tcs.storageService.UploadFromReader(
		ctx,
		reader,
		fmt.Sprintf("drive-imports/%s", metadata.Name),
		metadata.MimeType,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to upload to storage: %w", err)
	}

	// Create testimonial record
	format := strings.TrimPrefix(filepath.Ext(metadata.Name), ".")
	testimonial := &models.Testimonial{
		ID:               uuid.New(),
		WorkspaceID:      workspaceID,
		Type:             "video",
		Status:           "processing",
		Format:           format,
		MediaURL:         &fileURL,
		CollectionMethod: "drive_import",
		ProcessingStatus: "pending",
		Metadata: models.JSONMap{
			"original_filename": metadata.Name,
			"file_size":         metadata.Size,
			"content_type":      metadata.MimeType,
			"upload_method":     "google_drive",
			"drive_file_id":     fileID,
			"drive_web_link":    metadata.WebViewLink,
			"created_time":      metadata.CreatedTime,
			"modified_time":     metadata.ModifiedTime,
		},
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	err = tcs.repo.Create(ctx, testimonial, tcs.db)
	if err != nil {
		// Clean up uploaded file if testimonial creation fails
		tcs.storageService.Delete(ctx, fileURL)
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
