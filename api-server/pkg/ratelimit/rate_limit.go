// internal/pkg/ratelimit/rate_limit.go
package ratelimit

import (
	"context"
	"time"

	"golang.org/x/time/rate"
)

type RateLimiter interface {
	Wait(ctx context.Context) error
	SetLimit(r rate.Limit)
}

type TokenBucketLimiter struct {
	limiter *rate.Limiter
}

func NewTokenBucketLimiter(rps int) *TokenBucketLimiter {
	return &TokenBucketLimiter{
		limiter: rate.NewLimiter(rate.Every(time.Second/time.Duration(rps)), rps),
	}
}

func (t *TokenBucketLimiter) Wait(ctx context.Context) error {
	return t.limiter.Wait(ctx)
}

func (t *TokenBucketLimiter) SetLimit(r rate.Limit) {
	t.limiter.SetLimit(r)
}
