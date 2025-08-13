// internal/services/linkedin_service.go
package sharing

import (
	"bytes"
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"path/filepath"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/ifeanyidike/cenphi/internal/cache"
	"github.com/ifeanyidike/cenphi/internal/config"
	"github.com/ifeanyidike/cenphi/internal/models"
	"go.uber.org/zap"
)

type LinkedInClient interface {
	GetAuthURL(workspaceID, userID uuid.UUID) (string, error)
	ExchangeCode(ctx context.Context, code, state string) (*models.LinkedInTokenResponse, *models.OAuthState, error)
	GetProfile(ctx context.Context, accessToken string) (*models.LinkedInProfile, error)
	CreatePost(ctx context.Context, accessToken, authorURN string, req *models.LinkedInPostRequest) (*models.LinkedInPostResponse, error)
	CreatePostFromContent(ctx context.Context, accessToken, authorURN, content string, mediaURLs []string, postType string) (*models.LinkedInPostResponse, error)
	GetPostMetrics(ctx context.Context, accessToken, postID string) (*models.LinkedInPostMetrics, error)
	RefreshToken(ctx context.Context, refreshToken string) (*models.LinkedInTokenResponse, error)
	ValidateToken(ctx context.Context, accessToken string) error
	UploadMedia(ctx context.Context, accessToken, mediaURL, mediaType string) (string, error)
	EnsurePersonURN(identifier string) string
}

type linkedInClient struct {
	config       config.LinkedInOAuthConfig
	apiConfig    config.LinkedInAPIConfig
	httpClient   *http.Client
	logger       *zap.Logger
	cacheService cache.RedisCache
}

func NewLinkedInClient(cfg config.SocialConfig, logger *zap.Logger, cacheService cache.RedisCache) LinkedInClient {
	return &linkedInClient{
		config:    cfg.LinkedIn,
		apiConfig: cfg.LinkedInAPI,
		httpClient: &http.Client{
			Timeout: cfg.LinkedInAPI.RequestTimeout,
		},
		logger:       logger,
		cacheService: cacheService,
	}
}

func (s *linkedInClient) CreatePostFromContent(ctx context.Context, accessToken, authorURN, content string, mediaURLs []string, postType string) (*models.LinkedInPostResponse, error) {
	switch postType {
	case "text":
		return s.createTextPost(ctx, accessToken, authorURN, content)
	case "image":
		return s.createImagePost(ctx, accessToken, authorURN, content, mediaURLs)
	case "video":
		return s.createVideoPost(ctx, accessToken, authorURN, content, mediaURLs)
	case "carousel":
		return s.createMultiImagePost(ctx, accessToken, authorURN, content, mediaURLs)
	default:
		return nil, fmt.Errorf("unsupported post type: %s", postType)
	}
}

// Create text-only post
// func (s *linkedInClient) createTextPost(ctx context.Context, accessToken, authorURN, content string) (*models.LinkedInPostResponse, error) {
// 	req := &models.LinkedInPostRequest{
// 		Author:         authorURN,
// 		LifecycleState: "PUBLISHED",
// 		Commentary:     content,
// 		Visibility: map[string]interface{}{
// 			"com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
// 		},
// 	}

// 	return s.CreatePost(ctx, accessToken, authorURN, req)
// }

// Create text-only post - OFFICIAL LINKEDIN API FORMAT
func (s *linkedInClient) createTextPost(ctx context.Context, accessToken, authorURN, content string) (*models.LinkedInPostResponse, error) {
	req := &models.LinkedInPostRequest{
		Author:         authorURN,
		LifecycleState: "PUBLISHED",
		SpecificContent: map[string]interface{}{
			"com.linkedin.ugc.ShareContent": map[string]interface{}{
				"shareCommentary": map[string]interface{}{
					"text": content,
				},
				"shareMediaCategory": "NONE",
			},
		},
		Visibility: map[string]interface{}{
			"com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
		},
	}

	return s.CreatePost(ctx, accessToken, authorURN, req)
}

