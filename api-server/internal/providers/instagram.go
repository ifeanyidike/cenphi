// internal/repositories/providers/instagram.go
package providers

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/ifeanyidike/cenphi/internal/models"
)

type InstagramProvider struct {
	accessToken string
	userID      string
	httpClient  *http.Client
}

func NewInstagramProvider(accessToken, userID string) *InstagramProvider {
	return &InstagramProvider{
		accessToken: accessToken,
		userID:      userID,
		httpClient: &http.Client{
			Timeout: 10 * time.Second,
		},
	}
}

func (p *InstagramProvider) Fetch(ctx context.Context) ([]models.Testimonial, error) {
	url := fmt.Sprintf("https://graph.instagram.com/v19.0/%s/media?access_token=%s",
		p.userID,
		p.accessToken,
	)

	req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		return nil, fmt.Errorf("instagram request creation failed: %w", err)
	}

	resp, err := p.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("instagram API request failed: %w", err)
	}
	defer resp.Body.Close()

	var result struct {
		Data []struct {
			ID        string    `json:"id"`
			Caption   string    `json:"caption"`
			MediaType string    `json:"media_type"`
			MediaURL  string    `json:"media_url"`
			Timestamp time.Time `json:"timestamp"`
			Username  string    `json:"username"`
		} `json:"data"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to decode instagram response: %w", err)
	}

	var testimonials []models.Testimonial
	// for _, media := range result.Data {
	// 	t := models.Testimonial{
	// 		Type:      models.TestimonialTypeImage,
	// 		Content:   media.Caption,
	// 		CreatedAt: media.Timestamp,
	// 		SourceData: map[string]interface{}{
	// 			"media_id":   media.ID,
	// 			"media_type": media.MediaType,
	// 			"platform":   "instagram",
	// 			"source":     p.Name(),
	// 		},
	// 		CollectionMethod: models.CollectionAPI,
	// 	}

	// 	if media.MediaType == "VIDEO" {
	// 		t.Type = models.TestimonialTypeVideo
	// 	}

	// 	t.MediaURLs = append(t.MediaURLs, media.MediaURL)
	// 	testimonials = append(testimonials, t)
	// }

	return testimonials, nil
}

func (p *InstagramProvider) Name() string {
	return "instagram"
}

func (i *InstagramProvider) RateLimit() int            { return 200 } // 200/hr
func (i *InstagramProvider) RateWindow() time.Duration { return time.Hour }
func (i *InstagramProvider) Schedule() string          { return "@hourly" }
func (i *InstagramProvider) IsConfigured() bool        { return i.accessToken != "" && i.userID != "" }
