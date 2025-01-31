// internal/repositories/providers/twitter.go
package providers

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/ifeanyidike/cenphi/internal/models"
	"github.com/ifeanyidike/cenphi/pkg/ratelimit"
	"golang.org/x/time/rate"
)

type TwitterConfig struct {
	BearerToken       string
	Username          string
	Timeout           time.Duration
	BaseURL           string
	RequestsPerMinute int
}

type TwitterProvider struct {
	BaseProvider
	config     TwitterConfig
	httpClient *http.Client
}

func NewTwitterProvider(cfg TwitterConfig) *TwitterProvider {
	return &TwitterProvider{
		BaseProvider: BaseProvider{
			rateLimiter: ratelimit.NewTokenBucketLimiter(cfg.RequestsPerMinute / 60),
		},
		config: cfg,
		httpClient: &http.Client{
			Timeout: cfg.Timeout,
			Transport: &http.Transport{
				MaxIdleConns:       10,
				MaxConnsPerHost:    100,
				DisableCompression: false,
				IdleConnTimeout:    30 * time.Second,
			},
		},
	}
}

func (p *TwitterProvider) Fetch(ctx context.Context) ([]models.Testimonial, error) {
	if err := p.WaitForRateLimit(ctx); err != nil {
		return nil, fmt.Errorf("rate limit error: %w", err)
	}
	url := fmt.Sprintf("%s/2/tweets/search/recent?query=from:%s",
		p.config.BaseURL,
		p.config.Username,
	)

	req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		return nil, fmt.Errorf("twitter request creation failed: %w", err)
	}
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", p.config.BearerToken))

	resp, err := p.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("twitter API request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusTooManyRequests {
		p.rateLimiter.SetLimit(rate.Limit(p.config.RequestsPerMinute / 120))
		return nil, fmt.Errorf("twitter rate limit exceeded")
	}

	var result struct {
		Data []struct {
			ID        string    `json:"id"`
			Text      string    `json:"text"`
			CreatedAt time.Time `json:"created_at"`
			AuthorID  string    `json:"author_id"`
		} `json:"data"`
		Includes struct {
			Users []struct {
				ID       string `json:"id"`
				Username string `json:"username"`
			} `json:"users"`
		} `json:"includes"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to decode twitter response: %w", err)
	}

	userMap := make(map[string]string)
	for _, user := range result.Includes.Users {
		userMap[user.ID] = user.Username
	}

	var testimonials []models.Testimonial
	for _, tweet := range result.Data {
		testimonials = append(testimonials, models.Testimonial{
			Type:         models.TestimonialTypeText,
			CustomerName: userMap[tweet.AuthorID],
			Content:      tweet.Text,
			CreatedAt:    tweet.CreatedAt,
			SourceData: map[string]interface{}{
				"tweet_id":  tweet.ID,
				"author_id": tweet.AuthorID,
				"source":    p.SourceName(),
				"username":  p.config.Username,
			},
			CollectionMethod: models.CollectionAPI,
		})
	}

	return testimonials, nil
}

func (p *TwitterProvider) SourceName() string {
	return "twitter"
}
