// internal/vector_store/vector_store.go
package vector_store

import (
	"context"
	"database/sql"
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/ifeanyidike/cenphi/internal/models"
	"github.com/ifeanyidike/cenphi/internal/repositories"
	openai "github.com/sashabaranov/go-openai"
	"go.uber.org/zap"
)

// VectorStoreService manages OpenAI Vector Store operations for testimonials
type VectorStoreService struct {
	logger          *zap.Logger
	workspaceRepo   repositories.WorkspaceRepository
	testimonialRepo repositories.TestimonialRepository
	db              *sql.DB
	openAIClient    *openai.Client
	openAIAPIKey    string
}

// NewVectorStoreService creates a new vector store service
func NewVectorStoreService(
	logger *zap.Logger,
	workspaceRepo repositories.WorkspaceRepository,
	testimonialRepo repositories.TestimonialRepository,
	db *sql.DB,
) *VectorStoreService {
	apiKey := os.Getenv("OPENAI_API_KEY")
	if apiKey == "" {
		logger.Warn("OPENAI_API_KEY not set, vector store features will not work")
		return &VectorStoreService{
			logger:          logger,
			workspaceRepo:   workspaceRepo,
			testimonialRepo: testimonialRepo,
			db:              db,
			openAIClient:    nil,
			openAIAPIKey:    "",
		}
	}

	client := openai.NewClient(apiKey)

	return &VectorStoreService{
		logger:          logger,
		workspaceRepo:   workspaceRepo,
		testimonialRepo: testimonialRepo,
		db:              db,
		openAIClient:    client,
		openAIAPIKey:    apiKey,
	}
}

// Constants for vector store operations
const (
	MaxRetries      = 3
	RetryDelay      = time.Second * 2
	FileStatusPoll  = time.Second * 1
	MaxPollDuration = time.Minute * 5
)

// GetOrCreateVectorStore gets existing or creates new vector store for workspace
func (vs *VectorStoreService) GetOrCreateVectorStore(ctx context.Context, workspaceID uuid.UUID) (string, error) {
	if vs.openAIClient == nil {
		return "", fmt.Errorf("OpenAI client not configured")
	}

	// Fetch workspace to check if it already has a vector store
	workspace, err := vs.workspaceRepo.GetByID(ctx, workspaceID, vs.db)
	if err != nil {
		return "", fmt.Errorf("failed to fetch workspace: %w", err)
	}

	// If workspace already has a vector store, verify it exists and return it
	if workspace.VectorStoreID != nil && *workspace.VectorStoreID != "" {
		// Verify the vector store still exists in OpenAI
		_, err := vs.openAIClient.RetrieveVectorStore(ctx, *workspace.VectorStoreID)
		if err == nil {
			vs.logger.Info("Using existing vector store",
				zap.String("workspace_id", workspaceID.String()),
				zap.String("vector_store_id", *workspace.VectorStoreID))
			return *workspace.VectorStoreID, nil
		}
		vs.logger.Warn("Existing vector store not found, creating new one",
			zap.String("workspace_id", workspaceID.String()),
			zap.String("old_vector_store_id", *workspace.VectorStoreID),
			zap.Error(err))
	}

	// Create new vector store
	vectorStoreID, err := vs.createVectorStore(ctx, workspace.Name, workspaceID)
	if err != nil {
		return "", fmt.Errorf("failed to create vector store: %w", err)
	}

	// Update workspace with new vector store ID
	workspace.VectorStoreID = &vectorStoreID
	err = vs.workspaceRepo.Update(ctx, workspace, workspaceID, vs.db)
	if err != nil {
		vs.logger.Error("Failed to update workspace with vector store ID",
			zap.Error(err),
			zap.String("workspace_id", workspaceID.String()),
			zap.String("vector_store_id", vectorStoreID))
		// Don't return error since vector store was created successfully
	}

	vs.logger.Info("Created new vector store for workspace",
		zap.String("workspace_id", workspaceID.String()),
		zap.String("vector_store_id", vectorStoreID))

	return vectorStoreID, nil
}

