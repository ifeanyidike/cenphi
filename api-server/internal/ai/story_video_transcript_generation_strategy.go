package ai

import (
	"context"
	"encoding/json"
	"fmt"
	"sort"

	"github.com/google/uuid"
	"github.com/ifeanyidike/cenphi/internal/models"
	"github.com/ifeanyidike/cenphi/pb"
	"go.uber.org/zap"
)

type StoryTranscriptStrategy string

const (
	ReuseExistingSegments StoryTranscriptStrategy = "reuse"
	FreshTranscription    StoryTranscriptStrategy = "fresh"
)

type ClipInfo struct {
	ClipID        uuid.UUID
	TestimonialID uuid.UUID
	StartTime     float64
	EndTime       float64
	Text          string
}

// determineTranscriptStrategy decides whether to reuse existing segments or generate fresh transcript
func (qw *AIQueueWorker) determineTranscriptStrategy(ctx context.Context, clips []models.ClipSource) StoryTranscriptStrategy {
	if len(clips) <= 1 {
		qw.logger.Info("Single or no clips - reusing existing segments")
		return ReuseExistingSegments
	}

	// Get clip details for analysis
	clipDetails, err := qw.getClipDetails(ctx, clips)
	if err != nil {
		qw.logger.Warn("Could not get clip details - using fresh transcription", zap.Error(err))
		return FreshTranscription
	}

	// Case 1: Multiple testimonials = always fresh
	testimonialIDs := make(map[uuid.UUID]bool)
	for _, clip := range clipDetails {
		testimonialIDs[clip.TestimonialID] = true
	}

	if len(testimonialIDs) > 1 {
		qw.logger.Info("Multiple testimonials detected - using fresh transcription",
			zap.Int("testimonial_count", len(testimonialIDs)))
		return FreshTranscription
	}

	// Case 2: Single testimonial - check chronological order and gaps
	if qw.isChronologicalWithoutGaps(clipDetails) {
		qw.logger.Info("Same testimonial in chronological order with no gaps - reusing existing segments")
		return ReuseExistingSegments
	}

	qw.logger.Info("Same testimonial but non-chronological or has gaps - using fresh transcription",
		zap.Int("clip_count", len(clipDetails)))
	return FreshTranscription
}

// getClipDetails extracts clip information from artifacts
func (qw *AIQueueWorker) getClipDetails(ctx context.Context, clips []models.ClipSource) ([]ClipInfo, error) {
	clipDetails := make([]ClipInfo, 0, len(clips))

	for _, clipSource := range clips {
		artifact, err := qw.artifactRepo.GetByID(ctx, clipSource.ArtifactID, qw.db)
		if err != nil {
			return nil, fmt.Errorf("failed to get artifact %s: %w", clipSource.ArtifactID, err)
		}

		if artifact.TestimonialID == nil {
			return nil, fmt.Errorf("artifact %s has no testimonial ID", clipSource.ArtifactID)
		}

		// Find the specific clip in artifact data
		clipInfo, err := qw.extractClipFromArtifact(artifact, clipSource.ClipID)
		if err != nil {
			return nil, fmt.Errorf("failed to extract clip %s: %w", clipSource.ClipID, err)
		}

		clipInfo.TestimonialID = *artifact.TestimonialID
		clipDetails = append(clipDetails, clipInfo)
	}

	return clipDetails, nil
}

// extractClipFromArtifact finds specific clip data in artifact
func (qw *AIQueueWorker) extractClipFromArtifact(artifact *models.TestimonialArtifact, clipID uuid.UUID) (ClipInfo, error) {
	var clipInfo ClipInfo

	data, ok := artifact.Data["generated_clips"]
	if !ok {
		return clipInfo, fmt.Errorf("no generated_clips in artifact data")
	}

	var resp pb.ClippingResponse
	b, err := json.Marshal(data)
	if err != nil {
		return clipInfo, fmt.Errorf("failed to marshal clip data: %w", err)
	}

	if err := json.Unmarshal(b, &resp); err != nil {
		return clipInfo, fmt.Errorf("failed to unmarshal ClippingResponse: %w", err)
	}

	for _, clip := range resp.Clips {
		if clip.Id == clipID.String() {
			clipInfo = ClipInfo{
				ClipID:    clipID,
				StartTime: clip.StartTime,
				EndTime:   clip.EndTime,
				Text:      clip.Text,
			}
			return clipInfo, nil
		}
	}

	return clipInfo, fmt.Errorf("clip %s not found in artifact", clipID)
}

