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

type TrustpilotProvider struct {
	apiKey     string
	businessID string
	httpClient *http.Client
}

func NewTrustpilotProvider(apiKey, businessID string) *TrustpilotProvider {
	return &TrustpilotProvider{
		apiKey:     apiKey,
		businessID: businessID,
		httpClient: &http.Client{
			Timeout: 10 * time.Second,
		},
	}
}

func (p *TrustpilotProvider) Fetch(ctx context.Context) ([]models.Testimonial, error) {
	url := fmt.Sprintf("https://api.trustpilot.com/v1/business-units/%s/reviews", p.businessID)

	req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		return nil, fmt.Errorf("trustpilot request creation failed: %w", err)
	}
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", p.apiKey))
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
	// for _, review := range result.Reviews {
	// 	testimonials = append(testimonials, models.Testimonial{
	// 		CustomerName: review.Consumer.DisplayName,
	// 		Content:      review.Text,
	// 		Rating:       &review.Rating,
	// 		SourceData: map[string]interface{}{
	// 			"source":               p.Name(),
	// 			"trustpilot_review_id": review.ID,
	// 		},
	// 		CreatedAt: review.CreatedAt,
	// 	})
	// }

	return testimonials, nil
}

func (p *TrustpilotProvider) Name() string {
	return "trustpilot"
}

func (t *TrustpilotProvider) RateLimit() int            { return 100 } // 100/min
func (t *TrustpilotProvider) RateWindow() time.Duration { return time.Minute }
func (t *TrustpilotProvider) Schedule() string          { return "@hourly" }
func (t *TrustpilotProvider) IsConfigured() bool        { return t.apiKey != "" && t.businessID != "" }
