// internal/services/best_time_service.go
package services

import (
	"context"
	"database/sql"
	"fmt"
	"math"
	"time"

	"github.com/google/uuid"
	"github.com/ifeanyidike/cenphi/internal/repositories"
	"go.uber.org/zap"
)

type BestTimeService interface {
	SuggestBestTime(ctx context.Context, workspaceID uuid.UUID, platform string, postType string) (time.Time, float64, error)
}

type bestTimeService struct {
	repo   repositories.Repo
	db     *sql.DB
	logger *zap.Logger
}

func NewBestTimeService(repo repositories.Repo, db *sql.DB, logger *zap.Logger) BestTimeService {
	return &bestTimeService{repo: repo, db: db, logger: logger}
}

// PostEngagementData represents historical post performance data
type PostEngagementData struct {
	PublishedAt   time.Time
	ViewsCount    int
	LikesCount    int
	CommentsCount int
	SharesCount   int
	PostType      string
}

// TimeSlotScore represents engagement score for a specific time slot
type TimeSlotScore struct {
	HourOfWeek int     // 0-167 (24 hours * 7 days)
	Score      float64
	PostCount  int
}

func (s *bestTimeService) SuggestBestTime(ctx context.Context, workspaceID uuid.UUID, platform string, postType string) (time.Time, float64, error) {
	s.logger.Info("🕐 Generating AI best time suggestion",
		zap.String("workspace_id", workspaceID.String()),
		zap.String("platform", platform),
		zap.String("post_type", postType))

	// Query recent published posts for workspace & platform
	query := `
		SELECT published_at, views_count, likes_count, comments_count, shares_count, post_type
		FROM social_posts
		WHERE workspace_id = $1 AND platform = $2 AND published_at IS NOT NULL
		  AND published_at > now() - interval '90 days'
		ORDER BY published_at DESC
	`

	rows, err := s.db.QueryContext(ctx, query, workspaceID, platform)
	if err != nil {
		s.logger.Error("❌ Failed to query historical posts", zap.Error(err))
		return time.Time{}, 0, fmt.Errorf("failed to query historical posts: %w", err)
	}
	defer rows.Close()

	var historicalData []PostEngagementData
	for rows.Next() {
		var data PostEngagementData
		var publishedAt sql.NullTime

		err := rows.Scan(&publishedAt, &data.ViewsCount, &data.LikesCount,
			&data.CommentsCount, &data.SharesCount, &data.PostType)
		if err != nil {
			s.logger.Error("❌ Failed to scan row", zap.Error(err))
			continue
		}

		if publishedAt.Valid {
			data.PublishedAt = publishedAt.Time
			historicalData = append(historicalData, data)
		}
	}

	if err = rows.Err(); err != nil {
		s.logger.Error("❌ Row iteration error", zap.Error(err))
		return time.Time{}, 0, fmt.Errorf("row iteration error: %w", err)
	}

	// If we have historical data, use it for analysis
	if len(historicalData) > 0 {
		s.logger.Info("📊 Analyzing historical data", zap.Int("posts_count", len(historicalData)))
		return s.analyzeHistoricalData(historicalData, postType)
	}

	// Fallback to heuristics if no historical data
	s.logger.Info("🔮 Using fallback heuristics (no historical data)")
	return s.getFallbackTime(platform)
}

func (s *bestTimeService) analyzeHistoricalData(data []PostEngagementData, postType string) (time.Time, float64, error) {
	// Create time slot scores (hour of week: 0-167)
	timeSlots := make(map[int]*TimeSlotScore)

	for _, post := range data {
		// Calculate engagement score with weighted metrics
		// Formula: views*0.1 + likes*1 + comments*2 + shares*3
		score := float64(post.ViewsCount)*0.1 +
				 float64(post.LikesCount)*1.0 +
				 float64(post.CommentsCount)*2.0 +
				 float64(post.SharesCount)*3.0

		// Calculate hour of week (0-167)
		weekday := int(post.PublishedAt.Weekday()) // Sunday = 0
		hour := post.PublishedAt.Hour()
		hourOfWeek := weekday*24 + hour

		// Apply type-specific boost if post types match
		if post.PostType == postType {
			score *= 1.2 // 20% boost for same post type
		}

		// Update time slot score
		if timeSlots[hourOfWeek] == nil {
			timeSlots[hourOfWeek] = &TimeSlotScore{
				HourOfWeek: hourOfWeek,
				Score:      0,
				PostCount:  0,
			}
		}

		timeSlots[hourOfWeek].Score += score
		timeSlots[hourOfWeek].PostCount++
	}

	// Calculate average scores and find best time slot
	var bestSlot *TimeSlotScore
	maxAvgScore := 0.0

	for _, slot := range timeSlots {
		avgScore := slot.Score / float64(slot.PostCount)
		if avgScore > maxAvgScore {
			maxAvgScore = avgScore
			bestSlot = slot
		}
	}

	if bestSlot == nil {
		return s.getFallbackTime("linkedin") // Default fallback
	}

	// Find next occurrence of this time slot
	now := time.Now().UTC()
	targetWeekday := bestSlot.HourOfWeek / 24
	targetHour := bestSlot.HourOfWeek % 24

	// Calculate days until target weekday
	currentWeekday := int(now.Weekday())
	daysUntil := (targetWeekday - currentWeekday + 7) % 7
	if daysUntil == 0 && now.Hour() >= targetHour {
		daysUntil = 7 // Next week if time has passed today
	}

	suggestedTime := time.Date(
		now.Year(), now.Month(), now.Day()+daysUntil,
		targetHour, 0, 0, 0, time.UTC,
	)

	// Calculate confidence score (normalized 0-1)
	// Based on number of posts in this slot and score consistency
	confidence := math.Min(float64(bestSlot.PostCount)/10.0, 1.0) * 0.8 + 0.2

	s.logger.Info("✅ Historical analysis complete",
		zap.Time("suggested_time", suggestedTime),
		zap.Float64("confidence", confidence),
		zap.Int("best_hour_of_week", bestSlot.HourOfWeek),
		zap.Int("posts_in_slot", bestSlot.PostCount))

	return suggestedTime, confidence, nil
}

