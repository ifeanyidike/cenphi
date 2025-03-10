package middleware

import (
	"context"
	"net/http"
	"strings"

	firebase "firebase.google.com/go/v4"
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
	opt := option.WithCredentialsFile("../../cenphiio-service-account.json")
	app, err := firebase.NewApp(context.Background(), nil, opt)
	if err != nil {
		return nil, err
	}

	return &AuthMiddleware{
		app:     app,
		logging: logger,
	}, nil
}

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
