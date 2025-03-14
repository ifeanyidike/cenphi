package middleware

import (
	"context"
	"fmt"
	"net/http"
	"strings"

	firebase "firebase.google.com/go/v4"
	"github.com/ifeanyidike/cenphi/internal/config"
	"go.uber.org/zap"
	"google.golang.org/api/option"
)

type contextKey string

const userKey contextKey = "user"

type AuthMiddleware struct {
	app     *firebase.App
	logging *zap.Logger
}

func NewAuthMiddleware(projectID string, logger *zap.Logger) (*AuthMiddleware, error) {
	credentialsFile := "cenphiio-service-account.json"
	path, err := config.FindFile(credentialsFile)

	if err != nil {
		return nil, fmt.Errorf("failed to find credentials file: %w", err)
	}

	opt := option.WithCredentialsFile(path)
	app, err := firebase.NewApp(context.Background(), nil, opt)
	if err != nil {
		return nil, err
	}

	return &AuthMiddleware{
		app:     app,
		logging: logger,
	}, nil
}

// func NewAuthMiddleware(projectID string, logger *zap.Logger) (*AuthMiddleware, error) {
// 	credentialsFile := "cenphiio-service-account.json"
// 	path, err := config.FindFile(credentialsFile)

// 	if err != nil {
// 		return nil, fmt.Errorf("failed to find credentials file: %w", err)
// 	}

// 	// First try to use the system certificate pool
// 	rootCAs, err := x509.SystemCertPool()
// 	if rootCAs == nil {
// 		rootCAs = x509.NewCertPool()
// 	}

// 	if err != nil {
// 		fmt.Printf("error occurred in setting system ca: %v", err)
// 	}

// 	// If running in production, also try to load the specific CA file
// 	if os.Getenv("ENV") == "production" {
// 		caCert, err := os.ReadFile("/etc/pki/tls/certs/ca-bundle.crt")
// 		if err == nil {
// 			rootCAs.AppendCertsFromPEM(caCert)
// 		} else {
// 			// Log the error but continue with the system certs
// 			logger.Warn("Failed to read CA file", zap.Error(err))
// 		}
// 	}

// 	// Create a custom HTTP client with the certificate pool
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

func (m *AuthMiddleware) VerifyToken(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		header := r.Header.Get("Authorization")
		if header == "" {
			m.logging.Warn("missing or invalid token", zap.String("path", r.URL.Path))
			http.Error(w, "Missing or invalid token", http.StatusUnauthorized)
			return
		}
		t := strings.TrimPrefix(header, "Bearer ")
		auth, err := m.app.Auth(r.Context())
		if err != nil {
			m.logging.Error("failed to create auth client", zap.Error(err))
			http.Error(w, "Failed to create auth client", http.StatusInternalServerError)
			return
		}

		token, err := auth.VerifyIDToken(r.Context(), t)
		if err != nil {
			m.logging.Error("failed to verify token", zap.Error(err))
			http.Error(w, "Failed to verify token", http.StatusUnauthorized)
			return
		}
		ctx := context.WithValue(r.Context(), userKey, token)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}
