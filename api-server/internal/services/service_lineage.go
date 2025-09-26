package services

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/ifeanyidike/cenphi/internal/models"
	"github.com/ifeanyidike/cenphi/internal/repositories"
	"go.uber.org/zap"
)

// **MODIFIED**: Removed direct database dependency, added repository dependencies
type ServiceLineageManager struct {
	artifactRepo repositories.TestimonialArtifactRepository
	logger       *zap.Logger

	// ✅ ADDED: Simple in-memory cache with TTL
	cache    map[string]*CachedLineage
	cacheTTL time.Duration
}

// ✅ ADDED: Cache structure
type CachedLineage struct {
	Data      *ServiceLineageResult `json:"data"`
	ExpiresAt time.Time             `json:"expires_at"`
}

// **MODIFIED**: Updated constructor to use repository injection
func NewServiceLineageManager(
	artifactRepo repositories.TestimonialArtifactRepository,
	logger *zap.Logger,
) *ServiceLineageManager {
	return &ServiceLineageManager{
		artifactRepo: artifactRepo,
		logger:       logger,
		cache:        make(map[string]*CachedLineage),
		cacheTTL:     5 * time.Minute,
	}
}

// ServiceLineageResult - keeping your existing structure
type ServiceLineageResult struct {
	AppliedServices   []string      `json:"applied_services"`
	AvailableServices []string      `json:"available_services"`
	BlockedServices   []string      `json:"blocked_services"`
	LastProcessedAt   string        `json:"last_processed_at"`
	ServiceTree       []ServiceNode `json:"service_tree"`
}

type ServiceNode struct {
	ID             string        `json:"id"`
	ProcessingType string        `json:"processing_type"`
	CreatedAt      string        `json:"created_at"`
	AssetURL       *string       `json:"asset_url"`
	TextContent    *string       `json:"text_content"`
	Children       []ServiceNode `json:"children"`
}

// **MODIFIED**: Enhanced GetServiceLineage with caching and better error handling
func (slm *ServiceLineageManager) GetServiceLineage(
	ctx context.Context,
	sourceID string,
	sourceType models.ArtifactSourceType,
	db repositories.DB,
) (*ServiceLineageResult, error) {
	cacheKey := fmt.Sprintf("%s:%s", sourceType, sourceID)
	if cached := slm.getFromCache(cacheKey); cached != nil {
		fmt.Printf("cached %#v\n", cached)
		return cached, nil
	}

	var result *ServiceLineageResult
	var err error

	switch sourceType {
	case models.TestimonialTypeSource:
		result, err = slm.getTestimonialLineage(ctx, sourceID, db)
	case models.ArtifactTypeSource:
		result, err = slm.getArtifactLineage(ctx, sourceID, db)
	case models.ClipTypeSource:
		result, err = slm.getClipLineage(ctx, sourceID, db)
	default:
		return nil, fmt.Errorf("unsupported source type: %v", sourceType)
	}

	fmt.Printf("result: \t %#v\n", result)

	if err != nil {
		slm.logger.Error("Failed to get service lineage",
			zap.String("sourceType", string(sourceType)),
			zap.String("sourceID", sourceID),
			zap.Error(err))

		// ✅ ADDED: Return graceful fallback instead of failing completely
		return &ServiceLineageResult{
			AppliedServices:   []string{},
			AvailableServices: []string{},
			BlockedServices:   []string{},
			ServiceTree:       []ServiceNode{},
		}, nil // Return graceful fallback, don't fail the request
	}

	// ✅ ADDED: Cache successful result
	slm.setInCache(cacheKey, result)

	return result, nil
}

