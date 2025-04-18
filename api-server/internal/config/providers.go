// config/providers.go
package config

type ProviderConfig struct {
	Twitter    TwitterConfig
	Instagram  InstagramConfig
	LinkedIn   LinkedInConfig
	GitHub     GitHubConfig
	YouTube    YouTubeConfig
	G2         G2Config
	Capterra   CapterraConfig
	Facebook   FacebookConfig
	Trustpilot TrustpilotConfig
	Yelp       YelpConfig
	Google     GoogleMyBusinessConfig
}

// Example env mapping:
type TwitterConfig struct {
	BearerToken       string `env:"X_BEARER_TOKEN,required"`
	Username          string `env:"X_USERNAME,required"`
	RequestsPerMinute int    `env:"X_RPM" envDefault:"300"`
	APIKey            string `env:"X_API_KEY,required"`
	APISecret         string `env:"X_API_SECRET,required"`
}

type InstagramConfig struct {
	AccessToken     string `env:"INSTAGRAM_ACCESS_TOKEN,required"`
	UserID          string `env:"INSTAGRAM_USER_ID,required"`
	RequestsPerHour int    `env:"INSTAGRAM_RPH" envDefault:"5000"`
}

type LinkedInConfig struct {
	AccessToken       string `env:"LINKEDIN_ACCESS_TOKEN,required"`
	Username          string `env:"LINKEDIN_USERNAME,required"`
	RequestsPerMinute int    `env:"LINKEDIN_RPM" envDefault:"60"`
}

type GitHubConfig struct {
	AccessToken       string `env:"GITHUB_ACCESS_TOKEN,required"`
	Username          string `env:"GITHUB_USERNAME,required"`
	RequestsPerMinute int    `env:"GITHUB_RPM" envDefault:"60"`
}

type YouTubeConfig struct {
	AccessToken       string `env:"YOUTUBE_ACCESS_TOKEN,required"`
	ChannelID         string `env:"YOUTUBE_CHANNEL_ID,required"`
	RequestsPerMinute int    `env:"YOUTUBE_RPM" envDefault:"10"`
}

type G2Config struct {
	AccessToken       string `env:"G2_ACCESS_TOKEN,required"`
	OrgID             string `env:"G2_ORG_ID,required"`
	RequestsPerMinute int    `env:"G2_RPM" envDefault:"60"`
}

type CapterraConfig struct {
	AccessToken       string `env:"CAPTERRA_ACCESS_TOKEN,required"`
	AccountID         string `env:"CAPTERRA_ACCOUNT_ID,required"`
	RequestsPerMinute int    `env:"CAPTERRA_RPM" envDefault:"60"`
}

type FacebookConfig struct {
	ClientID          string `env:"FACEBOOK_CLIENT_ID,required"`
	ClientSecret      string `env:"FACEBOOK_CLIENT_SECRET,required"`
	AccessToken       string `env:"FACEBOOK_ACCESS_TOKEN,required"`
	PageID            string `env:"FACEBOOK_PAGE_ID,required"`
	RequestsPerMinute int    `env:"FACEBOOK_RPM" envDefault:"60"`
	BaseURL           string `env:"FACEBOOK_BASE_URL" envDefault:"https://graph.facebook.com/v11.0"`
}

type TrustpilotConfig struct {
	APIKey     string `env:"TRUSTPILOT_API_KEY,required"`
	BusinessID string `env:"TRUSTPILOT_BUSINESS_ID,required"`
	BaseURL    string `env:"TRUSTPILOT_BASE_URL" envDefault:"https://api.trustpilot.com"`
}

type YelpConfig struct {
	APIKey     string `env:"YELP_API_KEY,required"`
	BusinessID string `env:"YELP_BUSINESS_ID,required"`
	BaseURL    string `env:"YELP_BASE_URL" envDefault:"https://api.yelp.com"`
	CategoryID string `env:"YELP_CATEGORY_ID" envDefault:"food"`
}

type GoogleMyBusinessConfig struct {
	ClientID     string `env:"GOOGLE_MY_BUSINESS_CLIENT_ID,required"`
	ClientSecret string `env:"GOOGLE_MY_BUSINESS_CLIENT_SECRET,required"`
	AccountName  string `env:"GOOGLE_MY_BUSINESS_ACCOUNT_NAME,required"`
	AccessToken  string `env:"GOOGLE_MY_BUSINESS_ACCESS_TOKEN,required"`
	RefreshToken string `env:"GOOGLE_MY_BUSINESS_REFRESH_TOKEN,required"`
}