// Create image post - OFFICIAL LINKEDIN API FORMAT
func (s *linkedInClient) createImagePost(ctx context.Context, accessToken, authorURN, content string, mediaURLs []string) (*models.LinkedInPostResponse, error) {
	if len(mediaURLs) == 0 {
		return nil, fmt.Errorf("image post requires at least one image URL")
	}

	if content == "" {
		content = "📸"
	}

	// Upload image and get asset URN
	assetURN, err := s.UploadMedia(ctx, accessToken, mediaURLs[0], "image")
	if err != nil {
		return nil, fmt.Errorf("failed to upload image: %w", err)
	}

	req := &models.LinkedInPostRequest{
		Author:         authorURN,
		LifecycleState: "PUBLISHED",
		SpecificContent: map[string]interface{}{
			"com.linkedin.ugc.ShareContent": map[string]interface{}{
				"shareCommentary": map[string]interface{}{
					"text": content,
				},
				"shareMediaCategory": "IMAGE",
				"media": []map[string]interface{}{
					{
						"status": "READY",
						"description": map[string]interface{}{
							"text": "",
						},
						"media": assetURN,
						"title": map[string]interface{}{
							"text": "",
						},
					},
				},
			},
		},
		Visibility: map[string]interface{}{
			"com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
		},
	}

	return s.CreatePost(ctx, accessToken, authorURN, req)
}

// Create video post - OFFICIAL LINKEDIN API FORMAT
func (s *linkedInClient) createVideoPost(ctx context.Context, accessToken, authorURN, content string, mediaURLs []string) (*models.LinkedInPostResponse, error) {
	if len(mediaURLs) == 0 {
		return nil, fmt.Errorf("video post requires at least one video URL")
	}

	if len(mediaURLs) > 1 {
		return nil, fmt.Errorf("LinkedIn supports only one video per post")
	}

	if content == "" {
		content = "🎥"
	}

	// Upload video and get asset URN
	assetURN, err := s.UploadMedia(ctx, accessToken, mediaURLs[0], "video")
	if err != nil {
		return nil, fmt.Errorf("failed to upload video: %w", err)
	}

	req := &models.LinkedInPostRequest{
		Author:         authorURN,
		LifecycleState: "PUBLISHED",
		SpecificContent: map[string]interface{}{
			"com.linkedin.ugc.ShareContent": map[string]interface{}{
				"shareCommentary": map[string]interface{}{
					"text": content,
				},
				"shareMediaCategory": "VIDEO",
				"media": []map[string]interface{}{
					{
						"status": "READY",
						"description": map[string]interface{}{
							"text": "",
						},
						"media": assetURN,
						"title": map[string]interface{}{
							"text": "",
						},
					},
				},
			},
		},
		Visibility: map[string]interface{}{
			"com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
		},
	}

	return s.CreatePost(ctx, accessToken, authorURN, req)
}

// Create multi-image post
func (s *linkedInClient) createMultiImagePost(ctx context.Context, accessToken, authorURN, content string, mediaURLs []string) (*models.LinkedInPostResponse, error) {
	if len(mediaURLs) < 2 {
		return nil, fmt.Errorf("carousel post requires at least 2 images")
	}

	if len(mediaURLs) > 9 { // LinkedIn allows up to 9 images in a carousel
		return nil, fmt.Errorf("LinkedIn supports maximum 9 images in carousel posts")
	}

	if content == "" {
		content = "📸 Check out these images!"
	}

	// Upload images and get asset URNs
	media := make([]map[string]interface{}, 0, len(mediaURLs))
	for _, mediaURL := range mediaURLs {
		assetURN, err := s.UploadMedia(ctx, accessToken, mediaURL, "image")
		if err != nil {
			return nil, fmt.Errorf("failed to upload image %s: %w", mediaURL, err)
		}

		media = append(media, map[string]interface{}{
			"status": "READY",
			"description": map[string]interface{}{
				"text": "",
			},
			"media": assetURN,
			"title": map[string]interface{}{
				"text": "",
			},
		})
	}

	req := &models.LinkedInPostRequest{
		Author:         authorURN,
		LifecycleState: "PUBLISHED",
		SpecificContent: map[string]interface{}{
			"com.linkedin.ugc.ShareContent": map[string]interface{}{
				"shareCommentary": map[string]interface{}{
					"text": content,
				},
				"shareMediaCategory": "IMAGE", // Multiple images still use "IMAGE"
				"media":              media,
			},
		},
		Visibility: map[string]interface{}{
			"com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
		},
	}

	return s.CreatePost(ctx, accessToken, authorURN, req)
}