// **MODIFIED**: Now uses repository instead of direct database queries
func (slm *ServiceLineageManager) getTestimonialLineage(
	ctx context.Context,
	testimonialID string,
	db repositories.DB,
) (*ServiceLineageResult, error) {
	testimonialUUID, err := uuid.Parse(testimonialID)
	if err != nil {
		return nil, fmt.Errorf("invalid testimonial ID: %w", err)
	}

	// ✅ MODIFIED: Use existing repository method instead of complex query
	appliedServices, err := slm.artifactRepo.GetServiceLineageForTestimonial(
		ctx, testimonialUUID, db)
	if err != nil {
		return nil, fmt.Errorf("failed to get testimonial lineage: %w", err)
	}

	// ✅ MODIFIED: Use existing repository method for processing tree
	artifacts, err := slm.artifactRepo.GetProcessingTreeForTestimonial(
		ctx, testimonialUUID, db)
	if err != nil {
		slm.logger.Warn("Failed to get processing tree, continuing with applied services only",
			zap.Error(err))
		artifacts = []models.TestimonialArtifact{} // Continue with empty tree
	}

	// ✅ ADDED: Build service tree from artifacts (simplified approach)
	serviceTree := slm.buildServiceTreeFromArtifacts(artifacts)

	// Determine available and blocked services
	availableServices, blockedServices := slm.calculateAvailableServices(appliedServices, "testimonial")

	// ✅ ADDED: Find last processed time
	lastProcessedAt := ""
	if len(artifacts) > 0 {
		lastProcessed := artifacts[0].CreatedAt
		for _, artifact := range artifacts {
			if artifact.CreatedAt.After(lastProcessed) {
				lastProcessed = artifact.CreatedAt
			}
		}
		lastProcessedAt = lastProcessed.Format(time.RFC3339)
	}

	return &ServiceLineageResult{
		AppliedServices:   appliedServices,
		AvailableServices: availableServices,
		BlockedServices:   blockedServices,
		ServiceTree:       serviceTree,
		LastProcessedAt:   lastProcessedAt,
	}, nil
}

// **MODIFIED**: Now uses repository pattern
func (slm *ServiceLineageManager) getArtifactLineage(
	ctx context.Context,
	artifactID string,
	db repositories.DB,
) (*ServiceLineageResult, error) {
	artifactUUID, err := uuid.Parse(artifactID)
	if err != nil {
		return nil, fmt.Errorf("invalid artifact ID: %w", err)
	}

	// ✅ MODIFIED: Use existing repository method
	appliedServices, err := slm.artifactRepo.GetServiceLineageForArtifact(
		ctx, artifactUUID, db)
	if err != nil {
		return nil, fmt.Errorf("failed to get artifact lineage: %w", err)
	}

	availableServices, blockedServices := slm.calculateAvailableServices(appliedServices, "artifact")

	return &ServiceLineageResult{
		AppliedServices:   appliedServices,
		AvailableServices: availableServices,
		BlockedServices:   blockedServices,
		ServiceTree:       []ServiceNode{}, // Simplified for now
	}, nil
}

func (slm *ServiceLineageManager) getClipLineage(
	ctx context.Context,
	clipReference string, // Format: "artifactID:clipID"
	db repositories.DB,
) (*ServiceLineageResult, error) {
	parts := strings.Split(clipReference, ":")
	if len(parts) != 2 {
		return nil, fmt.Errorf("invalid clip reference format, expected artifactID:clipID")
	}

	artifactUUID, err := uuid.Parse(parts[0])
	if err != nil {
		return nil, fmt.Errorf("invalid artifact ID in clip reference: %v", err)
	}

	clipUUID, err := uuid.Parse(parts[1])
	if err != nil {
		return nil, fmt.Errorf("invalid clip ID in clip reference: %v", err)
	}

	// Get clip-specific service lineage
	appliedServices, err := slm.artifactRepo.GetServiceLineageForClip(ctx, artifactUUID, clipUUID, db)
	if err != nil {
		return nil, fmt.Errorf("failed to get clip service lineage: %w", err)
	}

	// Get clip derivatives to build service tree
	derivatives, err := slm.artifactRepo.GetClipDerivatives(ctx, artifactUUID, clipUUID, db)
	if err != nil {
		slm.logger.Warn("Failed to get clip derivatives for service tree", zap.Error(err))
		derivatives = []models.TestimonialArtifact{} // Continue with empty tree
	}

	// Build service tree from derivatives
	serviceTree := slm.buildServiceTreeFromArtifacts(derivatives)

	// Calculate available and blocked services based on what's been applied
	availableServices, blockedServices := slm.calculateAvailableServicesForClip(appliedServices, parts[0])

	// Find the last processed time
	var lastProcessedAt string
	if len(derivatives) > 0 {
		lastProcessedAt = derivatives[len(derivatives)-1].CreatedAt.Format("2006-01-02T15:04:05Z")
	}

	return &ServiceLineageResult{
		AppliedServices:   appliedServices,
		AvailableServices: availableServices,
		BlockedServices:   blockedServices,
		LastProcessedAt:   lastProcessedAt,
		ServiceTree:       serviceTree,
	}, nil
}

