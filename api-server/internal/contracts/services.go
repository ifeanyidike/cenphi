// internal/contracts/services.go
package contracts

import "golang.org/x/oauth2"

// OAuthService defines the contract for obtaining tokens.
type OAuthService interface {
	GetAuthURL(provider string, userID string) (string, error)
	HandleCallback(provider, code, state string) (*oauth2.Token, error)
	GetToken(userID, provider string) (*oauth2.Token, error)
	RemoveToken(string, string) error
}

// Token represents an OAuth token.
type Token struct {
	AccessToken string
	ExpiresAt   int64 // or time.Time if you prefer
}

// SentimentService defines the contract for analyzing text sentiment.
type SentimentService interface {
	AnalyzeWithOpenAI(text string) (float64, error)
	AnalyzeWithGRPC(text string) (float64, error)

	AnalyzeText(text string) (float64, error)
}
