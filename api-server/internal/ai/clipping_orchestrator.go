package ai

import (
	"context"
)

// RegisterClippingHandlers registers all clipping step handlers
func (o *StepOrchestrator) RegisterClippingHandlers(worker *ClippingStepsWorker) {
	// Register each step handler
	o.registerHandler("clipping", "generate_highlights", func(ctx context.Context, input *StepInput) (*StepOutput, error) {
		stepCtx, err := o.buildStepContext(ctx, input)
		if err != nil {
			return nil, err
		}

		result, err := worker.HandleGenerateHighlights(ctx, stepCtx)
		if err != nil {
			return nil, err
		}

		output := o.convertToStepOutput(result)

		// Pass highlights to next step via config
		if result.Metadata != nil {
			if highlights, ok := result.Metadata["highlights"]; ok {
				if output.Metadata == nil {
					output.Metadata = make(map[string]interface{})
				}
				output.Metadata["highlights"] = highlights
			}
		}

		return output, nil
	})

	o.registerHandler("clipping", "extract_clips", func(ctx context.Context, input *StepInput) (*StepOutput, error) {
		stepCtx, err := o.buildStepContext(ctx, input)
		if err != nil {
			return nil, err
		}

		result, err := worker.HandleExtractClips(ctx, stepCtx)
		if err != nil {
			return nil, err
		}

		return o.convertToStepOutput(result), nil
	})
}
