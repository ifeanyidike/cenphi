package controllers

import (
	"database/sql"
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/ifeanyidike/cenphi/internal/repositories"
	"github.com/ifeanyidike/cenphi/internal/utils"
	"go.uber.org/zap"
)

// TestimonialTranscriptController handles lazy-loaded transcript data
type TestimonialTranscriptController struct {
	testimonialRepo repositories.TestimonialRepository
	db              *sql.DB
	logger          *zap.Logger
}

func NewTestimonialTranscriptController(
	testimonialRepo repositories.TestimonialRepository,
	db *sql.DB,
	logger *zap.Logger,
) *TestimonialTranscriptController {
	return &TestimonialTranscriptController{
		testimonialRepo: testimonialRepo,
		db:              db,
		logger:          logger,
	}
}

// GetTranscriptSegments returns full transcript segments for a testimonial
// GET /api/testimonials/{id}/transcript-segments
func (c *TestimonialTranscriptController) GetTranscriptSegments(w http.ResponseWriter, r *http.Request) {
	testimonialIDStr := chi.URLParam(r, "id")
	testimonialID, err := uuid.Parse(testimonialIDStr)
	if err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "invalid testimonial ID")
		return
	}

	c.logger.Info("Fetching transcript segments",
		zap.String("testimonial_id", testimonialID.String()))

	var segments json.RawMessage
	err = c.db.QueryRowContext(r.Context(), `
		SELECT COALESCE(transcript_segments, '[]'::jsonb)
		FROM testimonials
		WHERE id = $1
	`, testimonialID).Scan(&segments)

	if err == sql.ErrNoRows {
		utils.RespondWithError(w, http.StatusNotFound, "testimonial not found")
		return
	}
	if err != nil {
		c.logger.Error("Failed to fetch transcript segments",
			zap.String("testimonial_id", testimonialID.String()),
			zap.Error(err))
		utils.RespondWithError(w, http.StatusInternalServerError, "failed to fetch transcript segments")
		return
	}

	// Return raw JSON array
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write(segments)
}

// GetVideoDuration returns calculated duration from transcript segments
// GET /api/testimonials/{id}/duration
func (c *TestimonialTranscriptController) GetVideoDuration(w http.ResponseWriter, r *http.Request) {
	testimonialIDStr := chi.URLParam(r, "id")
	testimonialID, err := uuid.Parse(testimonialIDStr)
	if err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "invalid testimonial ID")
		return
	}

	c.logger.Debug("Calculating video duration from transcript segments",
		zap.String("testimonial_id", testimonialID.String()))

	var raw json.RawMessage
	err = c.db.QueryRowContext(r.Context(), `
		SELECT COALESCE(transcript_segments, '[]'::jsonb)
		FROM testimonials
		WHERE id = $1
	`, testimonialID).Scan(&raw)
	if err == sql.ErrNoRows {
		utils.RespondWithError(w, http.StatusNotFound, "testimonial not found")
		return
	}
	if err != nil {
		c.logger.Error("Failed to fetch transcript segments", zap.Error(err))
		utils.RespondWithError(w, http.StatusInternalServerError, "failed to fetch transcript segments")
		return
	}

	var segments []struct {
		EndTime float64 `json:"end_time"`
	}
	if err := json.Unmarshal(raw, &segments); err != nil {
		c.logger.Error("Failed to parse transcript segments", zap.Error(err))
		utils.RespondWithError(w, http.StatusInternalServerError, "invalid transcript format")
		return
	}

	duration := 0.0
	if len(segments) > 0 {
		duration = segments[len(segments)-1].EndTime
		if duration > 1000 { // convert ms → s
			duration /= 1000.0
		}
	} else {
		c.logger.Warn("No transcript segments found", zap.String("testimonial_id", testimonialID.String()))
	}

	utils.RespondWithJSON(w, http.StatusOK, map[string]interface{}{
		"duration":      duration,
		"segment_count": len(segments),
		"has_segments":  len(segments) > 0,
	})
}