// createVectorStore creates a new OpenAI vector store using the SDK
func (vs *VectorStoreService) createVectorStore(ctx context.Context, workspaceName string, workspaceID uuid.UUID) (string, error) {
	// Prepare metadata
	metadata := map[string]any{
		"workspace_id":   workspaceID.String(),
		"workspace_name": workspaceName,
		"purpose":        "testimonial_insights",
		"created_by":     "cenphi_api",
	}

	// Create vector store request
	request := openai.VectorStoreRequest{
		Name:     fmt.Sprintf("Testimonials - %s", workspaceName),
		Metadata: metadata,
	}

	// Create the vector store with retry logic
	var vectorStore openai.VectorStore
	var err error

	for attempt := 1; attempt <= MaxRetries; attempt++ {
		vectorStore, err = vs.openAIClient.CreateVectorStore(ctx, request)
		if err == nil {
			break
		}

		vs.logger.Warn("Failed to create vector store, retrying",
			zap.Int("attempt", attempt),
			zap.String("workspace_id", workspaceID.String()),
			zap.Error(err))

		if attempt < MaxRetries {
			time.Sleep(RetryDelay * time.Duration(attempt))
		}
	}

	if err != nil {
		return "", fmt.Errorf("failed to create vector store after %d attempts: %w", MaxRetries, err)
	}

	vs.logger.Info("Successfully created vector store",
		zap.String("vector_store_id", vectorStore.ID),
		zap.String("workspace_id", workspaceID.String()),
		zap.String("workspace_name", workspaceName))

	return vectorStore.ID, nil
}

// UploadTestimonialToVectorStore uploads testimonial data to the workspace's vector store
func (vs *VectorStoreService) UploadTestimonialToVectorStore(ctx context.Context, testimonial *models.Testimonial) error {
	if vs.openAIClient == nil {
		vs.logger.Debug("OpenAI client not configured, skipping vector store upload")
		return nil
	}

	// Get or create vector store for the workspace
	vectorStoreID, err := vs.GetOrCreateVectorStore(ctx, testimonial.WorkspaceID)
	if err != nil {
		return fmt.Errorf("failed to get vector store: %w", err)
	}

	// Prepare testimonial content for upload
	content := vs.prepareTestimonialContent(testimonial)
	if content == "" {
		vs.logger.Debug("No content to upload for testimonial",
			zap.String("testimonial_id", testimonial.ID.String()))
		return nil
	}

	// Upload content as a file to OpenAI
	fileID, err := vs.uploadContentAsFile(ctx, content, testimonial)
	if err != nil {
		return fmt.Errorf("failed to upload file: %w", err)
	}

	// Add file to vector store
	err = vs.addFileToVectorStore(ctx, vectorStoreID, fileID, testimonial)
	if err != nil {
		return fmt.Errorf("failed to add file to vector store: %w", err)
	}

	vs.logger.Info("Successfully uploaded testimonial to vector store",
		zap.String("testimonial_id", testimonial.ID.String()),
		zap.String("vector_store_id", vectorStoreID),
		zap.String("file_id", fileID))

	return nil
}

// prepareTestimonialContent formats testimonial data for vector store
func (vs *VectorStoreService) prepareTestimonialContent(testimonial *models.Testimonial) string {
	var content strings.Builder

	// Add structured metadata
	content.WriteString(fmt.Sprintf("TESTIMONIAL ID: %s\n", testimonial.ID.String()))
	content.WriteString(fmt.Sprintf("TYPE: %s\n", testimonial.Type))
	content.WriteString(fmt.Sprintf("STATUS: %s\n", testimonial.Status))
	content.WriteString(fmt.Sprintf("COLLECTION METHOD: %s\n", testimonial.CollectionMethod))
	content.WriteString(fmt.Sprintf("CREATED AT: %s\n", testimonial.CreatedAt.Format("2006-01-02 15:04:05")))

	if testimonial.AuthorName != nil {
		content.WriteString(fmt.Sprintf("AUTHOR NAME: %s\n", *testimonial.AuthorName))
	}

	if testimonial.AuthorEmail != nil {
		content.WriteString(fmt.Sprintf("AUTHOR EMAIL: %s\n", *testimonial.AuthorEmail))
	}

	if testimonial.AuthorCompany != nil {
		content.WriteString(fmt.Sprintf("AUTHOR COMPANY: %s\n", *testimonial.AuthorCompany))
	}

	if testimonial.AuthorTitle != nil {
		content.WriteString(fmt.Sprintf("AUTHOR TITLE: %s\n", *testimonial.AuthorTitle))
	}

	if testimonial.Rating != nil {
		content.WriteString(fmt.Sprintf("RATING: %d/5\n", *testimonial.Rating))
	}

	if testimonial.MediaURL != nil {
		content.WriteString(fmt.Sprintf("MEDIA URL: %s\n", *testimonial.MediaURL))
	}

	if testimonial.Format != "" {
		content.WriteString(fmt.Sprintf("FORMAT: %s\n", testimonial.Format))
	}

	// Add tags if present
	if len(testimonial.Tags) > 0 {
		content.WriteString(fmt.Sprintf("TAGS: %s\n", strings.Join(testimonial.Tags, ", ")))
	}

	// Add main content
	content.WriteString("\nCONTENT:\n")
	if testimonial.Content != nil && *testimonial.Content != "" {
		content.WriteString(*testimonial.Content)
	} else {
		content.WriteString("No text content available")
	}

	// Add transcript segments if available
	if testimonial.TranscriptSegments != nil && len(*testimonial.TranscriptSegments) > 0 {
		content.WriteString("\n\nTRANSCRIPT SEGMENTS:\n")
		for i, segment := range *testimonial.TranscriptSegments {
			content.WriteString(fmt.Sprintf("Segment %d: %v\n", i+1, segment))
		}
	}

	// Add metadata if present
	if testimonial.Metadata != nil {
		content.WriteString("\n\nMETADATA:\n")
		for key, value := range testimonial.Metadata {
			content.WriteString(fmt.Sprintf("%s: %v\n", strings.ToUpper(key), value))
		}
	}

	return content.String()
}

