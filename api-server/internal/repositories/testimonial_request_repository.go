// internal/repositories/mailing_repository.go
package repositories

import (
	"context"
	"database/sql"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/ifeanyidike/cenphi/internal/models"
)

// testimonialRequestRepository handles database operations for email system
type TestimonialRequestRepository interface {
	// Email requests
	CreateEmailRequest(ctx context.Context, req *models.EmailRequest) error
	GetEmailRequest(ctx context.Context, id string) (*models.EmailRequest, error)
	GetEmailRequestByToken(ctx context.Context, token string) (*models.EmailRequest, error)
	UpdateEmailStatus(ctx context.Context, id string, status string, timestamp *time.Time) error
	ListEmailRequests(ctx context.Context, workspaceID string, limit, offset int) ([]*models.EmailRequest, error)

	// Email logs
	CreateEmailLog(ctx context.Context, log *models.EmailLog) error
	GetEmailLogs(ctx context.Context, requestID string) ([]*models.EmailLog, error)

	// Templates
	GetTemplate(ctx context.Context, name string) (*models.EmailTemplate, error)
	CreateTemplate(ctx context.Context, template *models.EmailTemplate) error
	UpdateTemplate(ctx context.Context, template *models.EmailTemplate) error
	ListTemplates(ctx context.Context) ([]*models.EmailTemplate, error)
}

type testimonialRequestRepository struct {
	db DB
}

func NewTestimonialRequestRepository(db *sql.DB) TestimonialRequestRepository {
	return &testimonialRequestRepository{
		db: db,
	}
}

// Email Requests
func (r *testimonialRequestRepository) CreateEmailRequest(ctx context.Context, req *models.EmailRequest) error {
	query := `
		INSERT INTO email_requests (
			id, workspace_id, contact_name, contact_email, company_name,
			subject, custom_message, template_name, collection_url, tracking_token,
			status, provider_message_id, provider_response, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
	`

	_, err := r.db.ExecContext(ctx, query,
		req.ID, req.WorkspaceID, req.ContactName, req.ContactEmail, req.CompanyName,
		req.Subject, req.CustomMessage, req.TemplateName, req.CollectionURL, req.TrackingToken,
		req.Status, req.ProviderMessageID, req.ProviderResponse, req.CreatedAt, req.UpdatedAt,
	)

	return err
}

func (r *testimonialRequestRepository) GetEmailRequest(ctx context.Context, id string) (*models.EmailRequest, error) {
	query := `
		SELECT id, workspace_id, contact_name, contact_email, company_name,
			   subject, custom_message, template_name, collection_url, tracking_token,
			   status, sent_at, opened_at, clicked_at, responded_at,
			   provider_message_id, provider_response, created_at, updated_at
		FROM email_requests WHERE id = $1
	`

	var req models.EmailRequest
	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&req.ID, &req.WorkspaceID, &req.ContactName, &req.ContactEmail, &req.CompanyName,
		&req.Subject, &req.CustomMessage, &req.TemplateName, &req.CollectionURL, &req.TrackingToken,
		&req.Status, &req.SentAt, &req.OpenedAt, &req.ClickedAt, &req.RespondedAt,
		&req.ProviderMessageID, &req.ProviderResponse, &req.CreatedAt, &req.UpdatedAt,
	)

	if err != nil {
		return nil, err
	}

	return &req, nil
}

func (r *testimonialRequestRepository) GetEmailRequestByToken(ctx context.Context, token string) (*models.EmailRequest, error) {
	query := `
		SELECT id, workspace_id, contact_name, contact_email, company_name,
			   subject, custom_message, template_name, collection_url, tracking_token,
			   status, sent_at, opened_at, clicked_at, responded_at,
			   provider_message_id, provider_response, created_at, updated_at
		FROM email_requests WHERE tracking_token = $1
	`

	var req models.EmailRequest
	err := r.db.QueryRowContext(ctx, query, token).Scan(
		&req.ID, &req.WorkspaceID, &req.ContactName, &req.ContactEmail, &req.CompanyName,
		&req.Subject, &req.CustomMessage, &req.TemplateName, &req.CollectionURL, &req.TrackingToken,
		&req.Status, &req.SentAt, &req.OpenedAt, &req.ClickedAt, &req.RespondedAt,
		&req.ProviderMessageID, &req.ProviderResponse, &req.CreatedAt, &req.UpdatedAt,
	)

	if err != nil {
		return nil, err
	}

	return &req, nil
}

