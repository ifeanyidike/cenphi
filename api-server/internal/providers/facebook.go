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

type FacebookProvider struct {
	accessToken string
	pageID      string
	httpClient  *http.Client
}

func NewFacebookProvider(accessToken, pageID string) *FacebookProvider {
	return &FacebookProvider{
		accessToken: accessToken,
		pageID:      pageID,
		httpClient: &http.Client{
			Timeout: 10 * time.Second,
		},
	}
}

func (p *FacebookProvider) Fetch(ctx context.Context) ([]models.Testimonial, error) {
	url := fmt.Sprintf("https://graph.facebook.com/v19.0/%s/ratings?access_token=%s",
		p.pageID,
		p.accessToken,
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
				"source":  p.Name(),
				"page_id": p.pageID,
			},
			CreatedAt: review.CreatedTime,
		})
	}

	return testimonials, nil
}

func (p *FacebookProvider) Name() string {
	return "facebook"
}

func (f *FacebookProvider) RateLimit() int            { return 200 } // 200/hr
func (f *FacebookProvider) RateWindow() time.Duration { return time.Hour }
func (f *FacebookProvider) Schedule() string          { return "@hourly" }
func (f *FacebookProvider) IsConfigured() bool        { return f.accessToken != "" && f.pageID != "" }
