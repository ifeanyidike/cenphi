// internal/repositories/google_drive_repository.go
package repositories

import (
	"context"
	"database/sql"
	"time"

	"github.com/google/uuid"
	"github.com/ifeanyidike/cenphi/internal/models"
	"github.com/redis/go-redis/v9"
)

type GoogleDriveRepository interface {
	SaveAccount(ctx context.Context, account *models.GoogleDriveAccount, db *sql.DB) error
	GetAccount(ctx context.Context, workspaceID, userID uuid.UUID, db *sql.DB) (*models.GoogleDriveAccount, error)
	UpdateTokens(ctx context.Context, accountID uuid.UUID, accessToken, refreshToken string, expiresAt *time.Time, db *sql.DB) error
	DeleteAccount(ctx context.Context, accountID uuid.UUID, db *sql.DB) error
	GetAccountsByWorkspace(ctx context.Context, workspaceID uuid.UUID, db *sql.DB) ([]*models.GoogleDriveAccount, error)
}

type googleDriveRepository struct {
	redisClient *redis.Client
}

func NewGoogleDriveRepository(redisClient *redis.Client) GoogleDriveRepository {
	return &googleDriveRepository{
		redisClient: redisClient,
	}
}

func (r *googleDriveRepository) SaveAccount(ctx context.Context, account *models.GoogleDriveAccount, db *sql.DB) error {
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

func (r *googleDriveRepository) GetAccount(ctx context.Context, workspaceID, userID uuid.UUID, db *sql.DB) (*models.GoogleDriveAccount, error) {
	query := `
        SELECT id, workspace_id, user_id, access_token, refresh_token,
               token_type, expires_at, account_email, account_name,
               status, last_error, created_at, updated_at
        FROM google_drive_accounts
        WHERE workspace_id = $1 AND user_id = $2
    `

	account := &models.GoogleDriveAccount{}
	err := db.QueryRowContext(ctx, query, workspaceID, userID).Scan(
		&account.ID, &account.WorkspaceID, &account.UserID,
		&account.AccessToken, &account.RefreshToken, &account.TokenType,
		&account.ExpiresAt, &account.AccountEmail, &account.AccountName,
		&account.Status, &account.LastError, &account.CreatedAt, &account.UpdatedAt,
	)

	if err != nil {
		return nil, err
	}

	return account, nil
}

func (r *googleDriveRepository) UpdateTokens(ctx context.Context, accountID uuid.UUID, accessToken, refreshToken string, expiresAt *time.Time, db *sql.DB) error {
	query := `
        UPDATE google_drive_accounts 
        SET access_token = $2, refresh_token = $3, expires_at = $4, 
            status = 'connected', last_error = NULL, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
    `

	_, err := db.ExecContext(ctx, query, accountID, accessToken, refreshToken, expiresAt)
	return err
}

func (r *googleDriveRepository) DeleteAccount(ctx context.Context, accountID uuid.UUID, db *sql.DB) error {
	query := `DELETE FROM google_drive_accounts WHERE id = $1`
	_, err := db.ExecContext(ctx, query, accountID)
	return err
}

func (r *googleDriveRepository) GetAccountsByWorkspace(ctx context.Context, workspaceID uuid.UUID, db *sql.DB) ([]*models.GoogleDriveAccount, error) {
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

	var accounts []*models.GoogleDriveAccount
	for rows.Next() {
		account := &models.GoogleDriveAccount{}
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
