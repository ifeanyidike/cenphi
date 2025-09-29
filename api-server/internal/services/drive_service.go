// internal/services/drive_service.go
package services

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"slices"
	"time"

	"github.com/google/uuid"
	"github.com/ifeanyidike/cenphi/internal/cache"
	"github.com/ifeanyidike/cenphi/internal/config"
	"github.com/ifeanyidike/cenphi/internal/middleware"
	"github.com/ifeanyidike/cenphi/internal/repositories"
	"go.uber.org/zap"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
	"google.golang.org/api/drive/v3"
	"google.golang.org/api/option"
)

type DriveService struct {
	service     *drive.Service
	logger      *zap.Logger
	config      config.GoogleDriveConfig
	cache       cache.RedisCache
	oauthConfig *oauth2.Config
	db          *sql.DB
	repo        repositories.GoogleDriveRepository
	userRepo    repositories.UserRepository
}

type DriveFile struct {
	ID           string `json:"id"`
	Name         string `json:"name"`
	MimeType     string `json:"mime_type"`
	Size         int64  `json:"size"`
	DownloadURL  string `json:"download_url"`
	WebViewLink  string `json:"web_view_link"`
	CreatedTime  string `json:"created_time"`
	ModifiedTime string `json:"modified_time"`
}

type DriveAuthState struct {
	State       string    `json:"state"`
	WorkspaceID uuid.UUID `json:"workspace_id"`
	UserID      uuid.UUID `json:"user_id"`
	CreatedAt   time.Time `json:"created_at"`
}

// NewDriveService creates a new Drive service instance
func NewDriveService(config config.GoogleDriveConfig,
	cache cache.RedisCache,
	repo repositories.GoogleDriveRepository,
	userRepo repositories.UserRepository,
	db *sql.DB,
	logger *zap.Logger,
) *DriveService {
	oauthConfig := &oauth2.Config{
		ClientID:     config.ClientID,
		ClientSecret: config.ClientSecret,
		RedirectURL:  config.RedirectURI,
		Scopes:       []string{config.Scopes},
		Endpoint:     google.Endpoint,
	}

	return &DriveService{
		logger:      logger,
		config:      config,
		cache:       cache,
		oauthConfig: oauthConfig,
		repo:        repo,
		userRepo:    userRepo,
		db:          db,
	}
}

// GetAuthURL generates OAuth URL for Google Drive authentication
func (ds *DriveService) GetAuthURL(ctx context.Context, workspaceID uuid.UUID) (string, error) {
	userUID, err := middleware.GetUserFromContext(ctx)
	if err != nil {
		return "", err
	}

	user, err := ds.userRepo.FindByUID(ctx, userUID, ds.db)
	if err != nil {
		return "", err
	}

	state := DriveAuthState{
		State:       generateSecureState(),
		WorkspaceID: workspaceID,
		UserID:      user.ID,
		CreatedAt:   time.Now(),
	}

	// Store state in cache for 30 minutes
	stateJSON, err := json.Marshal(state)
	if err != nil {
		return "", fmt.Errorf("failed to marshal auth state: %w", err)
	}

	cacheKey := fmt.Sprintf("drive_oauth_state:%s", state.State)
	if err := ds.cache.Set(context.Background(), cacheKey, string(stateJSON), 30*time.Minute); err != nil {
		ds.logger.Warn("Failed to cache OAuth state", zap.Error(err))
	}

	// return ds.oauthConfig.AuthCodeURL(state.State, oauth2.AccessTypeOffline), nil

	// For testing, we'll force refresh token
	return ds.oauthConfig.AuthCodeURL(state.State,
		oauth2.AccessTypeOffline,
		oauth2.SetAuthURLParam("prompt", "consent"),
	), nil
}

// HandleOAuthCallback processes OAuth callback and returns tokens
func (ds *DriveService) HandleOAuthCallback(ctx context.Context, code, state string) (*oauth2.Token, *DriveAuthState, error) {
	// Validate state
	authState, err := ds.validateState(ctx, state)
	if err != nil {
		return nil, nil, fmt.Errorf("invalid state: %w", err)
	}

	// Exchange code for token
	token, err := ds.oauthConfig.Exchange(ctx, code)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to exchange code: %w", err)
	}

	return token, authState, nil
}

// CreateServiceWithToken creates authenticated Drive service for user
func (ds *DriveService) CreateServiceWithToken(ctx context.Context, token *oauth2.Token) (*DriveService, error) {
	client := ds.oauthConfig.Client(ctx, token)

	service, err := drive.NewService(ctx, option.WithHTTPClient(client))
	if err != nil {
		return nil, fmt.Errorf("failed to create drive service: %w", err)
	}

	authenticatedService := &DriveService{
		service:     service,
		logger:      ds.logger,
		config:      ds.config,
		cache:       ds.cache,
		oauthConfig: ds.oauthConfig,
	}

	return authenticatedService, nil
}