// isChronologicalWithoutGaps checks if clips are in order with no gaps
func (qw *AIQueueWorker) isChronologicalWithoutGaps(clips []ClipInfo) bool {
	if len(clips) <= 1 {
		return true
	}

	// Sort clips by start time to check original order
	sortedClips := make([]ClipInfo, len(clips))
	copy(sortedClips, clips)
	sort.Slice(sortedClips, func(i, j int) bool {
		return sortedClips[i].StartTime < sortedClips[j].StartTime
	})

	// Check if story order matches chronological order
	for i, clip := range clips {
		if clip.StartTime != sortedClips[i].StartTime {
			qw.logger.Debug("Clips not in chronological order",
				zap.Int("position", i),
				zap.Float64("expected_start", sortedClips[i].StartTime),
				zap.Float64("actual_start", clip.StartTime))
			return false
		}
	}

	// Check for gaps between consecutive clips
	const maxGapMs = 1000.0 // 1 second tolerance for gaps
	for i := 1; i < len(clips); i++ {
		previousEnd := clips[i-1].EndTime
		currentStart := clips[i].StartTime
		gap := currentStart - previousEnd

		if gap > maxGapMs {
			qw.logger.Debug("Gap detected between clips",
				zap.Int("clip_index", i),
				zap.Float64("gap_ms", gap),
				zap.Float64("previous_end", previousEnd),
				zap.Float64("current_start", currentStart))
			return false
		}
	}

	return true
}

// buildConsolidatedSegments creates transcript segments for chronological clips
func (qw *AIQueueWorker) buildConsolidatedSegments(ctx context.Context, clips []models.ClipSource) (models.TranscriptSegments, error) {
	if len(clips) == 0 {
		return nil, fmt.Errorf("no clips provided")
	}

	// Get the testimonial (should be same for all clips if we reach here)
	firstClip, err := qw.artifactRepo.GetByID(ctx, clips[0].ArtifactID, qw.db)
	if err != nil {
		return nil, fmt.Errorf("failed to get first clip artifact: %w", err)
	}

	if firstClip.TestimonialID == nil {
		return nil, fmt.Errorf("first clip has no testimonial ID")
	}

	testimonial, err := qw.testimonialRepo.FetchForAIProcessing(ctx, *firstClip.TestimonialID, qw.db)
	if err != nil {
		return nil, fmt.Errorf("failed to get testimonial: %w", err)
	}

	if testimonial.TranscriptSegments == nil {
		return nil, fmt.Errorf("testimonial has no transcript segments")
	}

	// Get clip details to determine time ranges
	clipDetails, err := qw.getClipDetails(ctx, clips)
	if err != nil {
		return nil, fmt.Errorf("failed to get clip details: %w", err)
	}

	// Build consolidated segments by extracting and adjusting timing
	var consolidatedSegments models.TranscriptSegments
	var currentOffset float64 = 0

	for _, clipInfo := range clipDetails {
		// Extract segments for this clip's time range
		clipSegments := qw.getTranscriptSegmentByTime(*testimonial.TranscriptSegments, clipInfo.StartTime, clipInfo.EndTime)

		// Adjust timing to new story timeline
		for _, segment := range clipSegments {
			adjustedSegment := segment
			adjustedSegment.StartTime = segment.StartTime + currentOffset
			adjustedSegment.EndTime = segment.EndTime + currentOffset

			// Adjust word timing too
			for i := range adjustedSegment.Words {
				adjustedSegment.Words[i].Start = adjustedSegment.Words[i].Start + currentOffset
				adjustedSegment.Words[i].End = adjustedSegment.Words[i].End + currentOffset
			}

			consolidatedSegments = append(consolidatedSegments, adjustedSegment)
		}

		// Update offset for next clip
		clipDuration := clipInfo.EndTime - clipInfo.StartTime
		currentOffset += clipDuration
	}

	if len(consolidatedSegments) == 0 {
		return nil, fmt.Errorf("no consolidated segments generated")
	}

	qw.logger.Info("Built consolidated transcript segments",
		zap.Int("segment_count", len(consolidatedSegments)),
		zap.Int("clip_count", len(clips)))

	return consolidatedSegments, nil
}
