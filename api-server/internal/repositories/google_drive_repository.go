// internal/repositories/google_drive_repository.go
package repositories

import (
	"context"
	"database/sql"
	"time"

	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
	"golang.org/x/oauth2"
)

type GoogleDriveAccount struct {
	ID          uuid.UUID `json:"id" db:"id"`
	WorkspaceID uuid.UUID `json:"workspace_id" db:"workspace_id"`
	UserID      uuid.UUID `json:"user_id" db:"user_id"`

	// OAuth tokens
	AccessToken  string     `json:"-" db:"access_token"`  // Don't expose in JSON
	RefreshToken *string    `json:"-" db:"refresh_token"` // Don't expose in JSON
	TokenType    string     `json:"token_type" db:"token_type"`
	ExpiresAt    *time.Time `json:"expires_at" db:"expires_at"`

	// Account info
	AccountEmail *string `json:"account_email" db:"account_email"`
	AccountName  *string `json:"account_name" db:"account_name"`

	// Status
	Status    string  `json:"status" db:"status"` // connected, expired, revoked, error
	LastError *string `json:"last_error" db:"last_error"`

	CreatedAt time.Time `json:"created_at" db:"created_at"`
	UpdatedAt time.Time `json:"updated_at" db:"updated_at"`
}

// ToOAuth2Token converts to oauth2.Token
func (gda *GoogleDriveAccount) ToOAuth2Token() *oauth2.Token {
	token := &oauth2.Token{
		AccessToken: gda.AccessToken,
		TokenType:   gda.TokenType,
	}

	if gda.RefreshToken != nil {
		token.RefreshToken = *gda.RefreshToken
	}

	if gda.ExpiresAt != nil {
		token.Expiry = *gda.ExpiresAt
	}

	return token
}

type GoogleDriveRepository struct {
	redisClient *redis.Client
}

func NewGoogleDriveRepository(redisClient *redis.Client) GoogleDriveRepository {
	return GoogleDriveRepository{
		redisClient: redisClient,
	}
}

func (r GoogleDriveRepository) SaveAccount(ctx context.Context, account GoogleDriveAccount, db *sql.DB) error {
	query := `
        INSERT INTO google_drive_accounts (
            id, workspace_id, user_id, access_token, refresh_token, 
            token_type, expires_at, account_email, account_name, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (workspace_id, user_id) DO UPDATE SET
            access_token = EXCLUDED.access_token,
            refresh_token = EXCLUDED.refresh_token,
            token_type = EXCLUDED.token_type,
            expires_at = EXCLUDED.expires_at,
            account_email = EXCLUDED.account_email,
            account_name = EXCLUDED.account_name,
            status = EXCLUDED.status,
            last_error = NULL,
            updated_at = CURRENT_TIMESTAMP
        RETURNING id, created_at, updated_at
    `

	err := db.QueryRowContext(ctx, query,
		account.ID, account.WorkspaceID, account.UserID,
		account.AccessToken, account.RefreshToken, account.TokenType,
		account.ExpiresAt, account.AccountEmail, account.AccountName, account.Status,
	).Scan(&account.ID, &account.CreatedAt, &account.UpdatedAt)

	return err
}

func (r GoogleDriveRepository) GetAccount(ctx context.Context, workspaceID, userID uuid.UUID, db *sql.DB) (GoogleDriveAccount, error) {
	query := `
        SELECT id, workspace_id, user_id, access_token, refresh_token,
               token_type, expires_at, account_email, account_name,
               status, last_error, created_at, updated_at
        FROM google_drive_accounts
        WHERE workspace_id = $1 AND user_id = $2
    `

	account := GoogleDriveAccount{}
	err := db.QueryRowContext(ctx, query, workspaceID, userID).Scan(
		&account.ID, &account.WorkspaceID, &account.UserID,
		&account.AccessToken, &account.RefreshToken, &account.TokenType,
		&account.ExpiresAt, &account.AccountEmail, &account.AccountName,
		&account.Status, &account.LastError, &account.CreatedAt, &account.UpdatedAt,
	)

	if err != nil {
		return account, err
	}

	return account, nil
}

func (r GoogleDriveRepository) UpdateTokens(ctx context.Context, accountID uuid.UUID, accessToken, refreshToken string, expiresAt *time.Time, db *sql.DB) error {
	query := `
        UPDATE google_drive_accounts 
        SET access_token = $2, refresh_token = $3, expires_at = $4, 
            status = 'connected', last_error = NULL, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
    `

	_, err := db.ExecContext(ctx, query, accountID, accessToken, refreshToken, expiresAt)
	return err
}

func (r GoogleDriveRepository) DeleteAccount(ctx context.Context, accountID uuid.UUID, db *sql.DB) error {
	query := `DELETE FROM google_drive_accounts WHERE id = $1`
	_, err := db.ExecContext(ctx, query, accountID)
	return err
}

func (r GoogleDriveRepository) GetAccountsByWorkspace(ctx context.Context, workspaceID uuid.UUID, db *sql.DB) ([]GoogleDriveAccount, error) {
	query := `
        SELECT id, workspace_id, user_id, access_token, refresh_token,
               token_type, expires_at, account_email, account_name,
               status, last_error, created_at, updated_at
        FROM google_drive_accounts
        WHERE workspace_id = $1
        ORDER BY created_at DESC
    `

	rows, err := db.QueryContext(ctx, query, workspaceID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var accounts []GoogleDriveAccount
	for rows.Next() {
		account := GoogleDriveAccount{}
		err := rows.Scan(
			&account.ID, &account.WorkspaceID, &account.UserID,
			&account.AccessToken, &account.RefreshToken, &account.TokenType,
			&account.ExpiresAt, &account.AccountEmail, &account.AccountName,
			&account.Status, &account.LastError, &account.CreatedAt, &account.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		accounts = append(accounts, account)
	}

	return accounts, rows.Err()
}
