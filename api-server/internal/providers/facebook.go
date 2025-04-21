// internal/repositories/providers/facebook.go
package providers

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/google/uuid"
	"github.com/ifeanyidike/cenphi/internal/contracts"
	"github.com/ifeanyidike/cenphi/internal/models"
	"github.com/ifeanyidike/cenphi/internal/repositories"
)

type FacebookProvider struct {
	clientID            string
	clientSecret        string
	oauthService        contracts.OAuthService
	sentimentService    contracts.SentimentService
	customerProfileRepo repositories.CustomerProfileRepository
	db                  repositories.DB
}

// New constructor that doesn't require workspaceID at creation time
func NewFacebookProvider(
	clientID string,
	clientSecret string,
	oauthService contracts.OAuthService,
	sentimentService contracts.SentimentService,
	customerProfileRepo repositories.CustomerProfileRepository,
	db repositories.DB,
) *FacebookProvider {
	return &FacebookProvider{
		clientID:            clientID,
		clientSecret:        clientSecret,
		oauthService:        oauthService,
		sentimentService:    sentimentService,
		customerProfileRepo: customerProfileRepo,
		db:                  db,
	}
}

func (p *FacebookProvider) Fetch(ctx context.Context, userID string, workspaceID uuid.UUID) ([]models.Testimonial, error) {
	// Get the user's access token
	token, err := p.oauthService.GetToken(userID, "facebook")
	if err != nil {
		return nil, fmt.Errorf("failed to get facebook token: %w", err)
	}

	// Get list of pages the user manages
	pages, err := p.getUserPages(ctx, token.AccessToken)
	if err != nil {
		return nil, fmt.Errorf("failed to get user pages: %w", err)
	}

	var allTestimonials []models.Testimonial

	// For each page, get both recommendations and posts
	for _, page := range pages {
		// Get page recommendations/reviews
		recommendations, err := p.getPageRecommendations(ctx, page.ID, page.AccessToken, workspaceID)
		if err != nil {
			// Log error but continue with other pages
			fmt.Printf("Error getting recommendations for page %s: %v\n", page.ID, err)
		} else {
			allTestimonials = append(allTestimonials, recommendations...)
		}

		// Get page posts and comments for sentiment analysis
		posts, err := p.getPagePosts(ctx, page.ID, page.AccessToken, workspaceID)
		if err != nil {
			// Log error but continue
			fmt.Printf("Error getting posts for page %s: %v\n", page.ID, err)
		} else {
			allTestimonials = append(allTestimonials, posts...)
		}
	}

	return allTestimonials, nil
}

type FacebookPage struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	AccessToken string `json:"access_token"`
}

func (p *FacebookProvider) getUserPages(ctx context.Context, accessToken string) ([]FacebookPage, error) {
	url := fmt.Sprintf("https://graph.facebook.com/v19.0/me/accounts?access_token=%s", accessToken)

	req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		return nil, fmt.Errorf("facebook request creation failed: %w", err)
	}

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("facebook API request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("facebook API returned status %d", resp.StatusCode)
	}

	var result struct {
		Data []FacebookPage `json:"data"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to decode facebook response: %w", err)
	}

	return result.Data, nil
}

func (p *FacebookProvider) getPageRecommendations(ctx context.Context, pageID, pageToken string, workspaceID uuid.UUID) ([]models.Testimonial, error) {
	url := fmt.Sprintf("https://graph.facebook.com/v19.0/%s/ratings?access_token=%s", pageID, pageToken)

	req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		return nil, fmt.Errorf("facebook request creation failed: %w", err)
	}

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("facebook API request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("facebook API returned status %d", resp.StatusCode)
	}

	var result struct {
		Data []struct {
			ID          string                 `json:"id"`
			ReviewText  string                 `json:"review_text"`
			Rating      float32                `json:"rating"`
			CreatedTime time.Time              `json:"created_time"`
			Reviewer    contracts.ReviewerData `json:"reviewer"`
		} `json:"data"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to decode facebook response: %w", err)
	}

	var testimonials []models.Testimonial
	for _, review := range result.Data {
		// Create or get customer profile
		profile, err := p.customerProfileRepo.GetOrCreate(
			ctx,
			review.Reviewer,
			workspaceID,
			"facebook",
			p.db,
		)
		if err != nil {
			fmt.Printf("Error creating customer profile: %v\n", err)
			continue
		}

		// Calculate sentiment score (1-5) if no explicit rating is provided
		var rating float32 = review.Rating
		if rating == 0 && review.ReviewText != "" {
			sentiment, err := p.sentimentService.AnalyzeText(review.ReviewText)
			if err == nil {
				// Convert sentiment (-1 to 1) to a 1-5 scale
				rating = float32(((sentiment+1)/2)*4) + 1
			}
		}

		testimonials = append(testimonials, models.Testimonial{
			WorkspaceID:       workspaceID,
			CustomerProfileID: &profile.ID,
			TestimonialType:   models.TestimonialTypeCustomer,
			Format:            models.ContentFormatSocialPost,
			Content:           review.ReviewText,
			Rating:            &rating,
			SourceData: map[string]interface{}{
				"page_id":  pageID,
				"platform": "facebook",
			},
			UpdatedAt: time.Now(),
			CreatedAt: time.Now(),
		})
	}

	return testimonials, nil
}