// Upload media to LinkedIn and return asset URN
func (s *linkedInClient) UploadMedia(ctx context.Context, accessToken, mediaURL, mediaType string) (string, error) {
	// Step 1: Register upload
	assetURN, uploadURL, err := s.registerUpload(ctx, accessToken, mediaType)
	if err != nil {
		return "", fmt.Errorf("failed to register upload: %w", err)
	}

	// Step 2: Download media from URL
	mediaData, contentType, err := s.downloadMedia(ctx, mediaURL)
	if err != nil {
		return "", fmt.Errorf("failed to download media: %w", err)
	}

	// Step 3: Upload media to LinkedIn
	err = s.uploadMediaData(ctx, uploadURL, mediaData, contentType)
	if err != nil {
		return "", fmt.Errorf("failed to upload media data: %w", err)
	}

	// Step 4: Wait for processing (for videos)
	if mediaType == "video" {
		err = s.waitForVideoProcessing(ctx, accessToken, assetURN)
		if err != nil {
			return "", fmt.Errorf("video processing failed: %w", err)
		}
	}

	return assetURN, nil
}

// Register upload with LinkedIn
func (s *linkedInClient) registerUpload(ctx context.Context, accessToken, mediaType string) (string, string, error) {
	var recipes []string
	switch mediaType {
	case "image":
		recipes = []string{"urn:li:digitalmediaRecipe:feedshare-image"}
	case "video":
		recipes = []string{"urn:li:digitalmediaRecipe:feedshare-video"}
	default:
		return "", "", fmt.Errorf("unsupported media type: %s", mediaType)
	}

	// Get person URN from profile for the owner field
	profile, err := s.GetProfile(ctx, accessToken)
	if err != nil {
		return "", "", fmt.Errorf("failed to get profile for upload: %w", err)
	}
	ownerURN := s.EnsurePersonURN(profile.ID)

	registerData := map[string]interface{}{
		"registerUploadRequest": map[string]interface{}{
			"recipes": recipes,
			"owner":   ownerURN,
			"serviceRelationships": []map[string]interface{}{
				{
					"relationshipType": "OWNER",
					"identifier":       "urn:li:userGeneratedContent",
				},
			},
		},
	}

	reqBody, err := json.Marshal(registerData)
	if err != nil {
		return "", "", err
	}

	registerURL := fmt.Sprintf("%s/v2/assets?action=registerUpload", s.apiConfig.BaseURL)
	req, err := http.NewRequestWithContext(ctx, "POST", registerURL, bytes.NewReader(reqBody))
	if err != nil {
		return "", "", err
	}

	req.Header.Set("Authorization", "Bearer "+accessToken)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Restli-Protocol-Version", "2.0.0")

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return "", "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return "", "", fmt.Errorf("register upload failed with status %d: %s", resp.StatusCode, string(body))
	}

	var registerResp struct {
		Value struct {
			Asset           string `json:"asset"`
			UploadMechanism struct {
				ComLinkedinDigitalmediaUploadingMediaUploadHttpRequest struct {
					UploadURL string `json:"uploadUrl"`
				} `json:"com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"`
			} `json:"uploadMechanism"`
		} `json:"value"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&registerResp); err != nil {
		return "", "", err
	}

	return registerResp.Value.Asset, registerResp.Value.UploadMechanism.ComLinkedinDigitalmediaUploadingMediaUploadHttpRequest.UploadURL, nil
}

// Download media from URL
func (s *linkedInClient) downloadMedia(ctx context.Context, mediaURL string) ([]byte, string, error) {
	req, err := http.NewRequestWithContext(ctx, "GET", mediaURL, nil)
	if err != nil {
		return nil, "", err
	}

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return nil, "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, "", fmt.Errorf("failed to download media: status %d", resp.StatusCode)
	}

	data, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, "", err
	}

	contentType := resp.Header.Get("Content-Type")
	if contentType == "" {
		// Guess content type from URL extension
		ext := strings.ToLower(filepath.Ext(mediaURL))
		switch ext {
		case ".jpg", ".jpeg":
			contentType = "image/jpeg"
		case ".png":
			contentType = "image/png"
		case ".mp4":
			contentType = "video/mp4"
		case ".mov":
			contentType = "video/quicktime"
		default:
			contentType = "application/octet-stream"
		}
	}

	return data, contentType, nil
}

// Upload media data to LinkedIn
func (s *linkedInClient) uploadMediaData(ctx context.Context, uploadURL string, data []byte, contentType string) error {
	req, err := http.NewRequestWithContext(ctx, "PUT", uploadURL, bytes.NewReader(data))
	if err != nil {
		return err
	}

	req.Header.Set("Content-Type", contentType)
	req.ContentLength = int64(len(data))

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusCreated && resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("media upload failed with status %d: %s", resp.StatusCode, string(body))
	}

	return nil
}

// Wait for video processing to complete
func (s *linkedInClient) waitForVideoProcessing(ctx context.Context, accessToken, assetURN string) error {
	maxAttempts := 30 // 5 minutes max
	for range maxAttempts {
		status, err := s.getAssetStatus(ctx, accessToken, assetURN)
		if err != nil {
			return err
		}

		switch status {
		case "AVAILABLE":
			return nil
		case "PROCESSING":
			select {
			case <-ctx.Done():
				return ctx.Err()
			case <-time.After(10 * time.Second):
				continue
			}
		case "FAILED":
			return fmt.Errorf("video processing failed")
		default:
			s.logger.Warn("Unknown asset status", zap.String("status", status))
		}
	}

	return fmt.Errorf("video processing timeout")
}

// Get asset processing status
func (s *linkedInClient) getAssetStatus(ctx context.Context, accessToken, assetURN string) (string, error) {
	statusURL := fmt.Sprintf("%s/%s/assets/%s", s.apiConfig.BaseURL, s.apiConfig.APIVersion, url.QueryEscape(assetURN))

	req, err := http.NewRequestWithContext(ctx, "GET", statusURL, nil)
	if err != nil {
		return "", err
	}

	req.Header.Set("Authorization", "Bearer "+accessToken)

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("failed to get asset status: %d", resp.StatusCode)
	}

	var statusResp struct {
		Status string `json:"status"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&statusResp); err != nil {
		return "", err
	}

	return statusResp.Status, nil
}

