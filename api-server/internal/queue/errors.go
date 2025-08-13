// internal/queue/errors.go
package queue

// NonRetryableError indicates errors that should not be retried
type NonRetryableError struct {
	Message string
}

func (e *NonRetryableError) Error() string {
	return e.Message
}

// IsNonRetryableError checks if an error is non-retryable
func IsNonRetryableError(err error) bool {
	_, ok := err.(*NonRetryableError)
	return ok
}
