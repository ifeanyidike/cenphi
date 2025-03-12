package repositories

//go:generate mockery --name=TeamMemberRepository --output=./mocks --case=underscore

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"

	"github.com/google/uuid"
	"github.com/ifeanyidike/cenphi/internal/models"
	"github.com/redis/go-redis/v9"
)

type TeamMemberRepository interface {
	Repository[models.TeamMember]
	GetDataByID(context.Context, uuid.UUID, DB) (*models.TeamMemberGetParams, error)
	GetDataByUserID(context.Context, uuid.UUID, DB) (*models.TeamMemberGetParams, error)
	GetByWorkspaceID(context.Context, uuid.UUID, int, int, DB) ([]*models.TeamMember, error)
}

type teamMemberRepository struct {
	*BaseRepository[models.TeamMember]
}

func NewTeamMemberRepository(redis *redis.Client) TeamMemberRepository {
	return &teamMemberRepository{
		BaseRepository: NewBaseRepository[models.TeamMember](redis, "team_members"),
	}
}

func (r *teamMemberRepository) GetByID(ctx context.Context, id uuid.UUID, db DB) (*models.TeamMember, error) {
	query :=
		`
        SELECT
            workspace_id, user_id, role, permissions, settings
        FROM team_members
        WHERE id = $1
        `
	row := db.QueryRowContext(ctx, query, id)

	var (
		settingsJSON    []byte
		permissionsJSON []byte
		member          models.TeamMember
	)
	err := row.Scan(
		&member.WorkspaceID,
		&member.UserID,
		&member.Role,
		&permissionsJSON,
		&settingsJSON,
	)

	if err != nil {
		return nil, err
	}

	if len(permissionsJSON) > 0 {
		if err := json.Unmarshal(permissionsJSON, &member.Permissions); err != nil {
			return nil, fmt.Errorf("failed to unmarshal permissions JSON: %v", err)
		}
	} else {
		member.Permissions = make(map[string]interface{})
	}

	if len(settingsJSON) > 0 {
		if err := json.Unmarshal(settingsJSON, &member.Settings); err != nil {
			return nil, fmt.Errorf("failed to unmarshal settings JSON: %v", err)
		}
	} else {
		member.Settings = make(map[string]any)
	}

	return &member, nil
}

// getTeamMemberData is a helper that executes the query,
// uses the provided scan function to fill the member and JSON data,
// and then unmarshals the JSON into the proper fields.
func (r *teamMemberRepository) getTeamMemberData(
	ctx context.Context,
	query string,
	arg any,
	scanFn func(*sql.Row, *models.TeamMemberGetParams, *[]byte, *[]byte) error,
	db DB,
) (*models.TeamMemberGetParams, error) {
	row := db.QueryRowContext(ctx, query, arg)

	var (
		settingsJSON    []byte
		permissionsJSON []byte
		member          models.TeamMemberGetParams
	)
	if err := scanFn(row, &member, &permissionsJSON, &settingsJSON); err != nil {
		return nil, err
	}

	// Unmarshal permissions JSON, if present.
	if len(permissionsJSON) > 0 {
		if err := json.Unmarshal(permissionsJSON, &member.Permissions); err != nil {
			return nil, fmt.Errorf("failed to unmarshal permissions JSON: %v", err)
		}
	} else {
		member.Permissions = make(map[string]any)
	}

	// Unmarshal settings JSON, if present.
	if len(settingsJSON) > 0 {
		if err := json.Unmarshal(settingsJSON, &member.Settings); err != nil {
			return nil, fmt.Errorf("failed to unmarshal settings JSON: %v", err)
		}
	} else {
		member.Settings = make(map[string]any)
	}

	return &member, nil
}

// scanByID is used in GetDataByID to scan the row.
func scanByID(
	row *sql.Row,
	member *models.TeamMemberGetParams,
	permissionsJSON *[]byte,
	settingsJSON *[]byte,
) error {
	return row.Scan(
		&member.WorkspaceID,
		&member.UserID,
		&member.Role,
		permissionsJSON,
		settingsJSON,
		&member.Name,
		&member.Email,
		&member.EmailVerified,
		&member.FirebaseUID,
		&member.WorkspaceName,
		&member.WorkspacePlan,
		&member.WebsiteURL,
		&member.Industry,
	)
}

