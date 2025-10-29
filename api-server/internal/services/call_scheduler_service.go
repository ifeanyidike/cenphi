// internal/services/call_scheduler_service.go
package services

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/ifeanyidike/cenphi/internal/models"
	"github.com/ifeanyidike/cenphi/internal/queue"
	"github.com/ifeanyidike/cenphi/internal/repositories"
	"go.uber.org/zap"
)

// CallSchedulerService handles scheduling and execution of voice testimonial calls
type CallSchedulerService struct {
	scheduledCallRepo   models.ScheduledCallRepository
	testimonialRepo     repositories.TestimonialRepository
	jobRepo             repositories.JobRepository
	queueService        queue.Service
	vapiService         *VapiService
	twilioService       *TwilioVoiceService
	db                  *sql.DB
	logger              *zap.Logger
}

// NewCallSchedulerService creates a new call scheduler service
func NewCallSchedulerService(
	scheduledCallRepo models.ScheduledCallRepository,
	testimonialRepo repositories.TestimonialRepository,
	jobRepo repositories.JobRepository,
	queueService queue.Service,
	vapiService *VapiService,
	twilioService *TwilioVoiceService,
	db *sql.DB,
	logger *zap.Logger,
) *CallSchedulerService {
	return &CallSchedulerService{
		scheduledCallRepo: scheduledCallRepo,
		testimonialRepo:   testimonialRepo,
		jobRepo:           jobRepo,
		queueService:      queueService,
		vapiService:       vapiService,
		twilioService:     twilioService,
		db:                db,
		logger:            logger,
	}
}

// ScheduleCall creates a scheduled call record for later execution
func (cs *CallSchedulerService) ScheduleCall(ctx context.Context, req VoiceTestimonialRequest, workspaceID uuid.UUID, testimonialID uuid.UUID) (*models.ScheduledCall, error) {
	// Parse the scheduled time
	scheduledTime, err := cs.parseScheduledTime(req.PreferredCallTime, req.Timezone)
	if err != nil {
		return nil, fmt.Errorf("invalid scheduled time: %w", err)
	}

	// Determine provider based on phone number
	provider := "vapi" // Default to Vapi
	if cs.twilioService.ShouldUseTwilio(req.CustomerPhone) {
		provider = "twilio"
	}

	// Create scheduled call record
	scheduledCall := &models.ScheduledCall{
		ID:                uuid.New(),
		TestimonialID:     testimonialID,
		WorkspaceID:       workspaceID,
		CustomerName:      req.CustomerName,
		CustomerEmail:     &req.CustomerEmail,
		CustomerPhone:     req.CustomerPhone,
		Company:           &req.Company,
		ScheduledAt:       scheduledTime,
		Timezone:          req.Timezone,
		PreferredCallTime: &req.PreferredCallTime,
		Provider:          provider,
		AdditionalNotes:   &req.AdditionalNotes,
		Status:            "scheduled",
		AttemptCount:      0,
		MaxAttempts:       3,
		CreatedAt:         time.Now(),
		UpdatedAt:         time.Now(),
		Metadata: models.JSONMap{
			"rating":       req.Rating,
			"initial_text": req.InitialText,
		},
	}

	// Save to database
	if err := cs.scheduledCallRepo.Create(ctx, scheduledCall, cs.db); err != nil {
		return nil, fmt.Errorf("failed to create scheduled call: %w", err)
	}

	cs.logger.Info("Call scheduled successfully",
		zap.String("scheduled_call_id", scheduledCall.ID.String()),
		zap.String("testimonial_id", testimonialID.String()),
		zap.String("provider", provider),
		zap.Time("scheduled_at", scheduledTime),
		zap.String("customer_phone", req.CustomerPhone))

	return scheduledCall, nil
}

// ExecutePendingCalls executes calls that are due
func (cs *CallSchedulerService) ExecutePendingCalls(ctx context.Context) error {
	// Fetch calls that are due for execution
	dueCalls, err := cs.scheduledCallRepo.FetchDueCalls(ctx, time.Now(), 10, cs.db)
	if err != nil {
		return fmt.Errorf("failed to fetch due calls: %w", err)
	}

	if len(dueCalls) == 0 {
		cs.logger.Debug("No due calls to execute")
		return nil
	}

	cs.logger.Info("Executing pending calls", zap.Int("count", len(dueCalls)))

	for _, call := range dueCalls {
		if err := cs.executeCall(ctx, call); err != nil {
			cs.logger.Error("Failed to execute call",
				zap.String("call_id", call.ID.String()),
				zap.Error(err))

			// Mark call as failed and increment attempt count
			call.Status = "failed"
			call.AttemptCount++
			call.UpdatedAt = time.Now()

			if call.AttemptCount >= call.MaxAttempts {
				cs.logger.Warn("Call reached maximum attempts",
					zap.String("call_id", call.ID.String()),
					zap.Int("attempts", call.AttemptCount))
			}

			cs.scheduledCallRepo.Update(ctx, call, call.ID, cs.db)
			continue
		}
	}

	return nil
}

