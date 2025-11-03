// internal/models/content_folder_models.go
package models

import (
	"time"

	"github.com/google/uuid"
)

// ContentFolder represents a folder/category for organizing AI-generated artifacts
type ContentFolder struct {
	ID          uuid.UUID `json:"id" db:"id"`
	WorkspaceID uuid.UUID `json:"workspace_id" db:"workspace_id"`

	// Folder metadata
	Name        string  `json:"name" db:"name"`
	Description *string `json:"description,omitempty" db:"description"`
	Color       *string `json:"color,omitempty" db:"color"` // Hex color code
	Icon        *string `json:"icon,omitempty" db:"icon"`   // Icon name from lucide-react

	// Organization
	IsDefault bool `json:"is_default" db:"is_default"`
	SortOrder int  `json:"sort_order" db:"sort_order"`

	// Stats (denormalized)
	ItemCount int `json:"item_count" db:"item_count"`

	// Timestamps
	CreatedAt time.Time `json:"created_at" db:"created_at"`
	UpdatedAt time.Time `json:"updated_at" db:"updated_at"`
}

// FolderItem represents a many-to-many relationship between folders and artifacts
type FolderItem struct {
	ID        uuid.UUID `json:"id" db:"id"`
	FolderID  uuid.UUID `json:"folder_id" db:"folder_id"`
	ArtifactID uuid.UUID `json:"artifact_id" db:"artifact_id"`

	// Timestamps
	AddedAt time.Time `json:"added_at" db:"added_at"`
}

// CreateFolderRequest represents the request body for creating a new folder
type CreateFolderRequest struct {
	Name        string  `json:"name" binding:"required,max=255"`
	Description *string `json:"description,omitempty"`
	Color       *string `json:"color,omitempty"`
	Icon        *string `json:"icon,omitempty"`
	SortOrder   *int    `json:"sort_order,omitempty"`
}

// UpdateFolderRequest represents the request body for updating a folder
type UpdateFolderRequest struct {
	Name        *string `json:"name,omitempty" binding:"omitempty,max=255"`
	Description *string `json:"description,omitempty"`
	Color       *string `json:"color,omitempty"`
	Icon        *string `json:"icon,omitempty"`
	SortOrder   *int    `json:"sort_order,omitempty"`
}

// AddItemsToFolderRequest represents the request body for adding items to a folder
type AddItemsToFolderRequest struct {
	ArtifactIDs []uuid.UUID `json:"artifact_ids" binding:"required,min=1"`
}

// FolderWithItems represents a folder with its artifacts (for detailed views)
type FolderWithItems struct {
	ContentFolder
	Artifacts []TestimonialArtifact `json:"artifacts,omitempty"`
}

// FolderStats represents statistics about a folder
type FolderStats struct {
	FolderID      uuid.UUID `json:"folder_id"`
	TotalItems    int       `json:"total_items"`
	VideoCount    int       `json:"video_count"`
	TextCount     int       `json:"text_count"`
	LastAddedAt   time.Time `json:"last_added_at,omitempty"`
	LastUpdatedAt time.Time `json:"last_updated_at"`
}