// uploadContentAsFile uploads content as a file to OpenAI
func (vs *VectorStoreService) uploadContentAsFile(ctx context.Context, content string, testimonial *models.Testimonial) (string, error) {
	// Create a temporary file with proper extension
	fileName := fmt.Sprintf("testimonial_%s.txt", testimonial.ID.String())
	tmpFile, err := os.CreateTemp("", "testimonial_*.txt")
	if err != nil {
		return "", fmt.Errorf("failed to create temporary file: %w", err)
	}
	defer os.Remove(tmpFile.Name())
	defer tmpFile.Close()

	// Write content to temporary file
	_, err = tmpFile.WriteString(content)
	if err != nil {
		return "", fmt.Errorf("failed to write to temporary file: %w", err)
	}

	// Create file request using the OpenAI SDK
	fileReq := openai.FileRequest{
		FileName: fileName,
		FilePath: tmpFile.Name(),
		Purpose:  "assistants",
	}

	var file openai.File

	// Retry logic for file upload
	for attempt := 1; attempt <= MaxRetries; attempt++ {
		// Use the SDK's CreateFile method
		file, err = vs.openAIClient.CreateFile(ctx, fileReq)
		if err == nil {
			break
		}

		vs.logger.Warn("Failed to upload file to OpenAI, retrying",
			zap.Int("attempt", attempt),
			zap.String("testimonial_id", testimonial.ID.String()),
			zap.Error(err))

		if attempt < MaxRetries {
			time.Sleep(RetryDelay * time.Duration(attempt))
		}
	}

	if err != nil {
		return "", fmt.Errorf("failed to upload file after %d attempts: %w", MaxRetries, err)
	}

	vs.logger.Info("Successfully uploaded file to OpenAI",
		zap.String("file_id", file.ID),
		zap.String("testimonial_id", testimonial.ID.String()),
		zap.String("filename", fileName))

	return file.ID, nil
}

