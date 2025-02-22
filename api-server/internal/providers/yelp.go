// internal/providers/yelp/yelp.go
package providers

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/ifeanyidike/cenphi/internal/models"
)

type YelpProvider struct {
	apiKey     string
	businessID string
	httpClient *http.Client
}

func NewYelpProvider(apiKey, businessID string) *YelpProvider {
	return &YelpProvider{
		apiKey:     apiKey,
		businessID: businessID,
		httpClient: &http.Client{
			Timeout: 10 * time.Second,
		},
	}
}

func (y *YelpProvider) Name() string { return "yelp" }

func (y *YelpProvider) Fetch(ctx context.Context) ([]models.Testimonial, error) {
	url := fmt.Sprintf("https://api.yelp.com/v3/businesses/%s/reviews", y.businessID)

	req, _ := http.NewRequestWithContext(ctx, "GET", url, nil)
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", y.apiKey))

	resp, err := y.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("yelp API request failed: %w", err)
	}
	defer resp.Body.Close()

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
			Content:          review.Text,
			Rating:           &review.Rating,
			CustomerName:     review.User.Name,
			CreatedAt:        review.TimeCreated,
			Type:             models.TestimonialTypeText,
			CollectionMethod: models.CollectionAPI,
			SourceData: map[string]interface{}{
				"yelp_review_id":   review.ID,
				"source":           y.Name(),
				"yelp_business_id": y.businessID,
			},
		})
	}

	return testimonials, nil
}

func (y *YelpProvider) RateLimit() int            { return 5000 } // Daily limit
func (y *YelpProvider) RateWindow() time.Duration { return 24 * time.Hour }
func (y *YelpProvider) Schedule() string          { return "@daily" }
func (y *YelpProvider) IsConfigured() bool        { return y.apiKey != "" && y.businessID != "" }