// ListFiles lists files in Google Drive with optional query
func (ds *DriveService) ListFiles(ctx context.Context, query string, pageSize int) ([]DriveFile, error) {
	if ds.service == nil {
		return nil, fmt.Errorf("drive service not authenticated")
	}

	call := ds.service.Files.List().
		Context(ctx).
		Fields("files(id,name,mimeType,size,webViewLink,createdTime,modifiedTime)").
		PageSize(int64(pageSize))

	if query != "" {
		call = call.Q(query)
	}

	response, err := call.Do()
	if err != nil {
		return nil, fmt.Errorf("failed to list files: %w", err)
	}

	var files []DriveFile
	for _, file := range response.Files {
		driveFile := DriveFile{
			ID:           file.Id,
			Name:         file.Name,
			MimeType:     file.MimeType,
			WebViewLink:  file.WebViewLink,
			CreatedTime:  file.CreatedTime,
			ModifiedTime: file.ModifiedTime,
		}

		if file.Size != 0 {
			driveFile.Size = file.Size
		}

		if ds.isDownloadableType(file.MimeType) {
			driveFile.DownloadURL = fmt.Sprintf("https://drive.google.com/uc?export=download&id=%s", file.Id)
		}

		files = append(files, driveFile)
	}

	return files, nil
}

// ListTestimonialFiles specifically looks for video and document files
func (ds *DriveService) ListTestimonialFiles(ctx context.Context) ([]DriveFile, error) {
	query := "(" +
		"mimeType contains 'video/' or " +
		"mimeType='application/pdf' or " +
		"mimeType='text/plain' or " +
		"mimeType='application/vnd.openxmlformats-officedocument.wordprocessingml.document' or " +
		"mimeType='application/msword'" +
		") and trashed=false"

	return ds.ListFiles(ctx, query, 100)
}

// DownloadFile downloads a file from Google Drive
func (ds *DriveService) DownloadFile(ctx context.Context, fileID string) (io.ReadCloser, error) {
	if ds.service == nil {
		return nil, fmt.Errorf("drive service not authenticated")
	}

	response, err := ds.service.Files.Get(fileID).Context(ctx).Download()
	if err != nil {
		return nil, fmt.Errorf("failed to download file: %w", err)
	}

	return response.Body, nil
}

// GetFileMetadata retrieves metadata for a specific file
func (ds *DriveService) GetFileMetadata(ctx context.Context, fileID string) (*DriveFile, error) {
	if ds.service == nil {
		return nil, fmt.Errorf("drive service not authenticated")
	}

	file, err := ds.service.Files.Get(fileID).
		Context(ctx).
		Fields("id,name,mimeType,size,webViewLink,createdTime,modifiedTime").
		Do()
	if err != nil {
		return nil, fmt.Errorf("failed to get file metadata: %w", err)
	}

	driveFile := &DriveFile{
		ID:           file.Id,
		Name:         file.Name,
		MimeType:     file.MimeType,
		WebViewLink:  file.WebViewLink,
		CreatedTime:  file.CreatedTime,
		ModifiedTime: file.ModifiedTime,
	}

	if file.Size != 0 {
		driveFile.Size = file.Size
	}

	if ds.isDownloadableType(file.MimeType) {
		driveFile.DownloadURL = fmt.Sprintf("https://drive.google.com/uc?export=download&id=%s", file.Id)
	}

	return driveFile, nil
}

func (ds *DriveService) GetUserInfo(ctx context.Context) (map[string]string, error) {
	if ds.service == nil {
		return nil, fmt.Errorf("drive service not authenticated")
	}

	about, err := ds.service.About.Get().Fields("user").Context(ctx).Do()
	if err != nil {
		return nil, fmt.Errorf("failed to get user info: %w", err)
	}

	accountInfo := map[string]string{}
	if about.User != nil {
		if about.User.EmailAddress != "" {
			accountInfo["email"] = about.User.EmailAddress
		}
		if about.User.DisplayName != "" {
			accountInfo["name"] = about.User.DisplayName
		}
	}

	return accountInfo, nil
}

func (ds *DriveService) SaveUserAccount(ctx context.Context, workspaceID, userID uuid.UUID, token *oauth2.Token, accountInfo map[string]string) error {

	account := repositories.GoogleDriveAccount{
		ID:          uuid.New(),
		WorkspaceID: workspaceID,
		UserID:      userID,
		AccessToken: token.AccessToken,
		TokenType:   token.TokenType,
		Status:      "connected",
	}

	if token.RefreshToken != "" {
		account.RefreshToken = &token.RefreshToken
	}

	if !token.Expiry.IsZero() {
		account.ExpiresAt = &token.Expiry
	}

	if email, ok := accountInfo["email"]; ok {
		account.AccountEmail = &email
	}

	if name, ok := accountInfo["name"]; ok {
		account.AccountName = &name
	}

	return ds.repo.SaveAccount(ctx, account, ds.db)
}

func (ds *DriveService) GetUserAccount(ctx context.Context, workspaceID, userID uuid.UUID) (repositories.GoogleDriveAccount, error) {
	return ds.repo.GetAccount(ctx, workspaceID, userID, ds.db)
}

// GetWorkspaceAccounts gets all Google Drive accounts for a workspace
func (ds *DriveService) GetWorkspaceAccounts(ctx context.Context, workspaceID uuid.UUID) ([]repositories.GoogleDriveAccount, error) {
	return ds.repo.GetAccountsByWorkspace(ctx, workspaceID, ds.db)
}