// addFileToVectorStore adds an uploaded file to the vector store
func (vs *VectorStoreService) addFileToVectorStore(ctx context.Context, vectorStoreID, fileID string, testimonial *models.Testimonial) error {
	// Create vector store file using the OpenAI SDK
	vectorStoreFileReq := openai.VectorStoreFileRequest{
		FileID: fileID,
	}

	var vectorStoreFile openai.VectorStoreFile
	var err error

	// Retry logic for vector store file attachment
	for attempt := 1; attempt <= MaxRetries; attempt++ {
		vectorStoreFile, err = vs.openAIClient.CreateVectorStoreFile(ctx, vectorStoreID, vectorStoreFileReq)
		if err == nil {
			break
		}

		vs.logger.Warn("Failed to add file to vector store, retrying",
			zap.Int("attempt", attempt),
			zap.String("vector_store_id", vectorStoreID),
			zap.String("file_id", fileID),
			zap.String("testimonial_id", testimonial.ID.String()),
			zap.Error(err))

		if attempt < MaxRetries {
			time.Sleep(RetryDelay * time.Duration(attempt))
		}
	}

	if err != nil {
		return fmt.Errorf("failed to add file to vector store after %d attempts: %w", MaxRetries, err)
	}

	// Wait for file to be processed
	err = vs.waitForFileProcessing(ctx, vectorStoreID, fileID)
	if err != nil {
		vs.logger.Warn("File processing timeout or failed, but continuing",
			zap.String("vector_store_id", vectorStoreID),
			zap.String("file_id", fileID),
			zap.Error(err))
		// Don't return error since file was added successfully
	}

	// Log the vector store mapping for reference
	vs.logger.Info("Vector store file mapping created",
		zap.String("testimonial_id", testimonial.ID.String()),
		zap.String("vector_store_id", vectorStoreID),
		zap.String("vector_file_id", fileID),
		zap.String("vector_store_file_id", vectorStoreFile.ID))

	vs.logger.Info("Successfully added file to vector store",
		zap.String("vector_store_id", vectorStoreID),
		zap.String("file_id", fileID),
		zap.String("vector_store_file_id", vectorStoreFile.ID),
		zap.String("testimonial_id", testimonial.ID.String()))

	return nil
}

// waitForFileProcessing waits for a file to be processed in the vector store
func (vs *VectorStoreService) waitForFileProcessing(ctx context.Context, vectorStoreID, fileID string) error {
	startTime := time.Now()
	ticker := time.NewTicker(FileStatusPoll)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return ctx.Err()
		case <-ticker.C:
			// Check if we've exceeded max poll duration
			if time.Since(startTime) > MaxPollDuration {
				return fmt.Errorf("file processing timeout after %v", MaxPollDuration)
			}

			// Get vector store file status
			vectorStoreFile, err := vs.openAIClient.RetrieveVectorStoreFile(ctx, vectorStoreID, fileID)
			if err != nil {
				vs.logger.Warn("Failed to check file processing status",
					zap.String("vector_store_id", vectorStoreID),
					zap.String("file_id", fileID),
					zap.Error(err))
				continue
			}

			vs.logger.Debug("File processing status",
				zap.String("vector_store_id", vectorStoreID),
				zap.String("file_id", fileID),
				zap.String("status", vectorStoreFile.Status))

			switch vectorStoreFile.Status {
			case "completed":
				vs.logger.Info("File processing completed successfully",
					zap.String("vector_store_id", vectorStoreID),
					zap.String("file_id", fileID))
				return nil
			case "failed":
				return fmt.Errorf("file processing failed")
			case "cancelled":
				return fmt.Errorf("file processing was cancelled")
			case "in_progress":
				// Continue polling
				continue
			default:
				vs.logger.Debug("Unknown file status, continuing to poll",
					zap.String("status", vectorStoreFile.Status))
				continue
			}
		}
	}
}

// GetWorkspaceTestimonialContent retrieves all testimonial content for a workspace
// This is used for the chat-with-data feature since we're using response API
func (vs *VectorStoreService) GetWorkspaceTestimonialContent(ctx context.Context, workspaceID uuid.UUID) (string, error) {
	// Fetch all testimonials for the workspace
	testimonials, err := vs.testimonialRepo.FetchByWorkspaceID(ctx, workspaceID, models.TestimonialFilter{}, vs.db)
	if err != nil {
		return "", fmt.Errorf("failed to fetch testimonials: %w", err)
	}

	if len(testimonials) == 0 {
		return "", fmt.Errorf("no testimonials found for workspace")
	}

	var content strings.Builder
	content.WriteString("TESTIMONIAL DATABASE FOR ANALYSIS:\n")
	content.WriteString("==================================\n\n")

	for i, testimonial := range testimonials {
		content.WriteString(fmt.Sprintf("TESTIMONIAL #%d:\n", i+1))
		content.WriteString(strings.Repeat("-", 40) + "\n")
		content.WriteString(vs.prepareTestimonialContent(&testimonial))
		content.WriteString("\n" + strings.Repeat("-", 40) + "\n\n")
	}

	vs.logger.Info("Retrieved testimonial content for workspace",
		zap.String("workspace_id", workspaceID.String()),
		zap.Int("testimonial_count", len(testimonials)),
		zap.Int("content_length", content.Len()))

	return content.String(), nil
}