func (r *testimonialRequestRepository) UpdateEmailStatus(ctx context.Context, idOrToken string, status string, timestamp *time.Time) error {
	var query string
	var args []interface{}

	// Determine if this is an ID (UUID format) or token (hex string)
	// UUIDs contain hyphens, tokens don't
	isUUID := strings.Contains(idOrToken, "-")

	var whereClause string
	if isUUID {
		whereClause = "id = $3"
	} else {
		whereClause = "tracking_token = $3"
	}

	// Build dynamic query based on status
	switch status {
	case models.EmailStatusSent:
		query = fmt.Sprintf("UPDATE email_requests SET status = $1, sent_at = $2, updated_at = CURRENT_TIMESTAMP WHERE %s", whereClause)
		args = []interface{}{status, timestamp, idOrToken}
	case models.EmailStatusDelivered:
		query = fmt.Sprintf("UPDATE email_requests SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE %s", whereClause)
		args = []interface{}{status, idOrToken}
	case models.EmailStatusOpened:
		query = fmt.Sprintf("UPDATE email_requests SET status = $1, opened_at = $2, updated_at = CURRENT_TIMESTAMP WHERE %s", whereClause)
		args = []interface{}{status, timestamp, idOrToken}
	case models.EmailStatusClicked:
		query = fmt.Sprintf("UPDATE email_requests SET status = $1, clicked_at = $2, updated_at = CURRENT_TIMESTAMP WHERE %s", whereClause)
		args = []interface{}{status, timestamp, idOrToken}
	case models.EmailStatusResponded:
		query = fmt.Sprintf("UPDATE email_requests SET status = $1, responded_at = $2, updated_at = CURRENT_TIMESTAMP WHERE %s", whereClause)
		args = []interface{}{status, timestamp, idOrToken}
	default:
		query = fmt.Sprintf("UPDATE email_requests SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE %s", whereClause)
		args = []interface{}{status, idOrToken}
	}

	_, err := r.db.ExecContext(ctx, query, args...)
	return err
}

