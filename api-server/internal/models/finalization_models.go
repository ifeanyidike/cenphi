package models

import (
	"time"

	"github.com/google/uuid"
)

// FinalizeSessionRequest defines the request for finalizing a session
type FinalizeSessionRequest struct {
	Action           string            `json:"action"` // "save", "discard", "replace"
	PreserveSources  bool              `json:"preserve_sources"` // Keep temp artifacts after finalization
	ArtifactMetadata map[string]string `json:"artifact_metadata"` // Additional metadata for final artifacts
	OptimizedText    *string           `json:"optimized_text,omitempty"` // Text content from frontend (for text optimization stages)
}

// FinalizeSessionResponse defines the response for session finalization
type FinalizeSessionResponse struct {
	SessionID     uuid.UUID  `json:"session_id"`
	Action        string     `json:"action"`
	ArtifactsCreated int     `json:"artifacts_created"`
	FinalArtifactIDs []uuid.UUID `json:"final_artifact_ids"`
	Message       string     `json:"message"`
	FinalizedAt   time.Time  `json:"finalized_at"`
}
