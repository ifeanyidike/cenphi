package middleware

import (
	"net/http"
	"time"

	"go.uber.org/zap"
)

func (m *Middleware) Logging(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		m.Logger.Info("request received",
			zap.String("method", r.Method),
			zap.String("url", r.URL.String()),
			zap.String("remote_addr", r.RemoteAddr),
		)
		next.ServeHTTP(w, r)
		m.Logger.Info("request processed",
			zap.Duration("duration", time.Since(start)),
		)
	})
}