func (r *testimonialRequestRepository) ListEmailRequests(ctx context.Context, workspaceID string, limit, offset int) ([]*models.EmailRequest, error) {
	query := `
		SELECT id, workspace_id, contact_name, contact_email, company_name,
			   subject, custom_message, template_name, collection_url, tracking_token,
			   status, sent_at, opened_at, clicked_at, responded_at,
			   provider_message_id, provider_response, created_at, updated_at
		FROM email_requests 
		WHERE workspace_id = $1
		ORDER BY created_at DESC
		LIMIT $2 OFFSET $3
	`

	rows, err := r.db.QueryContext(ctx, query, workspaceID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var requests []*models.EmailRequest
	for rows.Next() {
		var req models.EmailRequest
		err := rows.Scan(
			&req.ID, &req.WorkspaceID, &req.ContactName, &req.ContactEmail, &req.CompanyName,
			&req.Subject, &req.CustomMessage, &req.TemplateName, &req.CollectionURL, &req.TrackingToken,
			&req.Status, &req.SentAt, &req.OpenedAt, &req.ClickedAt, &req.RespondedAt,
			&req.ProviderMessageID, &req.ProviderResponse, &req.CreatedAt, &req.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		requests = append(requests, &req)
	}

	return requests, nil
}

// Email Logs
func (r *testimonialRequestRepository) CreateEmailLog(ctx context.Context, log *models.EmailLog) error {
	query := `
		INSERT INTO email_logs (
			id, email_request_id, provider, provider_message_id,
			status, event_type, error_message, created_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
	`

	_, err := r.db.ExecContext(ctx, query,
		log.ID, log.EmailRequestID, log.Provider, log.ProviderMessageID,
		log.Status, log.EventType, log.ErrorMessage, log.CreatedAt,
	)

	return err
}

func (r *testimonialRequestRepository) GetEmailLogs(ctx context.Context, requestID string) ([]*models.EmailLog, error) {
	query := `
		SELECT id, email_request_id, provider, provider_message_id,
			   status, event_type, error_message, created_at
		FROM email_logs 
		WHERE email_request_id = $1
		ORDER BY created_at DESC
	`

	rows, err := r.db.QueryContext(ctx, query, requestID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var logs []*models.EmailLog
	for rows.Next() {
		var log models.EmailLog
		err := rows.Scan(
			&log.ID, &log.EmailRequestID, &log.Provider, &log.ProviderMessageID,
			&log.Status, &log.EventType, &log.ErrorMessage, &log.CreatedAt,
		)
		if err != nil {
			return nil, err
		}
		logs = append(logs, &log)
	}

	return logs, nil
}

// Templates
func (r *testimonialRequestRepository) GetTemplate(ctx context.Context, name string) (*models.EmailTemplate, error) {
	query := `
		SELECT id, name, subject, html_content, text_content, variables, is_default, created_at, updated_at
		FROM email_templates WHERE name = $1
	`

	var tmpl models.EmailTemplate
	err := r.db.QueryRowContext(ctx, query, name).Scan(
		&tmpl.ID, &tmpl.Name, &tmpl.Subject, &tmpl.HTMLContent, &tmpl.TextContent,
		&tmpl.Variables, &tmpl.IsDefault, &tmpl.CreatedAt, &tmpl.UpdatedAt,
	)

	if err != nil {
		return nil, err
	}

	return &tmpl, nil
}

func (r *testimonialRequestRepository) CreateTemplate(ctx context.Context, template *models.EmailTemplate) error {
	query := `
		INSERT INTO email_templates (
			id, name, subject, html_content, text_content, variables, is_default, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		ON CONFLICT (name) DO UPDATE SET
			subject = EXCLUDED.subject,
			html_content = EXCLUDED.html_content,
			text_content = EXCLUDED.text_content,
			variables = EXCLUDED.variables,
			is_default = EXCLUDED.is_default,
			updated_at = EXCLUDED.updated_at
	`

	if template.ID == uuid.Nil {
		template.ID = uuid.New()
	}

	_, err := r.db.ExecContext(ctx, query,
		template.ID, template.Name, template.Subject, template.HTMLContent, template.TextContent,
		template.Variables, template.IsDefault, template.CreatedAt, template.UpdatedAt,
	)

	return err
}

func (r *testimonialRequestRepository) UpdateTemplate(ctx context.Context, template *models.EmailTemplate) error {
	query := `
		UPDATE email_templates SET
			subject = $2, html_content = $3, text_content = $4, variables = $5,
			is_default = $6, updated_at = $7
		WHERE id = $1
	`

	template.UpdatedAt = time.Now()

	_, err := r.db.ExecContext(ctx, query,
		template.ID, template.Subject, template.HTMLContent, template.TextContent,
		template.Variables, template.IsDefault, template.UpdatedAt,
	)

	return err
}

func (r *testimonialRequestRepository) ListTemplates(ctx context.Context) ([]*models.EmailTemplate, error) {
	query := `
		SELECT id, name, subject, html_content, text_content, variables, is_default, created_at, updated_at
		FROM email_templates ORDER BY name
	`

	rows, err := r.db.QueryContext(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var templates []*models.EmailTemplate
	for rows.Next() {
		var tmpl models.EmailTemplate
		err := rows.Scan(
			&tmpl.ID, &tmpl.Name, &tmpl.Subject, &tmpl.HTMLContent, &tmpl.TextContent,
			&tmpl.Variables, &tmpl.IsDefault, &tmpl.CreatedAt, &tmpl.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		templates = append(templates, &tmpl)
	}

	return templates, nil
}