// GetWorkspaceTestimonialContentWithFilter retrieves testimonial content for a workspace with filtering
func (vs *VectorStoreService) GetWorkspaceTestimonialContentWithFilter(ctx context.Context, workspaceID uuid.UUID, filter models.TestimonialFilter) (string, error) {
	// Fetch testimonials for the workspace with filter
	testimonials, err := vs.testimonialRepo.FetchByWorkspaceID(ctx, workspaceID, filter, vs.db)
	if err != nil {
		return "", fmt.Errorf("failed to fetch testimonials: %w", err)
	}

	if len(testimonials) == 0 {
		return "", fmt.Errorf("no testimonials found for workspace with the specified filters")
	}

	var content strings.Builder
	content.WriteString("TESTIMONIAL DATABASE FOR ANALYSIS:\n")
	content.WriteString("==================================\n\n")

	// Add filter information for context
	if filter.CreatedAfter != nil || filter.CreatedBefore != nil {
		content.WriteString("FILTERED DATA:\n")
		if filter.CreatedAfter != nil {
			content.WriteString(fmt.Sprintf("From: %s\n", filter.CreatedAfter.Format("2006-01-02")))
		}
		if filter.CreatedBefore != nil {
			content.WriteString(fmt.Sprintf("To: %s\n", filter.CreatedBefore.Format("2006-01-02")))
		}
		content.WriteString("\n")
	}

	for i, testimonial := range testimonials {
		content.WriteString(fmt.Sprintf("TESTIMONIAL #%d:\n", i+1))
		content.WriteString(strings.Repeat("-", 40) + "\n")
		content.WriteString(vs.prepareTestimonialContent(&testimonial))
		content.WriteString("\n" + strings.Repeat("-", 40) + "\n\n")
	}

	vs.logger.Info("Retrieved filtered testimonial content for workspace",
		zap.String("workspace_id", workspaceID.String()),
		zap.Int("testimonial_count", len(testimonials)),
		zap.Int("content_length", content.Len()),
		zap.Any("filter", filter))

	return content.String(), nil
}

// ListVectorStoreFiles lists all files in a workspace's vector store
func (vs *VectorStoreService) ListVectorStoreFiles(ctx context.Context, workspaceID uuid.UUID) ([]openai.VectorStoreFile, error) {
	if vs.openAIClient == nil {
		vs.logger.Warn("OpenAI client not configured, returning empty file list")
		return []openai.VectorStoreFile{}, nil
	}

	vs.logger.Info("Starting to list vector store files", zap.String("workspace_id", workspaceID.String()))

	// Get vector store for workspace
	vectorStoreID, err := vs.GetOrCreateVectorStore(ctx, workspaceID)
	if err != nil {
		vs.logger.Error("Failed to get/create vector store",
			zap.String("workspace_id", workspaceID.String()),
			zap.Error(err))
		return nil, fmt.Errorf("failed to get vector store: %w", err)
	}

	vs.logger.Info("Got vector store ID, listing files",
		zap.String("workspace_id", workspaceID.String()),
		zap.String("vector_store_id", vectorStoreID))

	// List files in vector store with pagination
	limit := 100
	pagination := openai.Pagination{
		Limit: &limit, // Explicitly set limit
	}

	files, err := vs.openAIClient.ListVectorStoreFiles(ctx, vectorStoreID, pagination)
	if err != nil {
		vs.logger.Error("OpenAI API error when listing files",
			zap.String("workspace_id", workspaceID.String()),
			zap.String("vector_store_id", vectorStoreID),
			zap.Error(err))
		return nil, fmt.Errorf("failed to list vector store files: %w", err)
	}

	vs.logger.Info("Successfully listed vector store files",
		zap.String("workspace_id", workspaceID.String()),
		zap.String("vector_store_id", vectorStoreID),
		zap.Int("file_count", len(files.VectorStoreFiles)))

	// Log each file for debugging
	for i, file := range files.VectorStoreFiles {
		vs.logger.Debug("Vector store file",
			zap.Int("index", i),
			zap.String("file_id", file.ID),
			zap.String("status", file.Status),
			zap.Int64("created_at", file.CreatedAt))
	}

	return files.VectorStoreFiles, nil
}

