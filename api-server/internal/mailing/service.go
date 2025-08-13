// internal/mailing/service.go
package mailing

import (
	"context"
	"crypto/rand"
	"database/sql"
	"encoding/hex"
	"fmt"
	"log"
	"time"

	"github.com/google/uuid"
	"github.com/ifeanyidike/cenphi/internal/models"
	"github.com/ifeanyidike/cenphi/internal/repositories"
	"go.uber.org/zap"
)

type Service struct {
	provider   Provider
	renderer   TemplateRenderer
	repository repositories.TestimonialRequestRepository
	logger     *zap.Logger
	db         *sql.DB
	baseURL    string

	// Default sender info
	defaultFromName  string
	defaultFromEmail string
}

type Config struct {
	BaseURL          string
	DefaultFromName  string
	DefaultFromEmail string
}

func NewService(
	provider Provider,
	renderer TemplateRenderer,
	repository repositories.TestimonialRequestRepository,
	logger *zap.Logger,
	db *sql.DB,
	config Config,
) Service {
	return Service{
		provider:         provider,
		renderer:         renderer,
		repository:       repository,
		logger:           logger,
		db:               db,
		baseURL:          config.BaseURL,
		defaultFromName:  config.DefaultFromName,
		defaultFromEmail: config.DefaultFromEmail,
	}
}

// SendTestimonialRequest sends a single testimonial collection email
func (s Service) SendTestimonialRequest(ctx context.Context, req models.SendEmailRequest) (*models.EmailResponse, error) {
	// Generate tracking token
	token, err := s.generateTrackingToken()
	if err != nil {
		return nil, fmt.Errorf("failed to generate tracking token: %w", err)
	}

	// Build collection URL
	collectionURL := fmt.Sprintf("%s/collect/%s?token=%s", s.baseURL, req.WorkspaceID, token)

	// Create email request record
	emailReq := &models.EmailRequest{
		ID:            uuid.New(),
		WorkspaceID:   uuid.MustParse(req.WorkspaceID),
		ContactName:   req.ContactName,
		ContactEmail:  req.ContactEmail,
		CompanyName:   req.CompanyName,
		Subject:       "", // Will be set after template rendering
		CustomMessage: req.CustomMessage,
		TemplateName:  req.TemplateName,
		CollectionURL: collectionURL,
		TrackingToken: token,
		Status:        models.EmailStatusPending,
		CreatedAt:     time.Now(),
		UpdatedAt:     time.Now(),
	}

	// Use default template if none specified
	if emailReq.TemplateName == "" {
		emailReq.TemplateName = "testimonial_request"
	}

	// Build enhanced template data using the template builder
	templateData := NewTemplateBuilder(emailReq.WorkspaceID).
		WithRecipient(req.ContactName, req.ContactEmail, req.CompanyName).
		WithSender(s.defaultFromName, req.SenderTitle, req.SenderCompany, req.SenderPhone).
		WithCustomMessage(req.CustomMessage).
		WithProject(req.ProjectName).
		WithUrgency(req.UrgencyLevel).
		WithCollectionURL(collectionURL, token)

	// Apply optional enhancements if provided
	if req.BrandColors != nil {
		templateData.WithBrandColors(req.BrandColors)
	}

	if req.IncentiveDescription != "" {
		templateData.WithIncentive(req.IncentiveDescription)
	}

	if req.TestimonialsCount != "" {
		templateData.WithSocialProof(req.TestimonialsCount)
	}

	// Build final template data
	finalData := templateData.Build()

	// Render email template
	rendered, err := s.renderer.RenderTemplate(emailReq.TemplateName, finalData)
	if err != nil {
		return nil, fmt.Errorf("failed to render template: %w", err)
	}

	emailReq.Subject = rendered.Subject

	// Save to database
	if err := s.repository.CreateEmailRequest(ctx, emailReq); err != nil {
		s.logger.Error("Failed to save email request", zap.Error(err))
		return nil, fmt.Errorf("failed to save email request: %w", err)
	}

	log.Println("contact email", req.ContactEmail)
	log.Println("contact name", req.ContactName)

	// Send via provider
	providerReq := &ProviderEmailRequest{
		To: EmailRecipient{
			Email: req.ContactEmail,
			Name:  req.ContactName,
		},
		From: EmailRecipient{
			Email: s.defaultFromEmail,
			Name:  s.defaultFromName,
		},
		Subject:     rendered.Subject,
		HTMLContent: rendered.HTMLContent,
		TextContent: rendered.TextContent,
		TrackingID:  token,
	}

	response, err := s.provider.SendEmail(ctx, providerReq)
	if err != nil {
		// Update status to failed
		s.repository.UpdateEmailStatus(ctx, emailReq.ID.String(), models.EmailStatusFailed, nil)
		return nil, fmt.Errorf("failed to send email: %w", err)
	}

	// Update email request with provider response
	now := time.Now()
	emailReq.Status = models.EmailStatusSent
	emailReq.SentAt = &now
	emailReq.ProviderMessageID = response.MessageID
	emailReq.ProviderResponse = models.JSONMap(response.Metadata)

	s.repository.UpdateEmailStatus(ctx, emailReq.ID.String(), models.EmailStatusSent, &now)

	// Log the email
	s.logEmail(ctx, emailReq.ID, response, nil)

	s.logger.Info("Email sent successfully",
		zap.String("request_id", emailReq.ID.String()),
		zap.String("message_id", response.MessageID),
		zap.String("contact_email", req.ContactEmail),
		zap.String("provider", response.Provider))

	return response, nil
}

