// internal/repositories/providers/trustpilot.go
package providers

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/ifeanyidike/cenphi/internal/models"
)

type TrustpilotConfig struct {
	APIKey     string
	BusinessID string
	Timeout    time.Duration
	BaseURL    string
}

type TrustpilotProvider struct {
	config     TrustpilotConfig
	httpClient *http.Client
}

func NewTrustpilotProvider(cfg TrustpilotConfig) *TrustpilotProvider {
	return &TrustpilotProvider{
		config: cfg,
		httpClient: &http.Client{
			Timeout: cfg.Timeout,
		},
	}
}

func (p *TrustpilotProvider) Fetch(ctx context.Context) ([]models.Testimonial, error) {
	url := fmt.Sprintf("%s/business-units/%s/reviews", p.config.BaseURL, p.config.BusinessID)

	req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		return nil, fmt.Errorf("trustpilot request creation failed: %w", err)
	}
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", p.config.APIKey))
	req.Header.Set("Accept", "application/json")

	resp, err := p.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("trustpilot API request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("trustpilot API returned status %d", resp.StatusCode)
	}

	var result struct {
		Reviews []struct {
			ID        string    `json:"id"`
			Text      string    `json:"text"`
			Rating    float32   `json:"stars"`
			CreatedAt time.Time `json:"createdAt"`
			Consumer  struct {
				DisplayName string `json:"displayName"`
			} `json:"consumer"`
		} `json:"reviews"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to decode trustpilot response: %w", err)
	}

	var testimonials []models.Testimonial
	for _, review := range result.Reviews {
		testimonials = append(testimonials, models.Testimonial{
			CustomerName: review.Consumer.DisplayName,
			Content:      review.Text,
			Rating:       &review.Rating,
			SourceData: map[string]interface{}{
				"source":               p.SourceName(),
				"trustpilot_review_id": review.ID,
			},
			CreatedAt: review.CreatedAt,
		})
	}

	return testimonials, nil
}

func (p *TrustpilotProvider) SourceName() string {
	return "trustpilot"
}
