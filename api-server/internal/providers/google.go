// internal/repositories/providers/google.go
package providers

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/ifeanyidike/cenphi/internal/models"
	"golang.org/x/oauth2"
)

type GoogleMyBusiness struct {
	BaseProvider
	client *http.Client
	config *oauth2.Config
	token  *oauth2.Token
}

type LocationsResponse struct {
	Locations []struct {
		Name string `json:"name"`
	} `json:"locations"`
}

func New(clientID, clientSecret string, token *oauth2.Token) *GoogleMyBusiness {
	conf := &oauth2.Config{
		ClientID:     clientID,
		ClientSecret: clientSecret,
		Scopes:       []string{"https://www.googleapis.com/auth/business.manage"},
		Endpoint: oauth2.Endpoint{
			AuthURL:  "https://accounts.google.com/o/oauth2/auth",
			TokenURL: "https://oauth2.googleapis.com/token",
		},
	}

	return &GoogleMyBusiness{
		BaseProvider: BaseProvider{
			name:       "google_my_business",
			rateLimit:  100,         // 100 requests
			rateWindow: time.Minute, // per minute
			schedule:   "@every 1h",
			oauthConfig: &OAuthConfig{
				ClientID:     clientID,
				ClientSecret: clientSecret,
				AuthURL:      conf.Endpoint.AuthURL,
				TokenURL:     conf.Endpoint.TokenURL,
				Scopes:       conf.Scopes,
			},
		},
		config: conf,
		token:  token,
		client: conf.Client(context.Background(), token),
	}
}

func (p *GoogleMyBusiness) Fetch(ctx context.Context) ([]models.Testimonial, error) {
	locationsResponse, err := p.fetchLocations(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch locations: %w", err)
	}

	var allTestimonials []models.Testimonial
	for _, location := range locationsResponse.Locations {
		reviews, err := p.fetchReviews(ctx, location.Name)
		if err != nil {
			continue
		}
		allTestimonials = append(allTestimonials, reviews...)
	}

	return allTestimonials, nil
}

func (g *GoogleMyBusiness) fetchLocations(ctx context.Context) (*LocationsResponse, error) {
	locationUrl := fmt.Sprintf("https://mybusiness.googleapis.com/v4/accounts/%s/locations")
	req, err := http.NewRequestWithContext(ctx, "GET", locationUrl, nil)
	if err != nil {
		return nil, fmt.Errorf("google locations request failed: %w", err)
	}

	resp, err := g.client.Do(req.WithContext(ctx))
	if err != nil {
		return nil, fmt.Errorf("google API request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("google locations API returned status %d", resp.StatusCode)
	}

	var locationsResponse LocationsResponse
	if err := json.NewDecoder(resp.Body).Decode(&locationsResponse); err != nil {
		return nil, fmt.Errorf("failed to decode google locations response: %w", err)
	}

	return &locationsResponse, nil
}

func (g *GoogleMyBusiness) fetchReviews(ctx context.Context, locationID string) ([]models.Testimonial, error) {
	url := fmt.Sprintf("https://mybusiness.googleapis.com/v4/%s/reviews", locationID)
	req, _ := http.NewRequestWithContext(ctx, "GET", url, nil)
	resp, err := g.client.Do(req.WithContext(ctx))
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var result struct {
		Reviews []struct {
			ReviewID   string    `json:"reviewId"`
			Comment    string    `json:"comment"`
			StarRating float32   `json:"starRating"`
			CreateTime time.Time `json:"createTime"`
			Reviewer   struct {
				DisplayName string `json:"displayName"`
			} `json:"reviewer"`
		} `json:"reviews"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to decode google reviews response: %w", err)
	}

	// Convert to testimonial models
	var testimonials []models.Testimonial
	for _, r := range result.Reviews {
		testimonials = append(testimonials, models.Testimonial{
			CustomerName: r.Reviewer.DisplayName,
			Content:      r.Comment,
			Rating:       &r.StarRating,
			SourceData: map[string]interface{}{
				"source":               g.SourceName(),
				"location":             locationID,
				"trustpilot_review_id": r.ReviewID,
			},
			CreatedAt: r.CreateTime,
		})
	}
	return testimonials, nil
}

func (p *GoogleMyBusiness) SourceName() string {
	return "google"
}

func (g *GoogleMyBusiness) IsConfigured() bool {
	return g.config.ClientID != "" &&
		g.config.ClientSecret != "" &&
		g.token != nil
}