// DeleteVectorStoreFile removes a file from the vector store
func (vs *VectorStoreService) DeleteVectorStoreFile(ctx context.Context, workspaceID uuid.UUID, fileID string) error {
	if vs.openAIClient == nil {
		return fmt.Errorf("OpenAI client not configured")
	}

	// Get vector store for workspace
	vectorStoreID, err := vs.GetOrCreateVectorStore(ctx, workspaceID)
	if err != nil {
		return fmt.Errorf("failed to get vector store: %w", err)
	}

	// Delete file from vector store
	err = vs.openAIClient.DeleteVectorStoreFile(ctx, vectorStoreID, fileID)
	if err != nil {
		return fmt.Errorf("failed to delete vector store file: %w", err)
	}

	// Also delete the actual file from OpenAI
	err = vs.openAIClient.DeleteFile(ctx, fileID)
	if err != nil {
		vs.logger.Warn("Failed to delete OpenAI file, but vector store file was removed",
			zap.String("file_id", fileID),
			zap.Error(err))
		// Don't return error since vector store file was removed
	}

	vs.logger.Info("Deleted vector store file",
		zap.String("workspace_id", workspaceID.String()),
		zap.String("vector_store_id", vectorStoreID),
		zap.String("file_id", fileID))

	return nil
}

// DeleteTestimonialFromVectorStore removes a testimonial's file from the vector store
func (vs *VectorStoreService) DeleteTestimonialFromVectorStore(ctx context.Context, testimonial *models.Testimonial) error {
	if vs.openAIClient == nil {
		vs.logger.Debug("OpenAI client not configured, skipping vector store deletion")
		return nil
	}

	vs.logger.Info("Deleting testimonial from vector store",
		zap.String("testimonial_id", testimonial.ID.String()),
		zap.String("workspace_id", testimonial.WorkspaceID.String()))

	// Get workspace to check if it has a vector store
	workspace, err := vs.workspaceRepo.GetByID(ctx, testimonial.WorkspaceID, vs.db)
	if err != nil {
		vs.logger.Warn("Failed to fetch workspace, skipping vector store deletion",
			zap.String("workspace_id", testimonial.WorkspaceID.String()),
			zap.Error(err))
		return nil
	}

	// If workspace doesn't have a vector store, nothing to delete
	if workspace.VectorStoreID == nil || *workspace.VectorStoreID == "" {
		vs.logger.Debug("Workspace has no vector store, nothing to delete",
			zap.String("workspace_id", testimonial.WorkspaceID.String()))
		return nil
	}

	vectorStoreID := *workspace.VectorStoreID

	// List all files in the vector store
	limit := 100
	pagination := openai.Pagination{
		Limit: &limit,
	}

	files, err := vs.openAIClient.ListVectorStoreFiles(ctx, vectorStoreID, pagination)
	if err != nil {
		vs.logger.Warn("Failed to list vector store files, skipping deletion",
			zap.String("vector_store_id", vectorStoreID),
			zap.Error(err))
		return nil
	}

	// Find the file that matches this testimonial
	// The filename pattern is: testimonial_{id}.txt
	targetFileName := fmt.Sprintf("testimonial_%s.txt", testimonial.ID.String())

	var fileIDToDelete string
	for _, file := range files.VectorStoreFiles {
		// Retrieve the actual file details to get the filename
		fileDetails, err := vs.openAIClient.GetFile(ctx, file.ID)
		if err != nil {
			vs.logger.Debug("Failed to get file details",
				zap.String("file_id", file.ID),
				zap.Error(err))
			continue
		}

		if fileDetails.FileName == targetFileName {
			fileIDToDelete = file.ID
			vs.logger.Info("Found testimonial file in vector store",
				zap.String("file_id", file.ID),
				zap.String("filename", fileDetails.FileName))
			break
		}
	}

	// If file not found, nothing to delete
	if fileIDToDelete == "" {
		vs.logger.Info("Testimonial file not found in vector store, nothing to delete",
			zap.String("testimonial_id", testimonial.ID.String()),
			zap.String("expected_filename", targetFileName))
		return nil
	}

	// Delete file from vector store
	err = vs.openAIClient.DeleteVectorStoreFile(ctx, vectorStoreID, fileIDToDelete)
	if err != nil {
		vs.logger.Warn("Failed to delete file from vector store",
			zap.String("vector_store_id", vectorStoreID),
			zap.String("file_id", fileIDToDelete),
			zap.Error(err))
		// Continue to try deleting the actual file
	} else {
		vs.logger.Info("Successfully removed file from vector store",
			zap.String("vector_store_id", vectorStoreID),
			zap.String("file_id", fileIDToDelete))
	}

	// Also delete the actual file from OpenAI
	err = vs.openAIClient.DeleteFile(ctx, fileIDToDelete)
	if err != nil {
		vs.logger.Warn("Failed to delete OpenAI file",
			zap.String("file_id", fileIDToDelete),
			zap.Error(err))
		// Don't return error since we tried our best
	} else {
		vs.logger.Info("Successfully deleted OpenAI file",
			zap.String("file_id", fileIDToDelete))
	}

	vs.logger.Info("Completed testimonial deletion from vector store",
		zap.String("testimonial_id", testimonial.ID.String()),
		zap.String("file_id", fileIDToDelete))

	return nil
}