// scanByUserID is used in GetDataByUserID to scan the row.
// Note: This scan includes the team member's ID.
func scanByUserID(
	row *sql.Row,
	member *models.TeamMemberGetParams,
	permissionsJSON *[]byte,
	settingsJSON *[]byte,
) error {
	return row.Scan(
		&member.ID,
		&member.WorkspaceID,
		&member.Role,
		permissionsJSON,
		settingsJSON,
		&member.Name,
		&member.Email,
		&member.EmailVerified,
		&member.FirebaseUID,
		&member.WorkspaceName,
		&member.WorkspacePlan,
		&member.WebsiteURL,
		&member.Industry,
	)
}

// GetDataByID uses the helper with scanByID.
func (r *teamMemberRepository) GetDataByID(ctx context.Context, id uuid.UUID, db DB) (*models.TeamMemberGetParams, error) {
	query := `
        SELECT
            t.workspace_id, t.user_id, t.role, t.permissions, t.settings,
                   u.name, u.email, u.email_verified, u.firebase_uid,
                   w.name as workspace_name, w.plan as workspace_plan, w.website_url, w.industry
        FROM team_members t
		INNER JOIN users u ON t.user_id = u.id
		INNER JOIN workspaces w ON t.workspace_id = w.id
        WHERE t.id = $1
    `
	return r.getTeamMemberData(ctx, query, id, scanByID, db)
}

// GetDataByUserID uses the helper with scanByUserID.
func (r *teamMemberRepository) GetDataByUserID(ctx context.Context, userID uuid.UUID, db DB) (*models.TeamMemberGetParams, error) {
	query := `
        SELECT
            t.id, t.workspace_id, t.role, t.permissions, t.settings,
                   u.name, u.email, u.email_verified, u.firebase_uid,
                   w.name as workspace_name, w.plan as workspace_plan, w.website_url, w.industry
        FROM team_members t
		INNER JOIN users u ON t.user_id = u.id
		INNER JOIN workspaces w ON t.workspace_id = w.id
        WHERE t.user_id = $1
    `
	return r.getTeamMemberData(ctx, query, userID, scanByUserID, db)
}

func (r *teamMemberRepository) Create(ctx context.Context, team_member *models.TeamMember, db DB) error {
	query := `
		INSERT INTO team_members 
			(id, workspace_id, user_id, role) 
		VALUES ($1, $2, $3, $4)
	`
	_, err := db.ExecContext(ctx, query,
		team_member.ID,
		team_member.WorkspaceID,
		team_member.UserID,
		team_member.Role,
	)
	return err
}

func (r *teamMemberRepository) Update(ctx context.Context, team_member *models.TeamMember, id uuid.UUID, db DB) error {
	query := `
        UPDATE team_members 
        SET role = $2, permissions = $3, settings = $4
        WHERE id = $1
    `

	_, err := db.ExecContext(ctx, query,
		id,
		team_member.Role,
		team_member.Permissions,
		team_member.Settings,
	)

	return err
}

func (r *teamMemberRepository) GetByWorkspaceID(ctx context.Context, id uuid.UUID, page, pageSize int, db DB) ([]*models.TeamMember, error) {
	query :=
		`
        SELECT
            id, workspace_id, user_id, role, permissions, settings
        FROM team_members
        WHERE workspace_id = $1
		LIMIT $2
		OFFSET $3
        `
	offset := (page - 1) * pageSize
	rows, err := db.QueryContext(ctx, query, id, pageSize, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var teamMembers []*models.TeamMember
	for rows.Next() {
		var member models.TeamMember
		err := rows.Scan(
			&member.ID,
			&member.WorkspaceID,
			&member.UserID,
			&member.Role,
			&member.Permissions,
			&member.Settings,
		)
		if err != nil {
			return nil, err
		}
		teamMembers = append(teamMembers, &member)
	}
	return teamMembers, nil
}
