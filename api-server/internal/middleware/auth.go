package middleware

import (
	"context"
	"crypto/tls"
	"crypto/x509"
	"fmt"
	"net/http"
	"os"
	"time"

	firebase "firebase.google.com/go/v4"
	"firebase.google.com/go/v4/auth"
	"github.com/ifeanyidike/cenphi/internal/config"
	"go.uber.org/zap"
	"google.golang.org/api/option"
)

type contextKey string

const userKey contextKey = "user"

type AuthMiddleware struct {
	app     *firebase.App
	client  *auth.Client
	logging *zap.Logger
}

// func NewAuthMiddleware(projectID string, logger *zap.Logger) (*AuthMiddleware, error) {
// 	credentialsFile := "cenphiio-service-account.json"
// 	path, err := config.FindFile(credentialsFile)

// 	if err != nil {
// 		return nil, fmt.Errorf("failed to find credentials file: %w", err)
// 	}

// 	opt := option.WithCredentialsFile(path)
// 	app, err := firebase.NewApp(context.Background(), nil, opt)
// 	if err != nil {
// 		return nil, err
// 	}

// 	return &AuthMiddleware{
// 		app:     app,
// 		logging: logger,
// 	}, nil
// }

// func NewAuthMiddleware(projectID string, logger *zap.Logger) (*AuthMiddleware, error) {
// 	credentialsFile := "cenphiio-service-account.json"
// 	path, err := config.FindFile(credentialsFile)

// 	if err != nil {
// 		return nil, fmt.Errorf("failed to find credentials file: %w", err)
// 	}

// 	// Create a new cert pool
// 	rootCAs := x509.NewCertPool()

// 	// Load Google's root certificates
// 	googleCerts, err := os.ReadFile("/app/google_roots.pem")
// 	if err != nil {
// 		logger.Warn("Failed to read Google root certificates", zap.Error(err))
// 	} else {
// 		if !rootCAs.AppendCertsFromPEM(googleCerts) {
// 			logger.Warn("Failed to append Google certificates to pool")
// 		} else {
// 			logger.Info("Successfully added Google certificates")
// 		}
// 	}

// 	// Try to add system certs as a fallback
// 	systemPool, err := x509.SystemCertPool()
// 	if err == nil && systemPool != nil {
// 		// Directly use the system pool instead of trying to extract and re-add certificates
// 		rootCAs = systemPool

// 		// Then append our Google certs to the system pool
// 		if googleCerts != nil {
// 			rootCAs.AppendCertsFromPEM(googleCerts)
// 		}
// 	}

// 	// Create HTTP client with our cert pool
// 	httpClient := &http.Client{
// 		Transport: &http.Transport{
// 			TLSClientConfig: &tls.Config{
// 				RootCAs: rootCAs,
// 			},
// 		},
// 	}

// 	opt := option.WithCredentialsFile(path)
// 	clientOpt := option.WithHTTPClient(httpClient)
// 	app, err := firebase.NewApp(context.Background(), nil, opt, clientOpt)
// 	if err != nil {
// 		return nil, err
// 	}

// 	return &AuthMiddleware{
// 		app:     app,
// 		logging: logger,
// 	}, nil
// }

func NewAuthMiddleware(projectID string, logger *zap.Logger) (*AuthMiddleware, error) {
	// Find Firebase credentials file
	credentialsFile := "cenphiio-service-account.json"
	path, err := config.FindFile(credentialsFile)
	if err != nil {
		return nil, fmt.Errorf("failed to find credentials file: %w", err)
	}
	logger.Info("Using Firebase credentials file", zap.String("path", path))

	// Initialize certificate pool with system certs
	rootCAs, err := x509.SystemCertPool()
	if err != nil {
		logger.Warn("Failed to get system certificate pool, creating new one", zap.Error(err))
		rootCAs = x509.NewCertPool()
	}

	// Try to add Google's root certificates
	googleCertsPath := "google_roots.pem"
	googleCertsFullPath, err := config.FindFile(googleCertsPath)
	if err == nil {
		// Found the Google certs file
		googleCerts, err := os.ReadFile(googleCertsFullPath)
		if err != nil {
			logger.Warn("Failed to read Google root certificates", zap.Error(err), zap.String("path", googleCertsFullPath))
		} else {
			// Add Google certs to our pool
			if !rootCAs.AppendCertsFromPEM(googleCerts) {
				logger.Warn("Failed to append Google certificates to pool", zap.String("path", googleCertsFullPath))
			} else {
				logger.Info("Successfully added Google certificates", zap.String("path", googleCertsFullPath))
			}
		}
	} else {
		logger.Warn("Google root certificates file not found", zap.Error(err))
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

	// Create Firebase app with our custom client
	ctx := context.Background()
	opts := []option.ClientOption{
		option.WithCredentialsFile(path),
		option.WithHTTPClient(httpClient),
	}

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

// func (m *AuthMiddleware) VerifyToken(next http.Handler) http.Handler {
// 	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
// 		header := r.Header.Get("Authorization")
// 		if header == "" {
// 			m.logging.Warn("missing or invalid token", zap.String("path", r.URL.Path))
// 			http.Error(w, "Missing or invalid token", http.StatusUnauthorized)
// 			return
// 		}
// 		t := strings.TrimPrefix(header, "Bearer ")
// 		auth, err := m.app.Auth(r.Context())
// 		if err != nil {
// 			m.logging.Error("failed to create auth client", zap.Error(err))
// 			http.Error(w, "Failed to create auth client", http.StatusInternalServerError)
// 			return
// 		}

// 		token, err := auth.VerifyIDToken(r.Context(), t)
// 		if err != nil {
// 			m.logging.Error("failed to verify token", zap.Error(err))
// 			http.Error(w, "Failed to verify token", http.StatusUnauthorized)
// 			return
// 		}
// 		ctx := context.WithValue(r.Context(), userKey, token)
// 		next.ServeHTTP(w, r.WithContext(ctx))
// 	})
// }

// VerifyToken middleware to check if the request has a valid firebase token
func (am *AuthMiddleware) VerifyToken(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Get token from Authorization header
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			http.Error(w, "Authorization header is required", http.StatusUnauthorized)
			return
		}

		// Remove 'Bearer ' prefix if present
		idToken := authHeader
		if len(authHeader) > 7 && authHeader[:7] == "Bearer " {
			idToken = authHeader[7:]
		}

		// Create context with reasonable timeout
		ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
		defer cancel()

		// Verify the token
		token, err := am.client.VerifyIDToken(ctx, idToken)
		if err != nil {
			am.logging.Error("failed to verify token",
				zap.Error(err),
				zap.String("caller", "AuthMiddleware.VerifyToken"))
			http.Error(w, "Invalid token", http.StatusUnauthorized)
			return
		}

		// Add verified user ID to context
		newCtx := context.WithValue(r.Context(), userKey, token.UID)

		// Continue with the next handler
		next.ServeHTTP(w, r.WithContext(newCtx))
	})
}