func (s *linkedInClient) GetAuthURL(workspaceID, userID uuid.UUID) (string, error) {
	state, err := s.generateState(workspaceID, userID, "linkedin")
	if err != nil {
		return "", fmt.Errorf("failed to generate OAuth state: %w", err)
	}

	return s.config.GetAuthURL(state), nil
}

func (s *linkedInClient) ExchangeCode(ctx context.Context, code, state string) (*models.LinkedInTokenResponse, *models.OAuthState, error) {
	// Validate state
	oauthState, err := s.validateState(ctx, state)
	if err != nil {
		return nil, nil, fmt.Errorf("invalid OAuth state: %w", err)
	}

	// Prepare token exchange request
	data := url.Values{
		"grant_type":    {"authorization_code"},
		"code":          {code},
		"redirect_uri":  {s.config.RedirectURI},
		"client_id":     {s.config.ClientID},
		"client_secret": {s.config.ClientSecret},
	}

	req, err := http.NewRequestWithContext(ctx, "POST", "https://www.linkedin.com/oauth/v2/accessToken", strings.NewReader(data.Encode()))
	if err != nil {
		return nil, nil, fmt.Errorf("failed to create token request: %w", err)
	}

	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to exchange code: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, nil, fmt.Errorf("token exchange failed with status %d: %s", resp.StatusCode, string(body))
	}

	var tokenResp models.LinkedInTokenResponse
	if err := json.NewDecoder(resp.Body).Decode(&tokenResp); err != nil {
		return nil, nil, fmt.Errorf("failed to decode token response: %w", err)
	}

	return &tokenResp, oauthState, nil
}

