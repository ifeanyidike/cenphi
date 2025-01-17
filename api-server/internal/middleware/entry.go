package middleware

import "go.uber.org/zap"

type Middleware struct {
	Logger *zap.Logger
}

func NewMiddleware(logger *zap.Logger) *Middleware {
	return &Middleware{Logger: logger}
}
