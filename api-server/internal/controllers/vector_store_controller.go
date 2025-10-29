// internal/controllers/vector_store_controller.go
package controllers

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/ifeanyidike/cenphi/internal/vector_store"
	"go.uber.org/zap"
)

type VectorStoreController struct {
	vectorStoreService *vector_store.VectorStoreService
	logger             *zap.Logger
}

func NewVectorStoreController(vectorStoreService *vector_store.VectorStoreService, logger *zap.Logger) *VectorStoreController {
	return &VectorStoreController{
		vectorStoreService: vectorStoreService,
		logger:             logger,
	}
}

// ListFiles handles GET /api/vector-store/{workspace_id}/files
func (c *VectorStoreController) ListFiles(w http.ResponseWriter, r *http.Request) {
	workspaceIDStr := chi.URLParam(r, "workspace_id")
	c.logger.Info("Vector store files request received",
		zap.String("workspace_id", workspaceIDStr),
		zap.String("method", r.Method),
		zap.String("path", r.URL.Path))

	workspaceID, err := uuid.Parse(workspaceIDStr)
	if err != nil {
		c.logger.Error("Invalid workspace ID", zap.String("workspace_id", workspaceIDStr), zap.Error(err))
		http.Error(w, "Invalid workspace ID", http.StatusBadRequest)
		return
	}

	c.logger.Info("Calling vector store service to list files", zap.String("workspace_id", workspaceID.String()))

	files, err := c.vectorStoreService.ListVectorStoreFiles(r.Context(), workspaceID)
	if err != nil {
		c.logger.Error("Failed to list vector store files",
			zap.String("workspace_id", workspaceID.String()),
			zap.Error(err))
		http.Error(w, "Failed to list files", http.StatusInternalServerError)
		return
	}

	c.logger.Info("Vector store service returned files",
		zap.String("workspace_id", workspaceID.String()),
		zap.Int("file_count", len(files)))

	response := map[string]interface{}{
		"files": files,
		"count": len(files),
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(response); err != nil {
		c.logger.Error("Failed to encode response", zap.Error(err))
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
		return
	}

	c.logger.Info("Vector store files response sent successfully",
		zap.String("workspace_id", workspaceID.String()),
		zap.Int("response_file_count", len(files)))
}

// DeleteFile handles DELETE /api/vector-store/{workspace_id}/files/{file_id}
func (c *VectorStoreController) DeleteFile(w http.ResponseWriter, r *http.Request) {
	workspaceIDStr := chi.URLParam(r, "workspace_id")
	workspaceID, err := uuid.Parse(workspaceIDStr)
	if err != nil {
		c.logger.Error("Invalid workspace ID", zap.Error(err))
		http.Error(w, "Invalid workspace ID", http.StatusBadRequest)
		return
	}

	fileID := chi.URLParam(r, "file_id")
	if fileID == "" {
		http.Error(w, "File ID is required", http.StatusBadRequest)
		return
	}

	err = c.vectorStoreService.DeleteVectorStoreFile(r.Context(), workspaceID, fileID)
	if err != nil {
		c.logger.Error("Failed to delete vector store file", zap.Error(err))
		http.Error(w, "Failed to delete file", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "File deleted successfully",
	})
}

// UploadFile handles POST /api/vector-store/{workspace_id}/files
func (c *VectorStoreController) UploadFile(w http.ResponseWriter, r *http.Request) {
	workspaceIDStr := chi.URLParam(r, "workspace_id")
	workspaceID, err := uuid.Parse(workspaceIDStr)
	if err != nil {
		c.logger.Error("Invalid workspace ID", zap.Error(err))
		http.Error(w, "Invalid workspace ID", http.StatusBadRequest)
		return
	}

	var req struct {
		FileName string `json:"fileName"`
		Content  string `json:"content"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		c.logger.Error("Failed to decode request", zap.Error(err))
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.FileName == "" || req.Content == "" {
		http.Error(w, "fileName and content are required", http.StatusBadRequest)
		return
	}

	fileID, err := c.vectorStoreService.UploadFileToVectorStore(r.Context(), workspaceID, req.FileName, req.Content)
	if err != nil {
		c.logger.Error("Failed to upload file to vector store", zap.Error(err))
		http.Error(w, "Failed to upload file", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "File uploaded successfully",
		"fileId":  fileID,
	})
}

// TestUpload handles POST /api/vector-store/{workspace_id}/test-upload for debugging
func (c *VectorStoreController) TestUpload(w http.ResponseWriter, r *http.Request) {
	workspaceIDStr := chi.URLParam(r, "workspace_id")
	workspaceID, err := uuid.Parse(workspaceIDStr)
	if err != nil {
		c.logger.Error("Invalid workspace ID", zap.Error(err))
		http.Error(w, "Invalid workspace ID", http.StatusBadRequest)
		return
	}

	// Test upload with simple content
	testContent := "This is a test file to verify vector store functionality. Created at: " + time.Now().Format("2006-01-02 15:04:05")
	fileName := "test-file.txt"

	c.logger.Info("Testing vector store upload",
		zap.String("workspace_id", workspaceID.String()),
		zap.String("filename", fileName))

	fileID, err := c.vectorStoreService.UploadFileToVectorStore(r.Context(), workspaceID, fileName, testContent)
	if err != nil {
		c.logger.Error("Failed to upload test file to vector store", zap.Error(err))
		http.Error(w, "Failed to upload test file", http.StatusInternalServerError)
		return
	}

	c.logger.Info("Test file uploaded successfully",
		zap.String("workspace_id", workspaceID.String()),
		zap.String("file_id", fileID))

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Test file uploaded successfully",
		"fileId":  fileID,
	})
}