// Simplified profile with just basic OpenID info
func (s *linkedInClient) GetProfile(ctx context.Context, accessToken string) (*models.LinkedInProfile, error) {
	userInfoURL := "https://api.linkedin.com/v2/userinfo"

	req, err := http.NewRequestWithContext(ctx, "GET", userInfoURL, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create userinfo request: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+accessToken)

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to get userinfo: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("userinfo request failed with status %d: %s", resp.StatusCode, string(body))
	}

	var userInfo struct {
		Sub        string `json:"sub"`
		Name       string `json:"name"`
		GivenName  string `json:"given_name"`
		FamilyName string `json:"family_name"`
		Email      string `json:"email"`
		Picture    string `json:"picture"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&userInfo); err != nil {
		return nil, fmt.Errorf("failed to decode userinfo response: %w", err)
	}

	return &models.LinkedInProfile{
		ID:             userInfo.Sub,
		FirstName:      userInfo.GivenName,
		LastName:       userInfo.FamilyName,
		EmailAddress:   userInfo.Email,
		ProfilePicture: userInfo.Picture,
	}, nil
}

func (s *linkedInClient) CreatePost(ctx context.Context, accessToken, authorURN string, req *models.LinkedInPostRequest) (*models.LinkedInPostResponse, error) {
	// FIXED: Use the correct UGC API endpoint
	postURL := fmt.Sprintf("%s/v2/ugcPosts", s.apiConfig.BaseURL)

	// If authorURN is not provided, get it from profile
	if authorURN == "" {
		profile, err := s.GetProfile(ctx, accessToken)
		if err != nil {
			return nil, fmt.Errorf("failed to get author URN: %w", err)
		}
		authorURN = s.EnsurePersonURN(profile.ID)
	}

	// Set default values if not provided
	if req.LifecycleState == "" {
		req.LifecycleState = "PUBLISHED"
	}
	if req.Visibility == nil {
		req.Visibility = map[string]interface{}{
			"com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
		}
	}

	req.Author = authorURN

	reqBody, err := json.Marshal(req)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal post request: %w", err)
	}

	s.logger.Debug("LinkedIn UGC API request",
		zap.String("url", postURL),
		zap.String("body", string(reqBody)))

	httpReq, err := http.NewRequestWithContext(ctx, "POST", postURL, bytes.NewReader(reqBody))
	if err != nil {
		return nil, fmt.Errorf("failed to create post request: %w", err)
	}

	httpReq.Header.Set("Authorization", "Bearer "+accessToken)
	httpReq.Header.Set("Content-Type", "application/json")
	// CRITICAL: This header is required according to LinkedIn docs
	httpReq.Header.Set("X-Restli-Protocol-Version", "2.0.0")

	resp, err := s.httpClient.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("failed to create post: %w", err)
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)

	s.logger.Debug("LinkedIn UGC API response",
		zap.Int("status", resp.StatusCode),
		zap.String("body", string(body)))

	if resp.StatusCode != http.StatusCreated {
		return nil, fmt.Errorf("post creation failed with status %d: %s", resp.StatusCode, string(body))
	}

	ugcPostID := resp.Header.Get("X-RestLi-Id")
	if ugcPostID == "" {
		return nil, fmt.Errorf("no UGC post ID returned in response header")
	}

	s.logger.Info("UGC Post created successfully",
		zap.String("ugc_post_id", ugcPostID))

	postResp := &models.LinkedInPostResponse{
		ID:        ugcPostID,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	return postResp, nil
}

// func (s *linkedInClient) GetPostMetrics(ctx context.Context, accessToken, postID string) (*models.LinkedInPostMetrics, error) {
// 	// Try the batch statistics API for UGC posts
// 	metricsURL := fmt.Sprintf("%s/v2/ugcPostStatistics", s.apiConfig.BaseURL)

// 	// Create query parameters for the specific post
// 	params := url.Values{}
// 	params.Set("ugcPosts", fmt.Sprintf("List(urn:li:ugcPost:%s)", postID))

// 	fullURL := fmt.Sprintf("%s?%s", metricsURL, params.Encode())

// 	req, err := http.NewRequestWithContext(ctx, "GET", fullURL, nil)
// 	if err != nil {
// 		return nil, fmt.Errorf("failed to create metrics request: %w", err)
// 	}

// 	req.Header.Set("Authorization", "Bearer "+accessToken)
// 	req.Header.Set("Content-Type", "application/json")
// 	req.Header.Set("X-Restli-Protocol-Version", "2.0.0")

// 	resp, err := s.httpClient.Do(req)
// 	if err != nil {
// 		return nil, fmt.Errorf("failed to get metrics: %w", err)
// 	}
// 	defer resp.Body.Close()

// 	body, _ := io.ReadAll(resp.Body)

// 	s.logger.Debug("LinkedIn UGC batch metrics response",
// 		zap.String("url", fullURL),
// 		zap.Int("status", resp.StatusCode),
// 		zap.String("body", string(body)))

// 	if resp.StatusCode != http.StatusOK {
// 		return nil, fmt.Errorf("metrics request failed with status %d: %s", resp.StatusCode, string(body))
// 	}

// 	// Parse the batch response format
// 	var batchResponse struct {
// 		Results map[string]struct {
// 			TotalShareStatistics struct {
// 				ShareCount      int `json:"shareCount"`
// 				CommentCount    int `json:"commentCount"`
// 				LikeCount       int `json:"likeCount"`
// 				ImpressionCount int `json:"impressionCount"`
// 				ClickCount      int `json:"clickCount"`
// 			} `json:"totalShareStatistics"`
// 		} `json:"results"`
// 	}

// 	if err := json.NewDecoder(strings.NewReader(string(body))).Decode(&batchResponse); err != nil {
// 		return nil, fmt.Errorf("failed to decode batch metrics response: %w", err)
// 	}

// 	// Find our post in the results
// 	postKey := fmt.Sprintf("urn:li:ugcPost:%s", postID)
// 	if result, exists := batchResponse.Results[postKey]; exists {
// 		stats := result.TotalShareStatistics
// 		return &models.LinkedInPostMetrics{
// 			Impressions: stats.ImpressionCount,
// 			Clicks:      stats.ClickCount,
// 			Likes:       stats.LikeCount,
// 			Comments:    stats.CommentCount,
// 			Shares:      stats.ShareCount,
// 		}, nil
// 	}

// 	// No metrics found - return empty metrics
// 	return &models.LinkedInPostMetrics{}, nil
// }

// Updated GetPostMetrics to handle different ID formats
func (s *linkedInClient) GetPostMetrics(ctx context.Context, accessToken, postID string) (*models.LinkedInPostMetrics, error) {
	s.logger.Debug("Getting metrics for post", zap.String("post_id", postID))

	// FIXED: Handle different ID formats
	var ugcPostURN string

	if strings.HasPrefix(postID, "urn:li:ugcPost:") {
		// Already in UGC format
		ugcPostURN = postID
	} else if after, ok := strings.CutPrefix(postID, "urn:li:share:"); ok {
		// Convert share URN to UGC URN - extract the numeric ID
		shareID := after
		ugcPostURN = fmt.Sprintf("urn:li:ugcPost:%s", shareID)
	} else {
		ugcPostURN = fmt.Sprintf("urn:li:ugcPost:%s", postID)
	}

	s.logger.Debug("Using UGC URN for metrics", zap.String("ugc_urn", ugcPostURN))

	// Try the batch statistics API
	metricsURL := fmt.Sprintf("%s/v2/ugcPostStatistics", s.apiConfig.BaseURL)

	// URL encode the URN properly
	encodedURN := url.QueryEscape(ugcPostURN)
	params := fmt.Sprintf("ugcPosts=List(%s)", encodedURN)
	fullURL := fmt.Sprintf("%s?%s", metricsURL, params)

	req, err := http.NewRequestWithContext(ctx, "GET", fullURL, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create metrics request: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+accessToken)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Restli-Protocol-Version", "2.0.0")

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to get metrics: %w", err)
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)

	s.logger.Debug("LinkedIn UGC metrics response",
		zap.String("url", fullURL),
		zap.Int("status", resp.StatusCode),
		zap.String("body", string(body)))

	if resp.StatusCode == 404 {
		// Post might be too new or doesn't exist - return empty metrics
		s.logger.Warn("Post not found for metrics", zap.String("ugc_urn", ugcPostURN))
		return &models.LinkedInPostMetrics{}, nil
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("metrics request failed with status %d: %s", resp.StatusCode, string(body))
	}

	// Parse the response
	var metricsResponse struct {
		Results map[string]struct {
			TotalShareStatistics struct {
				ShareCount      int `json:"shareCount"`
				CommentCount    int `json:"commentCount"`
				LikeCount       int `json:"likeCount"`
				ImpressionCount int `json:"impressionCount"`
				ClickCount      int `json:"clickCount"`
			} `json:"totalShareStatistics"`
		} `json:"results"`
	}

	if err := json.Unmarshal(body, &metricsResponse); err != nil {
		return nil, fmt.Errorf("failed to decode metrics response: %w", err)
	}

	// Find our post in the results
	if result, exists := metricsResponse.Results[ugcPostURN]; exists {
		stats := result.TotalShareStatistics
		return &models.LinkedInPostMetrics{
			Impressions: stats.ImpressionCount,
			Clicks:      stats.ClickCount,
			Likes:       stats.LikeCount,
			Comments:    stats.CommentCount,
			Shares:      stats.ShareCount,
		}, nil
	}

	// No metrics found - return empty metrics
	s.logger.Info("No metrics found for post", zap.String("ugc_urn", ugcPostURN))
	return &models.LinkedInPostMetrics{}, nil
}

func (s *linkedInClient) RefreshToken(ctx context.Context, refreshToken string) (*models.LinkedInTokenResponse, error) {
	data := url.Values{
		"grant_type":    {"refresh_token"},
		"refresh_token": {refreshToken},
		"client_id":     {s.config.ClientID},
		"client_secret": {s.config.ClientSecret},
	}

	req, err := http.NewRequestWithContext(ctx, "POST", "https://www.linkedin.com/oauth/v2/accessToken", strings.NewReader(data.Encode()))
	if err != nil {
		return nil, fmt.Errorf("failed to create refresh request: %w", err)
	}

	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to refresh token: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("token refresh failed with status %d: %s", resp.StatusCode, string(body))
	}

	var tokenResp models.LinkedInTokenResponse
	if err := json.NewDecoder(resp.Body).Decode(&tokenResp); err != nil {
		return nil, fmt.Errorf("failed to decode refresh response: %w", err)
	}

	return &tokenResp, nil
}

func (s *linkedInClient) ValidateToken(ctx context.Context, accessToken string) error {
	req, err := http.NewRequestWithContext(ctx, "GET", "https://api.linkedin.com/v2/userinfo", nil)
	if err != nil {
		return fmt.Errorf("failed to create validation request: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+accessToken)

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("failed to validate token: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusUnauthorized {
		return fmt.Errorf("token is invalid or expired")
	}

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("token validation failed with status %d", resp.StatusCode)
	}

	return nil
}

// Generate OAuth state with cryptographically secure random string
func (s *linkedInClient) generateState(workspaceID, userID uuid.UUID, platform string) (string, error) {
	// Generate secure random state token
	randomBytes := make([]byte, 16)
	if _, err := rand.Read(randomBytes); err != nil {
		return "", fmt.Errorf("failed to generate random state: %w", err)
	}

	stateToken := hex.EncodeToString(randomBytes)

	state := models.OAuthState{
		State:       stateToken,
		WorkspaceID: workspaceID,
		UserID:      userID,
		Platform:    platform,
		CreatedAt:   time.Now(),
	}

	// Store state in Redis with 30 minute expiration
	stateJSON, err := json.Marshal(state)
	if err != nil {
		return "", fmt.Errorf("failed to marshal OAuth state: %w", err)
	}

	cacheKey := fmt.Sprintf("oauth_state:%s", stateToken)
	if err := s.cacheService.Set(context.Background(), cacheKey, string(stateJSON), 30*time.Minute); err != nil {
		s.logger.Warn("Failed to cache OAuth state", zap.Error(err))
		// Continue anyway - state validation will just fail gracefully
	}

	return stateToken, nil
}

func (s *linkedInClient) validateState(ctx context.Context, stateToken string) (*models.OAuthState, error) {
	cacheKey := fmt.Sprintf("oauth_state:%s", stateToken)

	// Get state from Redis
	var state models.OAuthState
	if err := s.cacheService.Get(ctx, cacheKey, &state); err != nil {
		return nil, fmt.Errorf("state not found or expired: %w", err)
	}

	// Verify state token matches
	if state.State != stateToken {
		return nil, fmt.Errorf("state token mismatch")
	}

	// Check if state is not too old (additional safety check)
	if time.Since(state.CreatedAt) > 30*time.Minute {
		return nil, fmt.Errorf("state has expired")
	}

	// Clean up used state token
	s.cacheService.Delete(ctx, cacheKey)

	return &state, nil
}

// BuildLinkedInPostRequest creates a LinkedIn post request from social post
// func BuildLinkedInPostRequest(content string, mediaURLs []string) *models.LinkedInPostRequest {
// 	req := &models.LinkedInPostRequest{
// 		Author:         "", // This will be set by the caller
// 		LifecycleState: "PUBLISHED",
// 		SpecificContent: map[string]interface{}{
// 			"com.linkedin.ugc.ShareContent": map[string]interface{}{
// 				"shareCommentary": map[string]interface{}{
// 					"text": content,
// 				},
// 				"shareMediaCategory": "NONE",
// 			},
// 		},
// 		Visibility: map[string]interface{}{
// 			"com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
// 		},
// 	}

// 	return req
// }

func (s *linkedInClient) EnsurePersonURN(identifier string) string {
	if strings.HasPrefix(identifier, "urn:li:person:") {
		return identifier
	}

	return fmt.Sprintf("urn:li:person:%s", identifier)
}
