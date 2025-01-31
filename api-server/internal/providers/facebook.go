// internal/repositories/providers/facebook.go
package providers

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/ifeanyidike/cenphi/internal/models"
)

type FacebookConfig struct {
	AccessToken string
	PageID      string
	Timeout     time.Duration
	BaseURL     string
}

type FacebookProvider struct {
	config     FacebookConfig
	httpClient *http.Client
}

func NewFacebookProvider(cfg FacebookConfig) *FacebookProvider {
	return &FacebookProvider{
		config: cfg,
		httpClient: &http.Client{
			Timeout: cfg.Timeout,
		},
	}
}

func (p *FacebookProvider) Fetch(ctx context.Context) ([]models.Testimonial, error) {
	url := fmt.Sprintf("%s/%s/ratings?access_token=%s",
		p.config.BaseURL,
		p.config.PageID,
		p.config.AccessToken,
	)

	req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		return nil, fmt.Errorf("facebook request creation failed: %w", err)
	}

	resp, err := p.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("facebook API request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("facebook API returned status %d", resp.StatusCode)
	}

	var result struct {
		Data []struct {
			ID          string    `json:"id"`
			ReviewText  string    `json:"review_text"`
			Rating      float32   `json:"rating"`
			CreatedTime time.Time `json:"created_time"`
			Reviewer    struct {
				Name string `json:"name"`
			} `json:"reviewer"`
		} `json:"data"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to decode facebook response: %w", err)
	}

	var testimonials []models.Testimonial
	for _, review := range result.Data {
		testimonials = append(testimonials, models.Testimonial{
			CustomerName: review.Reviewer.Name,
			Content:      review.ReviewText,
			Rating:       &review.Rating,
			SourceData: map[string]interface{}{
				"source":  p.SourceName(),
				"page_id": p.config.PageID,
			},
			CreatedAt: review.CreatedTime,
		})
	}

	return testimonials, nil
}

func (p *FacebookProvider) SourceName() string {
	return "facebook"
}