// executeCall executes a single scheduled call
func (cs *CallSchedulerService) executeCall(ctx context.Context, call *models.ScheduledCall) error {
	cs.logger.Info("Executing scheduled call",
		zap.String("call_id", call.ID.String()),
		zap.String("provider", call.Provider),
		zap.String("customer_phone", call.CustomerPhone))

	// Update call status to in_progress
	call.Status = "in_progress"
	call.AttemptCount++
	call.ExecutedAt = &[]time.Time{time.Now()}[0]
	call.UpdatedAt = time.Now()

	if err := cs.scheduledCallRepo.Update(ctx, call, call.ID, cs.db); err != nil {
		return fmt.Errorf("failed to update call status: %w", err)
	}

	// Create voice call request
	req := VoiceCallRequest{
		TestimonialID:     call.TestimonialID,
		CustomerName:      call.CustomerName,
		CustomerEmail:     *call.CustomerEmail,
		CustomerPhone:     call.CustomerPhone,
		Company:           *call.Company,
		PreferredCallTime: "now", // Execute immediately
		Timezone:          call.Timezone,
		AdditionalNotes:   *call.AdditionalNotes,
	}

	var callID *string
	var err error

	// Execute call based on provider
	switch call.Provider {
	case "twilio":
		callID, err = cs.twilioService.InitiateInternationalCall(ctx, req)
	case "vapi":
		callID, err = cs.vapiService.ScheduleVoiceCall(ctx, req)
	default:
		return fmt.Errorf("unknown provider: %s", call.Provider)
	}

	if err != nil {
		return fmt.Errorf("failed to initiate call with %s: %w", call.Provider, err)
	}

	// Update call with call ID
	call.CallID = callID
	call.Status = "completed" // Mark as completed since call was initiated
	call.UpdatedAt = time.Now()

	if err := cs.scheduledCallRepo.Update(ctx, call, call.ID, cs.db); err != nil {
		cs.logger.Error("Failed to update call with call ID", zap.Error(err))
		// Don't return error since call was initiated successfully
	}

	cs.logger.Info("Scheduled call executed successfully",
		zap.String("call_id", call.ID.String()),
		zap.String("provider", call.Provider),
		zap.String("external_call_id", *callID))

	return nil
}

// parseScheduledTime parses a time string in a given timezone
func (cs *CallSchedulerService) parseScheduledTime(timeStr, timezone string) (time.Time, error) {
	// Load timezone
	loc, err := time.LoadLocation(timezone)
	if err != nil {
		cs.logger.Warn("Invalid timezone, using UTC", zap.String("timezone", timezone))
		loc = time.UTC
	}

	// Try parsing different time formats
	formats := []string{
		"2006-01-02T15:04:05", // ISO format without timezone
		"2006-01-02 15:04:05", // Standard format
		"2006-01-02T15:04",    // ISO format without seconds
		"2006-01-02 15:04",    // Standard format without seconds
		"01/02/2006 15:04",    // US format
		"01/02/2006 3:04 PM",  // US format with AM/PM
	}

	for _, format := range formats {
		if t, err := time.ParseInLocation(format, timeStr, loc); err == nil {
			return t, nil
		}
	}

	return time.Time{}, fmt.Errorf("unable to parse time: %s", timeStr)
}

// StartScheduler starts the background scheduler that executes pending calls
func (cs *CallSchedulerService) StartScheduler(ctx context.Context) {
	ticker := time.NewTicker(1 * time.Minute) // Check every minute
	defer ticker.Stop()

	cs.logger.Info("Call scheduler started")

	for {
		select {
		case <-ctx.Done():
			cs.logger.Info("Call scheduler stopped")
			return
		case <-ticker.C:
			if err := cs.ExecutePendingCalls(ctx); err != nil {
				cs.logger.Error("Error executing pending calls", zap.Error(err))
			}
		}
	}
}

// CancelScheduledCall cancels a scheduled call
func (cs *CallSchedulerService) CancelScheduledCall(ctx context.Context, callID uuid.UUID) error {
	call, err := cs.scheduledCallRepo.FetchByID(ctx, callID, cs.db)
	if err != nil {
		return fmt.Errorf("failed to fetch scheduled call: %w", err)
	}

	if call.Status != "scheduled" {
		return fmt.Errorf("cannot cancel call with status: %s", call.Status)
	}

	call.Status = "cancelled"
	call.UpdatedAt = time.Now()

	return cs.scheduledCallRepo.Update(ctx, call, callID, cs.db)
}

// RescheduleCall reschedules an existing call
func (cs *CallSchedulerService) RescheduleCall(ctx context.Context, callID uuid.UUID, newTime time.Time) error {
	call, err := cs.scheduledCallRepo.FetchByID(ctx, callID, cs.db)
	if err != nil {
		return fmt.Errorf("failed to fetch scheduled call: %w", err)
	}

	if call.Status != "scheduled" {
		return fmt.Errorf("cannot reschedule call with status: %s", call.Status)
	}

	call.ScheduledAt = newTime
	call.UpdatedAt = time.Now()

	return cs.scheduledCallRepo.Update(ctx, call, callID, cs.db)
}