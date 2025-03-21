package repositories

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/ifeanyidike/cenphi/internal/contracts"
	"github.com/ifeanyidike/cenphi/internal/models"
	"github.com/redis/go-redis/v9"
)

type CustomerProfileRepository interface {
	Repository[models.CustomerProfile]
	// GetDataByID(context.Context, uuid.UUID, DB) (*models.CustomerProfile, error)
	// GetDataByUserID(context.Context, uuid.UUID, DB) (*models.CustomerProfile, error)
	// GetByWorkspaceID(context.Context, uuid.UUID, int, int, DB) ([]*models.CustomerProfile, error)
	GetOrCreate(context.Context, contracts.ReviewerData, uuid.UUID, string, DB) (*models.CustomerProfile, error)
	FindByEmailAndWorkspace(context.Context, string, uuid.UUID, DB) (*models.CustomerProfile, error)
	FindByExternalIDAndWorkspace(context.Context, string, uuid.UUID, DB) (*models.CustomerProfile, error)
}

type customerProfileRepository struct {
	*BaseRepository[models.CustomerProfile]
}

func NewCustomerProfileRepository(redis *redis.Client) CustomerProfileRepository {
	return &customerProfileRepository{
		BaseRepository: NewBaseRepository[models.CustomerProfile](redis, "customer_profiles"),
	}
}

// Assuming ReviewerData is a struct representing the data from the source,
// with fields like Email, ExternalID, Name, etc.

func (cp *customerProfileRepository) GetOrCreate(ctx context.Context, reviewer contracts.ReviewerData, workspaceID uuid.UUID, platform string, db DB) (*models.CustomerProfile, error) {
	var profile *models.CustomerProfile
	var err error

	// If an email is provided, try finding by email.
	if reviewer.Email != "" {
		profile, err = cp.FindByEmailAndWorkspace(ctx, reviewer.Email, workspaceID, db)
		if err != nil {
			return nil, err
		}
		if profile != nil {
			return profile, nil
		}
	}

	// Fallback: if an external identifier is available, try finding by that.
	if reviewer.ExternalID != "" {
		profile, err = cp.FindByExternalIDAndWorkspace(ctx, reviewer.ExternalID, workspaceID, db)
		if err != nil {
			return nil, err
		}
		if profile != nil {
			return profile, nil
		}
	}

	// If no profile was found, create a new one.
	profile = &models.CustomerProfile{
		ID:          uuid.New(),
		WorkspaceID: workspaceID,
		Email:       reviewer.Email,      // may be empty
		ExternalID:  reviewer.ExternalID, // add this field to your CustomerProfile if needed
		Name:        reviewer.Name,
		// Populate additional fields as necessary.
		CustomFields: map[string]any{"platform": platform},
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}

	if err = cp.Create(ctx, profile, db); err != nil {
		return nil, err
	}
	return profile, nil
}

func (cp *customerProfileRepository) FindByEmailAndWorkspace(ctx context.Context, email string, workspaceID uuid.UUID, db DB) (*models.CustomerProfile, error) {
	const query = `
		SELECT * FROM customer_profiles
		WHERE email = $1 AND workspace_id = $2
		LIMIT 1
	`

	var p models.CustomerProfile
	var socialProfileBytes, customFieldsBytes []byte

	err := db.QueryRowContext(ctx, query, email, workspaceID).Scan(&p.ID,
		&p.WorkspaceID,
		&p.ExternalID,
		&p.Email,
		&p.Name,
		&p.Title,
		&p.Company,
		&p.Industry,
		&p.Location,
		&p.AvatarURL,
		&socialProfileBytes,
		&customFieldsBytes,
		&p.CreatedAt,
		&p.UpdatedAt,
	)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}

	if len(socialProfileBytes) > 0 {
		if err := json.Unmarshal(socialProfileBytes, &p.SocialProfiles); err != nil {
			return nil, err
		}
	}

	if len(customFieldsBytes) > 0 {
		if err := json.Unmarshal(customFieldsBytes, &p.CustomFields); err != nil {
			return nil, err
		}
	}
	return &p, nil
}

func (cp *customerProfileRepository) FindByExternalIDAndWorkspace(ctx context.Context, externalID string, workspaceID uuid.UUID, db DB) (*models.CustomerProfile, error) {
	const query = `
		SELECT * FROM custom_profiles
		WHERE external_id = $1 AND workspace_id = $2
		LIMIT 1
	`

	var p models.CustomerProfile
	var socialProfilesBytes, customFieldsBytes []byte

	err := db.QueryRowContext(ctx, query, externalID, workspaceID).Scan(
		&p.ID,
		&p.WorkspaceID,
		&p.ExternalID,
		&p.Email,
		&p.Name,
		&p.Title,
		&p.Company,
		&p.Industry,
		&p.Location,
		&p.AvatarURL,
		&socialProfilesBytes,
		&customFieldsBytes,
		&p.CreatedAt,
		&p.UpdatedAt,
	)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}

	if len(socialProfilesBytes) > 0 {
		if err := json.Unmarshal(socialProfilesBytes, &p.SocialProfiles); err != nil {
			return nil, err
		}
	}
	if len(customFieldsBytes) > 0 {
		if err := json.Unmarshal(customFieldsBytes, &p.CustomFields); err != nil {
			return nil, err
		}
	}
	return &p, nil
}

func (cp *customerProfileRepository) Create(ctx context.Context, p *models.CustomerProfile, db DB) error {
	const query = `
		INSERT INTO customer_profiles
			(workspace_id, external_id, email, name, title, company, industry, location, avatar_url, social_profiles, custom_fields, created_at, updated_at)
		VALUES
			($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
		RETURNING id, created_at, updated_at
	`

	now := time.Now()
	if p.CreatedAt.IsZero() {
		p.CreatedAt = now
	}
	p.UpdatedAt = now

	socialProfilesJSON, err := json.Marshal(p.SocialProfiles)
	if err != nil {
		return err
	}

	customFieldsJSON, err := json.Marshal(p.CustomFields)
	if err != nil {
		return err
	}

	err = db.QueryRowContext(ctx, query,
		p.WorkspaceID,
		p.ExternalID,
		p.Email,
		p.Name,
		p.Title,
		p.Company,
		p.Industry,
		p.Location,
		p.AvatarURL,
		socialProfilesJSON,
		customFieldsJSON,
		p.CreatedAt,
		p.UpdatedAt,
	).Scan(&p.ID, &p.CreatedAt, &p.UpdatedAt)

	if err != nil {
		return err
	}
	return nil
}
