// internal/repositories/providers/instagram.go
package providers

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/ifeanyidike/cenphi/internal/models"
	"github.com/ifeanyidike/cenphi/pkg/ratelimit"
)

type InstagramConfig struct {
	AccessToken     string
	UserID          string
	Timeout         time.Duration
	BaseURL         string
	RequestsPerHour int
}

type InstagramProvider struct {
	BaseProvider
	config     InstagramConfig
	httpClient *http.Client
}

func NewInstagramProvider(cfg InstagramConfig) *InstagramProvider {
	return &InstagramProvider{
		BaseProvider: BaseProvider{
			rateLimiter: ratelimit.NewTokenBucketLimiter(cfg.RequestsPerHour / 3600),
		},
		config: cfg,
		httpClient: &http.Client{
			Timeout: cfg.Timeout,
		},
	}
}

func (p *InstagramProvider) Fetch(ctx context.Context) ([]models.Testimonial, error) {
	if err := p.WaitForRateLimit(ctx); err != nil {
		return nil, fmt.Errorf("rate limit error: %w", err)
	}

	url := fmt.Sprintf("%s/%s/media?access_token=%s",
		p.config.BaseURL,
		p.config.UserID,
		p.config.AccessToken,
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
	for _, media := range result.Data {
		t := models.Testimonial{
			Type:      models.TestimonialTypeImage,
			Content:   media.Caption,
			CreatedAt: media.Timestamp,
			SourceData: map[string]interface{}{
				"media_id":   media.ID,
				"media_type": media.MediaType,
				"platform":   "instagram",
				"source":     p.SourceName(),
			},
			CollectionMethod: models.CollectionAPI,
		}

		if media.MediaType == "VIDEO" {
			t.Type = models.TestimonialTypeVideo
		}

		t.MediaURLs = append(t.MediaURLs, media.MediaURL)
		testimonials = append(testimonials, t)
	}

	return testimonials, nil
}

func (p *InstagramProvider) SourceName() string {
	return "instagram"
}
