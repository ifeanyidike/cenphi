// internal/providers/twitter/twitter.go
package providers

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/g8rswimmer/go-twitter/v2"
	"github.com/ifeanyidike/cenphi/internal/models"
)

type TwitterProvider struct {
	apiKey      string
	apiSecret   string
	bearerToken string
	username    string
	httpClient  *http.Client
}

// Methods belonging to the go-twitter package
type authorize struct {
	Token string
}

func (a authorize) Add(req *http.Request) {
	req.Header.Add("Authorization", fmt.Sprintf("Bearer %s", a.Token))
}

func NewTwitterProvider(bearerToken, username, apiKey, apiSecret string) *TwitterProvider {
	return &TwitterProvider{
		bearerToken: bearerToken,
		username:    username,
		httpClient: &http.Client{
			Timeout: 10 * time.Second,
		},
		apiKey:    apiKey,
		apiSecret: apiSecret,
	}
}

func (t *TwitterProvider) Name() string {
	return "twitter"
}

func (t *TwitterProvider) Fetch(ctx context.Context) ([]models.Testimonial, error) {
	url := fmt.Sprintf("https://api.x.com/2/tweets/search/recent?query=from:%s", t.username)

	req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		return nil, fmt.Errorf("twitter request creation failed: %w", err)
	}
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", t.bearerToken))

	resp, err := t.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("twitter API request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("twitter API returned status %d", resp.StatusCode)
	}

	var result struct {
		Data []struct {
			ID        string    `json:"id"`
			Text      string    `json:"text"`
			CreatedAt time.Time `json:"created_at"`
			AuthorID  string    `json:"author_id"`
		} `json:"data"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to decode twitter response: %w", err)
	}

	var testimonials []models.Testimonial
	for _, tweet := range result.Data {
		testimonials = append(testimonials, models.Testimonial{
			Content:   tweet.Text,
			CreatedAt: tweet.CreatedAt,
			Type:      models.TestimonialTypeText,
			SourceData: map[string]interface{}{
				"tweet_id":  tweet.ID,
				"author_id": tweet.AuthorID,
				"source":    t.Name(),
			},
			CollectionMethod: models.CollectionAPI,
		})
	}

	return testimonials, nil
}

func (t *TwitterProvider) FetchViaGoTwitter(ctx context.Context) {
	opts := twitter.TweetLookupOpts{
		Expansions:  []twitter.Expansion{twitter.ExpansionEntitiesMentionsUserName, twitter.ExpansionAuthorID},
		TweetFields: []twitter.TweetField{twitter.TweetFieldCreatedAt, twitter.TweetFieldConversationID, twitter.TweetFieldAttachments},
	}
	fmt.Println("Callout to tweet lookup callout")
	client := &twitter.Client{
		Authorizer: authorize{
			Token: t.bearerToken,
		},
		Client: http.DefaultClient,
		Host:   "https://api.twitter.com",
	}
	tweetDictionary, err := client.TweetLookup(ctx, []string{t.username}, opts)
	if err != nil {
		fmt.Printf("Error fetching tweets: %v\n", err)
		return
	}
	enc, err := json.MarshalIndent(tweetDictionary, "", "    ")
	if err != nil {
		log.Panic(err)
	}
	fmt.Println(string(enc))
}

func (t *TwitterProvider) RateLimit() int {
	return 450 // Twitter v2 API allows 450 requests per 15-minute window
}

func (t *TwitterProvider) RateWindow() time.Duration {
	return 15 * time.Minute
}

func (t *TwitterProvider) Schedule() string {
	return "*/5 * * * *" // Every 5 minutes
}

func (t *TwitterProvider) IsConfigured() bool {
	return t.bearerToken != "" && t.username != ""
}