func (ds *DriveService) GetStoredToken(ctx context.Context, workspaceID, userID uuid.UUID) (*oauth2.Token, error) {
	account, err := ds.repo.GetAccount(ctx, workspaceID, userID, ds.db)
	if err != nil {
		return nil, err
	}

	tkn := account.AccessToken
	ds.logger.Info("account data: ", zap.String("token string: ", tkn))
	if tkn == "" {
		return nil, fmt.Errorf("token is empty")
	}

	token := &oauth2.Token{
		AccessToken: account.AccessToken,
		TokenType:   "Bearer",
	}

	// Add nil checks before dereferencing
	if account.RefreshToken != nil {
		token.RefreshToken = *account.RefreshToken
	}

	if account.ExpiresAt != nil {
		token.Expiry = *account.ExpiresAt
	}

	return token, nil
}

// func (ds *DriveService) RefreshTokenIfNeeded(ctx context.Context, account *models.GoogleDriveAccount) (*oauth2.Token, error) {
func (ds *DriveService) RefreshTokenIfNeeded(ctx context.Context, workspaceID uuid.UUID) (*oauth2.Token, error) {
	userUID, err := middleware.GetUserFromContext(ctx)
	if err != nil {
		return nil, err
	}

	user, err := ds.userRepo.FindByUID(ctx, userUID, ds.db)
	if err != nil {
		return nil, err
	}

	account, err := ds.GetUserAccount(ctx, workspaceID, user.ID)
	if err != nil {
		return nil, err
	}

	token := account.ToOAuth2Token()

	// Check if token needs refresh
	if token.Valid() {
		return token, nil
	}

	// Refresh the token
	tokenSource := ds.oauthConfig.TokenSource(ctx, token)
	newToken, err := tokenSource.Token()
	if err != nil {
		return nil, fmt.Errorf("failed to refresh token: %w", err)
	}

	// Update database with new token
	err = ds.repo.UpdateTokens(ctx, account.ID, newToken.AccessToken, newToken.RefreshToken, &newToken.Expiry, ds.db)
	if err != nil {
		ds.logger.Warn("Failed to update refreshed token", zap.Error(err))
	}

	return newToken, nil
}

// Helper methods
func (ds *DriveService) isDownloadableType(mimeType string) bool {
	downloadableTypes := []string{
		"video/mp4", "video/avi", "video/quicktime", "video/webm", "video/mov",
		"application/pdf", "text/plain",
		"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
		"application/msword",
	}

	return slices.Contains(downloadableTypes, mimeType)
}

func (ds *DriveService) validateState(ctx context.Context, state string) (*DriveAuthState, error) {
	cacheKey := fmt.Sprintf("drive_oauth_state:%s", state)

	var authState DriveAuthState
	err := ds.cache.Get(ctx, cacheKey, &authState)
	if err != nil {
		return nil, fmt.Errorf("state not found or expired")
	}

	// Verify state matches
	if authState.State != state {
		return nil, fmt.Errorf("state mismatch")
	}

	// Check expiration
	if time.Since(authState.CreatedAt) > 30*time.Minute {
		return nil, fmt.Errorf("state expired")
	}

	// Clean up used state
	ds.cache.Delete(ctx, cacheKey)

	return &authState, nil
}

func generateSecureState() string {
	return uuid.New().String()
}

// func (ds *DriveService) ListFilesWithPagination(ctx context.Context, query string, pageSize int) ([]DriveFile, error) {
// 	var allFiles []DriveFile
// 	nextPageToken := ""

// 	for {
// 		call := ds.service.Files.List().
// 			Context(ctx).
// 			Fields("nextPageToken,files(id,name,mimeType,size,webViewLink,modifiedTime,createdTime)").
// 			PageSize(int64(pageSize))

// 		if query != "" {
// 			call = call.Q(query)
// 		}

// 		if nextPageToken != "" {
// 			call = call.PageToken(nextPageToken)
// 		}

// 		response, err := call.Do()
// 		if err != nil {
// 			return nil, fmt.Errorf("failed to list files: %w", err)
// 		}

// 		for _, file := range response.Files {
// 			driveFile := DriveFile{
// 				ID:           file.Id,
// 				Name:         file.Name,
// 				MimeType:     file.MimeType,
// 				WebViewLink:  file.WebViewLink,
// 				ModifiedTime: file.ModifiedTime,
// 				CreatedTime:  file.CreatedTime,
// 			}

// 			if file.Size != 0 {
// 				driveFile.Size = file.Size
// 			}

// 			// Generate download URL for supported file types
// 			if ds.isDownloadableType(file.MimeType) {
// 				driveFile.DownloadURL = fmt.Sprintf("https://drive.google.com/uc?export=download&id=%s", file.Id)
// 			}

// 			allFiles = append(allFiles, driveFile)
// 		}

// 		nextPageToken = response.NextPageToken
// 		if nextPageToken == "" {
// 			break
// 		}
// 	}

// 	return allFiles, nil
// }