// **MODIFIED**: Now uses repository instead of direct database queries
func (slm *ServiceLineageManager) IsServiceAlreadyApplied(
	ctx context.Context,
	sourceID string,
	sourceType models.ArtifactSourceType,
	serviceName string,
	db repositories.DB, // ✅ ADDED: Database parameter following your pattern
) (bool, error) {
	sourceUUID, err := uuid.Parse(sourceID)
	if err != nil {
		return false, fmt.Errorf("invalid source ID: %w", err)
	}

	// ✅ MODIFIED: Use existing repository method instead of complex query
	return slm.artifactRepo.CheckServiceAppliedToSource(
		ctx, sourceUUID, sourceType, serviceName, db)
}

// ✅ ADDED: Simple method to build service tree from artifacts
func (slm *ServiceLineageManager) buildServiceTreeFromArtifacts(
	artifacts []models.TestimonialArtifact,
) []ServiceNode {
	if len(artifacts) == 0 {
		return []ServiceNode{}
	}

	nodes := make([]ServiceNode, 0, len(artifacts))
	for _, artifact := range artifacts {
		node := ServiceNode{
			ID:             artifact.ID.String(),
			ProcessingType: artifact.ProcessingType,
			CreatedAt:      artifact.CreatedAt.Format(time.RFC3339),
			AssetURL:       artifact.AssetURL,
			TextContent:    artifact.TextContent,
			Children:       []ServiceNode{}, // Simplified - no complex hierarchy for now
		}
		nodes = append(nodes, node)
	}

	return nodes
}

// ✅ ADDED: Cache management methods
func (slm *ServiceLineageManager) getFromCache(key string) *ServiceLineageResult {
	cached, exists := slm.cache[key]
	if !exists {
		return nil
	}

	if time.Now().After(cached.ExpiresAt) {
		delete(slm.cache, key)
		return nil
	}

	return cached.Data
}

func (slm *ServiceLineageManager) setInCache(key string, data *ServiceLineageResult) {
	slm.cache[key] = &CachedLineage{
		Data:      data,
		ExpiresAt: time.Now().Add(slm.cacheTTL),
	}
}

// ✅ ADDED: Cache invalidation method
func (slm *ServiceLineageManager) InvalidateCache(sourceType models.ArtifactSourceType, sourceID string) {
	cacheKey := fmt.Sprintf("%s:%s", sourceType, sourceID)
	delete(slm.cache, cacheKey)
}