// SendBulkTestimonialRequests sends multiple testimonial collection emails
func (s Service) SendBulkTestimonialRequests(ctx context.Context, req models.BulkEmailRequest) ([]*models.EmailResponse, error) {
	var responses []*models.EmailResponse
	var errors []error

	for _, recipient := range req.Recipients {
		emailReq := models.SendEmailRequest{
			WorkspaceID:          req.WorkspaceID,
			ContactName:          recipient.Name,
			ContactEmail:         recipient.Email,
			CompanyName:          recipient.Company,
			CustomMessage:        req.CustomMessage,
			TemplateName:         req.TemplateName,
			SenderTitle:          req.SenderTitle,
			SenderCompany:        req.SenderCompany,
			SenderPhone:          req.SenderPhone,
			ProjectName:          recipient.ProjectName,  // Individual project context
			CustomerType:         recipient.CustomerType, // Individual customer type
			UrgencyLevel:         req.UrgencyLevel,
			BrandColors:          req.BrandColors,
			IncentiveDescription: req.IncentiveDescription,
			TestimonialsCount:    req.TestimonialsCount,
			TemplateVariation:    req.TemplateVariation,
		}

		response, err := s.SendTestimonialRequest(ctx, emailReq)
		if err != nil {
			s.logger.Error("Failed to send bulk email",
				zap.Error(err),
				zap.String("contact_email", recipient.Email))
			errors = append(errors, err)
			continue
		}

		responses = append(responses, response)

		// Rate limiting - small delay between emails
		time.Sleep(100 * time.Millisecond)
	}

	if len(errors) > 0 {
		return responses, fmt.Errorf("failed to send %d out of %d emails", len(errors), len(req.Recipients))
	}

	return responses, nil
}

// TrackClick tracks when a user clicks the testimonial collection link
func (s Service) TrackClick(ctx context.Context, token string) error {
	now := time.Now()
	err := s.repository.UpdateEmailStatus(ctx, token, models.EmailStatusClicked, &now)
	if err != nil {
		s.logger.Error("Failed to track click", zap.Error(err), zap.String("token", token))
		return err
	}

	s.logger.Info("Click tracked successfully", zap.String("token", token))
	return nil
}

// TrackResponse tracks when a user submits a testimonial
func (s Service) TrackResponse(ctx context.Context, token string) error {
	now := time.Now()
	err := s.repository.UpdateEmailStatus(ctx, token, models.EmailStatusResponded, &now)
	if err != nil {
		s.logger.Error("Failed to track response", zap.Error(err), zap.String("token", token))
		return err
	}

	s.logger.Info("Response tracked successfully", zap.String("token", token))
	return nil
}

// Helper methods

func (s Service) generateTrackingToken() (string, error) {
	bytes := make([]byte, 16)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}

func (s Service) logEmail(ctx context.Context, requestID uuid.UUID, response *models.EmailResponse, err error) {
	log := &models.EmailLog{
		ID:                uuid.New(),
		EmailRequestID:    requestID,
		Provider:          response.Provider,
		ProviderMessageID: response.MessageID,
		Status:            response.Status,
		EventType:         "sent",
		CreatedAt:         time.Now(),
	}

	if err != nil {
		log.Status = models.EmailStatusFailed
		log.EventType = "failed"
		log.ErrorMessage = err.Error()
	}

	if logErr := s.repository.CreateEmailLog(ctx, log); logErr != nil {
		s.logger.Error("Failed to create email log", zap.Error(logErr))
	}
}

// GetEmailRequests retrieves email requests for a workspace
func (s Service) GetEmailRequests(ctx context.Context, workspaceID string, limit, offset int) ([]*models.EmailRequest, error) {
	return s.repository.ListEmailRequests(ctx, workspaceID, limit, offset)
}

// GetEmailRequest retrieves a specific email request
func (s Service) GetEmailRequest(ctx context.Context, requestID string) (*models.EmailRequest, error) {
	return s.repository.GetEmailRequest(ctx, requestID)
}

// GetEmailLogs retrieves logs for a specific email request
func (s Service) GetEmailLogs(ctx context.Context, requestID string) ([]*models.EmailLog, error) {
	return s.repository.GetEmailLogs(ctx, requestID)
}