// UploadFileToVectorStore uploads a custom file to the workspace's vector store
func (vs *VectorStoreService) UploadFileToVectorStore(ctx context.Context, workspaceID uuid.UUID, fileName string, content string) (string, error) {
	if vs.openAIClient == nil {
		return "", fmt.Errorf("OpenAI client not configured")
	}

	// Get or create vector store for the workspace
	vectorStoreID, err := vs.GetOrCreateVectorStore(ctx, workspaceID)
	if err != nil {
		return "", fmt.Errorf("failed to get vector store: %w", err)
	}

	// Create a temporary file with proper extension
	// Extract extension from fileName to preserve it
	ext := ".txt" // default extension
	if idx := strings.LastIndex(fileName, "."); idx != -1 {
		ext = fileName[idx:]
	}
	tmpFile, err := os.CreateTemp("", "upload_*"+ext)
	if err != nil {
		return "", fmt.Errorf("failed to create temporary file: %w", err)
	}
	defer os.Remove(tmpFile.Name())
	defer tmpFile.Close()

	// Write content to temporary file
	_, err = tmpFile.WriteString(content)
	if err != nil {
		return "", fmt.Errorf("failed to write to temporary file: %w", err)
	}

	// Create file request using the OpenAI SDK
	fileReq := openai.FileRequest{
		FileName: fileName,
		FilePath: tmpFile.Name(),
		Purpose:  "assistants",
	}

	var file openai.File

	// Retry logic for file upload
	for attempt := 1; attempt <= MaxRetries; attempt++ {
		file, err = vs.openAIClient.CreateFile(ctx, fileReq)
		if err == nil {
			break
		}

		vs.logger.Warn("Failed to upload file to OpenAI, retrying",
			zap.Int("attempt", attempt),
			zap.String("workspace_id", workspaceID.String()),
			zap.String("filename", fileName),
			zap.Error(err))

		if attempt < MaxRetries {
			time.Sleep(RetryDelay * time.Duration(attempt))
		}
	}

	if err != nil {
		return "", fmt.Errorf("failed to upload file after %d attempts: %w", MaxRetries, err)
	}

	// Add file to vector store
	vectorStoreFileReq := openai.VectorStoreFileRequest{
		FileID: file.ID,
	}

	var vectorStoreFile openai.VectorStoreFile

	// Retry logic for vector store file attachment
	for attempt := 1; attempt <= MaxRetries; attempt++ {
		vectorStoreFile, err = vs.openAIClient.CreateVectorStoreFile(ctx, vectorStoreID, vectorStoreFileReq)
		if err == nil {
			break
		}

		vs.logger.Warn("Failed to add file to vector store, retrying",
			zap.Int("attempt", attempt),
			zap.String("vector_store_id", vectorStoreID),
			zap.String("file_id", file.ID),
			zap.Error(err))

		if attempt < MaxRetries {
			time.Sleep(RetryDelay * time.Duration(attempt))
		}
	}

	if err != nil {
		// Clean up the uploaded file if vector store attachment fails
		vs.openAIClient.DeleteFile(ctx, file.ID)
		return "", fmt.Errorf("failed to add file to vector store after %d attempts: %w", MaxRetries, err)
	}

	vs.logger.Info("Successfully uploaded custom file to vector store",
		zap.String("workspace_id", workspaceID.String()),
		zap.String("vector_store_id", vectorStoreID),
		zap.String("file_id", file.ID),
		zap.String("vector_store_file_id", vectorStoreFile.ID),
		zap.String("filename", fileName))

	return file.ID, nil
}