func (p *FacebookProvider) getPagePosts(ctx context.Context, pageID, pageToken string, workspaceID uuid.UUID) ([]models.Testimonial, error) {
	// Get posts from the page
	url := fmt.Sprintf("https://graph.facebook.com/v19.0/%s/feed?fields=id,message,created_time,from&access_token=%s", pageID, pageToken)

	req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		return nil, fmt.Errorf("facebook request creation failed: %w", err)
	}

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
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
			Message     string    `json:"message"`
			CreatedTime time.Time `json:"created_time"`
			From        struct {
				Name  string `json:"name"`
				ID    string `json:"id"`
				Email string `json:"email"`
			} `json:"from"`
		} `json:"data"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to decode facebook response: %w", err)
	}

	var testimonials []models.Testimonial
	for _, post := range result.Data {
		// Skip page's own posts (we want posts from others on the page)
		if post.From.ID == pageID {
			continue
		}

		// Skip posts without messages
		if post.Message == "" {
			continue
		}

		// Analyze sentiment
		sentiment, err := p.sentimentService.AnalyzeText(post.Message)
		if err != nil {
			fmt.Printf("Error analyzing sentiment: %v\n", err)
			continue
		}

		// Skip posts with negative sentiment or neutral posts that don't seem like testimonials
		if sentiment < 0.2 {
			continue
		}

		// Convert sentiment (-1 to 1) to a 1-5 scale
		rating := float32(((sentiment+1)/2)*4) + 1

		// Create or get customer profile
		reviewer := contracts.ReviewerData{
			Name:       post.From.Name,
			ExternalID: post.From.ID,
			Email:      post.From.Email,
		}

		profile, err := p.customerProfileRepo.GetOrCreate(
			ctx,
			reviewer,
			workspaceID,
			"facebook",
			p.db,
		)
		if err != nil {
			fmt.Printf("Error creating customer profile: %v\n", err)
			continue
		}

		testimonials = append(testimonials, models.Testimonial{
			WorkspaceID:       workspaceID,
			CustomerProfileID: &profile.ID,
			TestimonialType:   models.TestimonialTypeCustomer,
			Format:            models.ContentFormatSocialPost,
			Content:           post.Message,
			Rating:            &rating,
			SourceData: map[string]interface{}{
				"page_id":  pageID,
				"platform": "facebook",
				"post_id":  post.ID,
			},
			UpdatedAt: post.CreatedTime,
			CreatedAt: post.CreatedTime,
		})
	}

	return testimonials, nil
}

func (p *FacebookProvider) Name() string {
	return "facebook"
}

func (p *FacebookProvider) RateLimit() int {
	return 200
}

func (p *FacebookProvider) RateWindow() time.Duration {
	return time.Hour
}

func (p *FacebookProvider) Schedule() string {
	return "@hourly"
}

func (p *FacebookProvider) IsConfigured() bool {
	return p.clientID != "" && p.clientSecret != ""
}
