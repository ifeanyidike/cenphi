package ai

import (
	"context"
	"fmt"
)

// RegisterStoryVideoHandlers registers all story video step handlers
// Note: Many steps need to be registered AFTER platform optimization handlers are registered
// so they can reference those handlers
func (o *StepOrchestrator) RegisterStoryVideoHandlers(worker *StoryVideoStepsWorker) {
	// Register each step handler

	// Step 1: Extract & Collect Clips
	// Extracts clips from testimonials based on highlights
	// Streams clips to frontend staging area as they're generated
	// o.registerHandler("story_video", "extract_clips", func(ctx context.Context, input *StepInput) (*StepOutput, error) {
	// 	stepCtx, err := o.buildStepContext(ctx, input)
	// 	if err != nil {
	// 		return nil, err
	// 	}

	// 	result, err := worker.HandleCollectClips(ctx, stepCtx)
	// 	if err != nil {
	// 		return nil, err
	// 	}

	// 	output := o.convertToStepOutput(result)

	// 	// Pass clips to next step via metadata
	// 	if result.Metadata != nil {
	// 		if clips, ok := result.Metadata["clips"]; ok {
	// 			if output.Metadata == nil {
	// 				output.Metadata = make(map[string]interface{})
	// 			}
	// 			output.Metadata["clips"] = clips
	// 		}
	// 	}

	// 	return output, nil
	// })

	// // Step 2: AI Smart Ordering
	// // Analyzes clips and suggests optimal sequence
	// // User can accept AI order or manually reorder in timeline
	// o.registerHandler("story_video", "ai_ordering", func(ctx context.Context, input *StepInput) (*StepOutput, error) {
	// 	stepCtx, err := o.buildStepContext(ctx, input)
	// 	if err != nil {
	// 		return nil, err
	// 	}

	// 	result, err := worker.HandleAIOrdering(ctx, stepCtx)
	// 	if err != nil {
	// 		return nil, err
	// 	}

	// 	output := o.convertToStepOutput(result)

	// 	// Pass ordered clips to next step
	// 	if result.Metadata != nil {
	// 		if orderedClips, ok := result.Metadata["ordered_clips"]; ok {
	// 			if output.Metadata == nil {
	// 				output.Metadata = make(map[string]interface{})
	// 			}
	// 			output.Metadata["ordered_clips"] = orderedClips
	// 		}
	// 	}

	// 	return output, nil
	// })

	// // Step 3: Assemble Draft Video
	// // Combines clips into final story video with transitions and normalization
	// // This is the first finished product users can save
	// o.registerHandler("story_video", "assemble_draft", func(ctx context.Context, input *StepInput) (*StepOutput, error) {
	// 	stepCtx, err := o.buildStepContext(ctx, input)
	// 	if err != nil {
	// 		return nil, err
	// 	}

	// 	result, err := worker.HandleAssembleDraft(ctx, stepCtx)
	// 	if err != nil {
	// 		return nil, err
	// 	}

	// 	return o.convertToStepOutput(result), nil
	// })

	// Step 3: Assemble Draft Video
	// Combines clips into final story video with transitions and normalization
	// This is the first finished product users can save
	o.registerHandler("story_video", "assemble_clips", func(ctx context.Context, input *StepInput) (*StepOutput, error) {
		stepCtx, err := o.buildStoryVideoStepContext(ctx, input)
		if err != nil {
			return nil, err
		}

		result, err := worker.HandleCollectAndAssembleClips(ctx, stepCtx)
		if err != nil {
			return nil, err
		}

		return o.convertToStepOutput(result), nil
	})

	// Step 4: Add intro/outro (optional)
	o.registerHandler("story_video", "add_intro_outro", func(ctx context.Context, input *StepInput) (*StepOutput, error) {
		stepCtx, err := o.buildStoryVideoStepContext(ctx, input)
		if err != nil {
			return nil, err
		}

		result, err := worker.HandleAddIntroOutro(ctx, stepCtx)
		if err != nil {
			return nil, err
		}

		return o.convertToStepOutput(result), nil
	})

	// Step 5: Apply branding (reuse from platform optimization)
	o.registerHandler("story_video", "apply_branding", func(ctx context.Context, input *StepInput) (*StepOutput, error) {
		// Reuse the platform_optimization apply_branding handler
		// buildStepContext now handles nil/empty testimonialID gracefully
		handler := o.getStepHandler("platform_optimization", "apply_branding")
		if handler == nil {
			return nil, fmt.Errorf("apply_branding handler not found")
		}
		return handler(ctx, input)
	})

	// Step 6: Noise removal (reuse from platform optimization)
	o.registerHandler("story_video", "noise_removal", func(ctx context.Context, input *StepInput) (*StepOutput, error) {
		// Reuse the platform_optimization noise_removal handler
		// buildStepContext now handles nil/empty testimonialID gracefully
		handler := o.getStepHandler("platform_optimization", "noise_removal")
		if handler == nil {
			return nil, fmt.Errorf("noise_removal handler not found")
		}
		return handler(ctx, input)
	})

	// Step 7: Mix music (reuse from platform optimization)
	o.registerHandler("story_video", "mix_music", func(ctx context.Context, input *StepInput) (*StepOutput, error) {
		// Reuse the platform_optimization mix_music handler
		// buildStepContext now handles nil/empty testimonialID gracefully
		handler := o.getStepHandler("platform_optimization", "mix_music")
		if handler == nil {
			return nil, fmt.Errorf("mix_music handler not found")
		}
		return handler(ctx, input)
	})

	// Step 8: Enhance video (reuse from platform optimization)
	o.registerHandler("story_video", "enhance", func(ctx context.Context, input *StepInput) (*StepOutput, error) {
		// Reuse the platform_optimization enhance handler
		// buildStepContext now handles nil/empty testimonialID gracefully
		handler := o.getStepHandler("platform_optimization", "enhance")
		if handler == nil {
			return nil, fmt.Errorf("enhance handler not found")
		}
		return handler(ctx, input)
	})
}
