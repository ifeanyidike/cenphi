package middleware

import (
	"context"
	"crypto/tls"
	"crypto/x509"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"time"

	firebase "firebase.google.com/go/v4"
	"firebase.google.com/go/v4/auth"
	"github.com/ifeanyidike/cenphi/internal/config"
	"go.uber.org/zap"
	"google.golang.org/api/option"
)

type UserContextKey string

const UserKey UserContextKey = "user"

type AuthMiddleware struct {
	app     *firebase.App
	client  *auth.Client
	logging *zap.Logger
}

func NewAuthMiddleware(projectID string, logger *zap.Logger) (*AuthMiddleware, error) {
	// Check if running in Cloud Run (has ADC available)
	isCloudRun := os.Getenv("K_SERVICE") != ""

	var path string
	var err error

	if !isCloudRun {
		// Local development: Find Firebase credentials file
		// Try new project first, then fall back to old project
		credentialFiles := []string{
			"cenphi-ai-service-account.json",  // New project (cenphi-ai)
			"cenphiio-service-account.json",   // Old project (cenphiio)
		}

		for _, credFile := range credentialFiles {
			path, err = config.FindFile(credFile)
			if err == nil {
				logger.Info("Using Firebase credentials file",
					zap.String("path", path),
					zap.String("file", credFile))
				break
			}
		}

		if path == "" {
			return nil, fmt.Errorf("failed to find credentials file (tried: %v)", credentialFiles)
		}
	} else {
		// Cloud Run: Use Application Default Credentials
		logger.Info("Running in Cloud Run, using Application Default Credentials")
	}

	// Initialize certificate pool with system certs
	rootCAs, err := x509.SystemCertPool()
	if err != nil {
		logger.Warn("Failed to get system certificate pool, creating new one", zap.Error(err))
		rootCAs = x509.NewCertPool()
	}

	// Try multiple locations for Google's root certificates
	possiblePaths := []string{
		"google_roots.pem",      // Current directory
		"/app/google_roots.pem", // App directory
		"/app/certs/google_roots.pem",
		"/app/certs/cacert.pem",
		"/usr/local/share/ca-certificates/google_roots.crt", // Where we installed in Dockerfile
		"/etc/ssl/certs/ca-certificates.crt",                // System certificates
	}

	certsLoaded := false
	for _, certPath := range possiblePaths {
		fullPath, _ := config.FindFile(certPath)
		if fullPath == "" {
			fullPath = certPath // Use absolute path if FindFile fails
		}

		certs, err := os.ReadFile(fullPath)
		if err != nil {
			logger.Debug("Could not read certificates from path", zap.String("path", fullPath), zap.Error(err))
			continue
		}

		if !rootCAs.AppendCertsFromPEM(certs) {
			logger.Warn("Failed to append certificates to pool", zap.String("path", fullPath))
			continue
		}

		logger.Info("Successfully added certificates", zap.String("path", fullPath))
		certsLoaded = true
	}

	if !certsLoaded {
		logger.Warn("Could not load any certificates, trying direct download")
		// Try direct download as last resort
		client := &http.Client{
			Timeout: 30 * time.Second,
			Transport: &http.Transport{
				TLSClientConfig: &tls.Config{
					InsecureSkipVerify: true, // Only for this certificate download
				},
			},
		}

		resp, err := client.Get("https://pki.goog/roots.pem")
		if err != nil {
			logger.Warn("Failed to download Google certificates", zap.Error(err))
		} else {
			defer resp.Body.Close()
			googleCerts, err := io.ReadAll(resp.Body)
			if err != nil {
				logger.Warn("Failed to read downloaded certificates", zap.Error(err))
			} else if !rootCAs.AppendCertsFromPEM(googleCerts) {
				logger.Warn("Failed to append downloaded certificates to pool")
			} else {
				logger.Info("Successfully downloaded and added Google certificates")
				certsLoaded = true
			}
		}
	}

	if !certsLoaded {
		logger.Error("Could not load any certificates, SSL verification will likely fail")
	}

	// Create a custom HTTP client with our certificate pool
	httpClient := &http.Client{
		Transport: &http.Transport{
			TLSClientConfig: &tls.Config{
				RootCAs:    rootCAs,
				MinVersion: tls.VersionTLS12,
			},
			// Add reasonable timeouts
			ResponseHeaderTimeout: 30 * time.Second,
			ExpectContinueTimeout: 10 * time.Second,
			IdleConnTimeout:       90 * time.Second,
		},
		Timeout: 60 * time.Second,
	}

	// Test connection to Google API before proceeding
	testCtx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	testReq, _ := http.NewRequestWithContext(testCtx, "HEAD",
		"https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com", nil)
	testResp, testErr := httpClient.Do(testReq)
	if testErr != nil {
		logger.Error("Test connection to Google API failed", zap.Error(testErr))
	} else {
		testResp.Body.Close()
		logger.Info("Test connection to Google API succeeded", zap.Int("status", testResp.StatusCode))
	}

	// Create Firebase app with our custom client
	ctx := context.Background()
	opts := []option.ClientOption{
		option.WithHTTPClient(httpClient),
	}

	// Only add credentials file in local development
	if !isCloudRun && path != "" {
		opts = append(opts, option.WithCredentialsFile(path))
	}
	// In Cloud Run, ADC is automatically used when no explicit credentials are provided

	app, err := firebase.NewApp(ctx, nil, opts...)
	if err != nil {
		return nil, fmt.Errorf("failed to initialize firebase app: %w", err)
	}

	// Initialize the auth client
	client, err := app.Auth(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to initialize firebase auth client: %w", err)
	}

	return &AuthMiddleware{
		app:     app,
		client:  client,
		logging: logger,
	}, nil
}