func (s *bestTimeService) getFallbackTime(platform string) (time.Time, float64, error) {
	now := time.Now().UTC()
	var suggestedTime time.Time
	confidence := 0.5 // Heuristic confidence

	switch platform {
	case "linkedin":
		// LinkedIn best practices: Tuesday-Thursday, 10:00-14:00 UTC
		// Find next Tuesday-Thursday in that time range
		targetDays := []time.Weekday{time.Tuesday, time.Wednesday, time.Thursday}
		targetHours := []int{10, 11, 12, 13} // 10:00-13:00 UTC

		// Find the next suitable time
		for days := 0; days < 7; days++ {
			checkTime := now.AddDate(0, 0, days)
			weekday := checkTime.Weekday()

			// Check if it's a target weekday
			isTargetDay := false
			for _, targetDay := range targetDays {
				if weekday == targetDay {
					isTargetDay = true
					break
				}
			}

			if isTargetDay {
				// If it's today, make sure we pick a future hour
				if days == 0 {
					for _, hour := range targetHours {
						if hour > now.Hour() {
							suggestedTime = time.Date(
								checkTime.Year(), checkTime.Month(), checkTime.Day(),
								hour, 0, 0, 0, time.UTC,
							)
							break
						}
					}
				} else {
					// Pick the first target hour for future days
					suggestedTime = time.Date(
						checkTime.Year(), checkTime.Month(), checkTime.Day(),
						targetHours[0], 0, 0, 0, time.UTC,
					)
				}

				if !suggestedTime.IsZero() {
					break
				}
			}
		}

		// Fallback to next Tuesday 10:00 if no suitable time found
		if suggestedTime.IsZero() {
			daysUntilTuesday := (int(time.Tuesday) - int(now.Weekday()) + 7) % 7
			if daysUntilTuesday == 0 {
				daysUntilTuesday = 7 // Next Tuesday
			}
			suggestedTime = time.Date(
				now.Year(), now.Month(), now.Day()+daysUntilTuesday,
				10, 0, 0, 0, time.UTC,
			)
		}

	case "facebook", "instagram":
		// Social media best practices: 1:00-3:00 PM on weekdays
		suggestedTime = s.getNextWeekdayTime(now, 13) // 1:00 PM UTC
		confidence = 0.4

	case "twitter":
		// Twitter best practices: 9:00 AM - 12:00 PM on weekdays
		suggestedTime = s.getNextWeekdayTime(now, 9) // 9:00 AM UTC
		confidence = 0.4

	default:
		// Default fallback: next business day at 10:00 AM
		suggestedTime = s.getNextWeekdayTime(now, 10)
		confidence = 0.3
	}

	s.logger.Info("🔮 Fallback time generated",
		zap.String("platform", platform),
		zap.Time("suggested_time", suggestedTime),
		zap.Float64("confidence", confidence))

	return suggestedTime, confidence, nil
}

func (s *bestTimeService) getNextWeekdayTime(from time.Time, hour int) time.Time {
	// Find next weekday (Monday-Friday) at specified hour
	for days := 0; days < 7; days++ {
		checkTime := from.AddDate(0, 0, days)
		weekday := checkTime.Weekday()

		// Check if it's a weekday
		if weekday >= time.Monday && weekday <= time.Friday {
			// If it's today, make sure the hour is in the future
			if days == 0 && from.Hour() >= hour {
				continue // Try next day
			}

			return time.Date(
				checkTime.Year(), checkTime.Month(), checkTime.Day(),
				hour, 0, 0, 0, time.UTC,
			)
		}
	}

	// Fallback: next Monday at specified hour
	daysUntilMonday := (int(time.Monday) - int(from.Weekday()) + 7) % 7
	if daysUntilMonday == 0 {
		daysUntilMonday = 7
	}

	return time.Date(
		from.Year(), from.Month(), from.Day()+daysUntilMonday,
		hour, 0, 0, 0, time.UTC,
	)
}