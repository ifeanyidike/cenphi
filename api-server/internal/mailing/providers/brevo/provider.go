// internal/mailing/providers/brevo/provider.go
package brevo

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/ifeanyidike/cenphi/internal/mailing"
	"github.com/ifeanyidike/cenphi/internal/models"
	"go.uber.org/zap"
)

type Provider struct {
	apiKey     string
	httpClient *http.Client
	logger     *zap.Logger
}

type brevoRequest struct {
	Sender      brevoRecipient    `json:"sender"`
	To          []brevoRecipient  `json:"to"`
	Subject     string            `json:"subject"`
	HTMLContent string            `json:"htmlContent,omitempty"`
	TextContent string            `json:"textContent,omitempty"`
	Headers     map[string]string `json:"headers,omitempty"`
}

type brevoRecipient struct {
	Email string `json:"email"`
	Name  string `json:"name,omitempty"`
}

type brevoResponse struct {
	MessageID string `json:"messageId"`
}

func NewProvider(apiKey string, logger *zap.Logger) Provider {
	return Provider{
		apiKey: apiKey,
		httpClient: &http.Client{
			Timeout: 60 * time.Second,
		},
		logger: logger,
	}
}

func (p Provider) SendEmail(ctx context.Context, req *mailing.ProviderEmailRequest) (*models.EmailResponse, error) {
	brevoReq := brevoRequest{
		Sender: brevoRecipient{
			Email: req.From.Email,
			Name:  req.From.Name,
		},
		To: []brevoRecipient{
			{
				Email: req.To.Email,
				Name:  req.To.Name,
			},
		},
		Subject:     req.Subject,
		HTMLContent: req.HTMLContent,
		TextContent: req.TextContent,
		Headers: map[string]string{
			"X-Tracking-ID": req.TrackingID,
		},
	}

	jsonData, err := json.Marshal(brevoReq)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	httpReq, err := http.NewRequestWithContext(ctx, "POST", "https://api.brevo.com/v3/smtp/email", bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	httpReq.Header.Set("Accept", "application/json")
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("api-key", p.apiKey)

	resp, err := p.httpClient.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		return nil, fmt.Errorf("brevo API error: status %d", resp.StatusCode)
	}

	var brevoResp brevoResponse
	if err := json.NewDecoder(resp.Body).Decode(&brevoResp); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	return &models.EmailResponse{
		MessageID: brevoResp.MessageID,
		Status:    models.EmailStatusSent,
		Provider:  "brevo",
		Metadata: map[string]interface{}{
			"brevo_message_id": brevoResp.MessageID,
		},
		SentAt: time.Now(),
	}, nil
}

func (p Provider) ValidateConfiguration(ctx context.Context) error {
	req, err := http.NewRequestWithContext(ctx, "GET", "https://api.brevo.com/v3/account", nil)
	if err != nil {
		return fmt.Errorf("failed to create validation request: %w", err)
	}

	req.Header.Set("Accept", "application/json")
	req.Header.Set("api-key", p.apiKey)

	resp, err := p.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("failed to validate Brevo API key: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode == 401 {
		return fmt.Errorf("invalid Brevo API key")
	}
	if resp.StatusCode >= 400 {
		return fmt.Errorf("brevo API validation failed with status %d", resp.StatusCode)
	}

	return nil
}

func (p Provider) GetProviderName() string {
	return "brevo"
}