// VerifyToken middleware to check if the request has a valid firebase token
func (am *AuthMiddleware) VerifyToken(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Get token from Authorization header
		authHeader := r.Header.Get("Authorization")
		sseToken := r.URL.Query().Get("token")
		if authHeader == "" && sseToken == "" {
			// check if it's sse route
			http.Error(w, "Authorization header is required", http.StatusUnauthorized)
			return
		}

		// Remove 'Bearer ' prefix if present
		idToken := authHeader
		if len(authHeader) > 7 && authHeader[:7] == "Bearer " {
			idToken = authHeader[7:]
		}

		if authHeader == "" {
			idToken = sseToken
		}
		// Verify the token
		token, err := am.verifyTokenWithRetry(r.Context(), idToken, 3)
		if err != nil {
			am.logging.Error("failed to verify token",
				zap.Error(err),
				zap.String("caller", "AuthMiddleware.VerifyToken"))
			http.Error(w, "Invalid token", http.StatusUnauthorized)
			return
		}

		// Add verified user ID to context
		newCtx := context.WithValue(r.Context(), UserKey, token.UID)

		// Continue with the next handler
		next.ServeHTTP(w, r.WithContext(newCtx))
	})
}

func (am *AuthMiddleware) verifyTokenWithRetry(ctx context.Context, idToken string, maxRetries int) (*auth.Token, error) {
	var lastErr error

	for attempt := 0; attempt <= maxRetries; attempt++ {
		// Create a new context for each attempt to avoid cancellation propagation
		attemptCtx, cancel := context.WithTimeout(context.Background(), 60*time.Second)

		token, err := am.client.VerifyIDToken(attemptCtx, idToken)
		cancel()

		if err == nil {
			return token, nil
		}

		lastErr = err

		// Don't retry on certain types of errors (invalid token format, etc.)
		if isNonRetryableError(err) {
			break
		}

		if attempt < maxRetries {
			// Exponential backoff: 500ms, 1s, 2s
			backoff := time.Duration(500*(1<<attempt)) * time.Millisecond
			am.logging.Warn("Token verification failed, retrying",
				zap.Int("attempt", attempt+1),
				zap.Duration("backoff", backoff),
				zap.Error(err))

			select {
			case <-time.After(backoff):
				continue
			case <-ctx.Done():
				return nil, ctx.Err()
			}
		}
	}

	return nil, lastErr
}

func isNonRetryableError(err error) bool {
	errStr := err.Error()
	// Don't retry on obvious auth failures
	return strings.Contains(errStr, "invalid") ||
		strings.Contains(errStr, "malformed") ||
		strings.Contains(errStr, "expired")
}

func GetUserFromContext(ctx context.Context) (string, error) {
	val := ctx.Value(UserKey)
	if val == nil {
		return "", errors.New("user not found in context")
	}

	uid, ok := val.(string)
	if !ok {
		return "", errors.New("invalid user ID type in context")
	}

	return uid, nil
}
