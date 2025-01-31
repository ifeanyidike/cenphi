// internal/repositories/providers/yelp.go
package providers

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/ifeanyidike/cenphi/internal/models"
)

type YelpConfig struct {
	APIKey     string
	BusinessID string
	Timeout    time.Duration
	BaseURL    string
}

type YelpProvider struct {
	config     YelpConfig
	httpClient *http.Client
}

func NewYelpProvider(cfg YelpConfig) *YelpProvider {
	return &YelpProvider{
		config: cfg,
		httpClient: &http.Client{
			Timeout: cfg.Timeout,
		},
	}
}

func (p *YelpProvider) Fetch(ctx context.Context) ([]models.Testimonial, error) {
	url := fmt.Sprintf("%s/businesses/%s/reviews", p.config.BaseURL, p.config.BusinessID)

	req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		return nil, fmt.Errorf("yelp request creation failed: %w", err)
	}
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", p.config.APIKey))
	req.Header.Set("Accept", "application/json")

	resp, err := p.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("yelp API request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("yelp API returned status %d", resp.StatusCode)
	}

	var result struct {
		Reviews []struct {
			ID          string    `json:"id"`
			Text        string    `json:"text"`
			Rating      float32   `json:"rating"`
			TimeCreated time.Time `json:"time_created"`
			User        struct {
				Name string `json:"name"`
			} `json:"user"`
		} `json:"reviews"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to decode yelp response: %w", err)
	}

	var testimonials []models.Testimonial
	for _, review := range result.Reviews {
		testimonials = append(testimonials, models.Testimonial{
			CustomerName: review.User.Name,
			Content:      review.Text,
			Rating:       &review.Rating,
			SourceData: map[string]interface{}{
				"source":           p.SourceName(),
				"yelp_business_id": p.config.BusinessID,
			},
			CreatedAt: review.TimeCreated,
		})
	}

	return testimonials, nil
}

func (p *YelpProvider) SourceName() string {
	return "yelp"
}