// calculateAvailableServices - keeping your existing logic but cleaned up
func (slm *ServiceLineageManager) calculateAvailableServices(
	appliedServices []string,
	sourceContext string,
) (available []string, blocked []string) {
	// ✅ CLEANED UP: Your existing service rules
	serviceRules := map[string]struct {
		CanProcess       []string
		ExcludeIfApplied []string
	}{
		"clipping": {
			CanProcess:       []string{"original"},
			ExcludeIfApplied: []string{"clipping"},
		},
		"story_mode_generation": {
			CanProcess:       []string{"clipping"},
			ExcludeIfApplied: []string{"story_mode_generation"},
		},
		"enhancement": {
			CanProcess:       []string{"clipping", "story_mode_generation"},
			ExcludeIfApplied: []string{"enhancement"},
		},
		"platform_optimizer": {
			CanProcess:       []string{"clipping", "story_mode_generation", "enhancement"},
			ExcludeIfApplied: []string{"platform_optimizer"},
		},
		"text_polishing": {
			CanProcess:       []string{"original"},
			ExcludeIfApplied: []string{"text_polishing"},
		},
		"narration": {
			CanProcess:       []string{"text_polishing"},
			ExcludeIfApplied: []string{"narration"},
		},
		"content_generation": {
			CanProcess:       []string{"original", "text_polishing"},
			ExcludeIfApplied: []string{"content_generation"},
		},
	}

	appliedSet := make(map[string]bool)
	for _, service := range appliedServices {
		appliedSet[service] = true
	}

	for serviceName, rules := range serviceRules {
		isBlocked := false

		// Check if any exclusion service has been applied
		for _, excludedService := range rules.ExcludeIfApplied {
			if appliedSet[excludedService] {
				blocked = append(blocked, serviceName)
				isBlocked = true
				break
			}
		}

		if !isBlocked {
			canApply := false

			if sourceContext == "testimonial" {
				// For original testimonials, check if service can process "original"
				for _, processType := range rules.CanProcess {
					if processType == "original" {
						canApply = true
						break
					}
				}
			} else {
				// For artifacts, check if any applied service is in the canProcess list
				for _, processType := range rules.CanProcess {
					if appliedSet[processType] {
						canApply = true
						break
					}
				}
			}

			if canApply {
				available = append(available, serviceName)
			} else {
				blocked = append(blocked, serviceName)
			}
		}
	}

	return available, blocked
}

// ✅ ADDED: Helper method for service compatibility (used by frontend)
func (slm *ServiceLineageManager) calculateAvailableServicesForArtifact(
	servicePath []string,
	artifactID string,
) (available []string, blocked []string) {
	return slm.calculateAvailableServices(servicePath, "artifact")
}

func (slm *ServiceLineageManager) calculateAvailableServicesForClip(
	appliedServices []string,
	artifactID string,
) (available []string, blocked []string) {
	// Service compatibility rules for clips
	// Clips generally support content creation and enhancement services
	allServices := []string{
		"enhancement",
		"platform_optimizer",
		"narration",
		"translation",
		"content_generation",
		"story_mode_generation", // Can create story from clips
		"text_polishing",
	}

	// Services that can't be applied to clips
	clipBlockedServices := []string{
		"clipping",             // Can't clip a clip
		"sentiment_analysis",   // Usually done on full testimonial
		"highlight_extraction", // Clips are already highlights
	}

	appliedSet := make(map[string]bool)
	for _, service := range appliedServices {
		appliedSet[service] = true
	}

	for _, service := range allServices {
		isBlocked := false

		// Check if service is inherently blocked for clips
		for _, blockedService := range clipBlockedServices {
			if service == blockedService {
				isBlocked = true
				blocked = append(blocked, service)
				break
			}
		}

		if isBlocked {
			continue
		}

		// Check if already applied
		if appliedSet[service] {
			blocked = append(blocked, service)
			continue
		}

		// Service-specific rules
		switch service {
		case "enhancement":
			// Can enhance clips that haven't been enhanced
			if !appliedSet["enhancement"] {
				available = append(available, service)
			}

		case "platform_optimizer":
			// Can optimize clips for different platforms
			if !appliedSet["video_platform_optization"] && !appliedSet["text_platform_optization"] {
				available = append(available, service)
			}

		case "story_mode_generation":
			// Can create stories from clips
			if !appliedSet["story_mode_generation"] {
				available = append(available, service)
			}

		case "narration":
			// Can add narration if content has been polished/generated
			if appliedSet["text_polishing"] || appliedSet["content_generation"] || appliedSet["translation"] {
				available = append(available, service)
			}

		default:
			// Default: available if not applied
			available = append(available, service)
		}
	}

	return available, blocked
}

func (slm *ServiceLineageManager) CanApplyServiceToClip(
	ctx context.Context,
	clipReference string,
	serviceName string,
	db repositories.DB,
) (bool, error) {
	lineage, err := slm.getClipLineage(ctx, clipReference, db)
	if err != nil {
		return false, err
	}

	// Check if service is in available services
	for _, availableService := range lineage.AvailableServices {
		if availableService == serviceName {
			return true, nil
		}
	}

	return false, nil
}
