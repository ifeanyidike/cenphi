package apperrors

import "errors"

// Common errors
var (
	ErrBadRequest          = errors.New("bad request")
	ErrUnauthorized        = errors.New("unauthorized")
	ErrForbidden           = errors.New("forbidden")
	ErrNotFound            = errors.New("resource not found")
	ErrConflict            = errors.New("conflict")
	ErrInternalServerError = errors.New("internal server error")
	ErrServiceUnavailable  = errors.New("service unavailable")
	ErrInvalidID           = errors.New("invalid ID")
	ErrValidationFailed    = errors.New("validation failed")
)

// Workspace-specific errors
var (
	ErrWorkspaceNotFound       = errors.New("workspace not found")
	ErrWorkspaceConflict       = errors.New("workspace already exists")
	ErrInvalidWorkspaceID      = errors.New("invalid workspace ID")
	ErrWorkspaceAccessDenied   = errors.New("access to workspace denied")
	ErrorWorkspaceUpdateFailed = errors.New("failed to update workspace")
	ErrorWorkspaceCreateFailed = errors.New("failed to create workspace")
	ErrorWorkspaceDeleteFailed = errors.New("failed to delete workspace")
)

// User-specific errors
var (
	ErrUserNotFound          = errors.New("user not found")
	ErrInvalidCredentials    = errors.New("invalid credentials")
	ErrEmailAlreadyExists    = errors.New("email already exists")
	ErrUsernameAlreadyExists = errors.New("username already exists")
	ErrUserAccessDenied      = errors.New("access to user denied")
	ErrInvalidEmailFormat    = errors.New("invalid email format")
	ErrPasswordTooWeak       = errors.New("password is too weak")
)

// Authentication-related errors
var (
	ErrTokenExpired     = errors.New("token has expired")
	ErrTokenInvalid     = errors.New("invalid token")
	ErrTokenGeneration  = errors.New("failed to generate token")
	ErrPermissionDenied = errors.New("permission denied")
	ErrSessionNotFound  = errors.New("session not found")
)

// Database-related errors
var (
	ErrRecNotFound       = errors.New("record not found")
	ErrDuplicateEntry    = errors.New("duplicate entry")
	ErrConnectionFailed  = errors.New("failed to connect to the database")
	ErrTransactionFailed = errors.New("database transaction failed")
	ErrInvalidQuery      = errors.New("invalid database query")
)

// File-related errors
var (
	ErrFileTooLarge     = errors.New("file size exceeds limit")
	ErrFileTypeInvalid  = errors.New("invalid file type")
	ErrFileNotFound     = errors.New("file not found")
	ErrFileUploadFailed = errors.New("file upload failed")
	ErrFileDeleteFailed = errors.New("file delete failed")
)
