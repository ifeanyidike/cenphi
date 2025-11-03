package controllers

import (
	"go.uber.org/zap"
)

// stageOrderPriority defines the priority order for specific stages
// Lower priority = earlier in pipeline
// Higher priority = later in pipeline
var stageOrderPriority = map[string]int{
	// FIRST: Crop & Resize (always first - sets dimensions)
	"crop_resize": 1,

	// MIDDLE: All other steps (maintain user order)
	"noise_removal":         10,
	"burn_captions":         10,
	"text_overlay":          10,
	"apply_broll":           10,
	"mix_music":             10,
	"apply_branding":        10,
	"text_optimization":     10,
	"audio_normalization":   10,

	// LAST: Enhancement (always last - final quality polish)
	"enhance": 100,
}

// NormalizeStageOrder reorders stages to ensure optimal processing order:
// 1. crop_resize (if present) always comes FIRST
// 2. For video pipelines: enhance (if present) always comes LAST
// 3. For platform_optimization: text_optimization (if present) comes LAST, enhance comes second-to-last
// 4. All other steps maintain their relative user-defined order
//
// Returns:
// - reorderedStages: The normalized stage order
// - wasReordered: true if any reordering occurred
func NormalizeStageOrder(selectedStages []string, pipelineType string, logger *zap.Logger) ([]string, bool) {
	if len(selectedStages) <= 1 {
		// Nothing to reorder
		return selectedStages, false
	}

	// Track which special stages we found
	var (
		hasCropResize       bool
		hasEnhance          bool
		hasTextOptimization bool
		cropIndex           int = -1
		enhanceIndex        int = -1
		textOptIndex        int = -1
	)

	// Find special stages and their current positions
	for i, stage := range selectedStages {
		switch stage {
		case "crop_resize":
			hasCropResize = true
			cropIndex = i
		case "enhance":
			hasEnhance = true
			enhanceIndex = i
		case "text_optimization":
			hasTextOptimization = true
			textOptIndex = i
		}
	}

	// Determine expected positions based on pipeline type
	isPlatformOptimization := pipelineType == "platform_optimization"

	// Check if reordering is needed
	needsReorder := false
	if hasCropResize && cropIndex != 0 {
		needsReorder = true
	}

	if isPlatformOptimization {
		// For platform optimization: enhance should be second-to-last, text_optimization last
		if hasTextOptimization && textOptIndex != len(selectedStages)-1 {
			needsReorder = true
		}
		if hasEnhance && hasTextOptimization && enhanceIndex != len(selectedStages)-2 {
			needsReorder = true
		}
		// If only enhance (no text_optimization), it can be last
		if hasEnhance && !hasTextOptimization && enhanceIndex != len(selectedStages)-1 {
			needsReorder = true
		}
	} else {
		// For video pipelines: enhance should always be last
		if hasEnhance && enhanceIndex != len(selectedStages)-1 {
			needsReorder = true
		}
	}

	if !needsReorder {
		logger.Debug("Stage order already optimal - no reordering needed")
		return selectedStages, false
	}

	// Build reordered stages
	reorderedStages := make([]string, 0, len(selectedStages))

	// 1. Add crop_resize first (if present)
	if hasCropResize {
		reorderedStages = append(reorderedStages, "crop_resize")
	}

	// 2. Add all middle stages in their original relative order
	for _, stage := range selectedStages {
		shouldSkip := stage == "crop_resize" || stage == "enhance"
		if isPlatformOptimization {
			shouldSkip = shouldSkip || stage == "text_optimization"
		}
		if !shouldSkip {
			reorderedStages = append(reorderedStages, stage)
		}
	}

	// 3. Add final stages based on pipeline type
	if isPlatformOptimization {
		// For platform optimization: enhance second-to-last, text_optimization last
		if hasEnhance {
			reorderedStages = append(reorderedStages, "enhance")
		}
		if hasTextOptimization {
			reorderedStages = append(reorderedStages, "text_optimization")
		}
	} else {
		// For video pipelines: enhance last
		if hasEnhance {
			reorderedStages = append(reorderedStages, "enhance")
		}
	}

	// Log the reordering for transparency
	if logger != nil {
		logger.Info("⚡ Stage order normalized for optimal quality",
			zap.Strings("original_order", selectedStages),
			zap.Strings("normalized_order", reorderedStages),
			zap.Bool("crop_moved_to_start", hasCropResize && cropIndex != 0),
			zap.Bool("enhance_moved_to_end", hasEnhance && enhanceIndex != len(selectedStages)-1))
	}

	return reorderedStages, true
}
