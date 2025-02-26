package repositories

import (
	"context"
	"encoding/json"
	"fmt"
	"log"

	"github.com/google/uuid"
	"github.com/ifeanyidike/cenphi/internal/models"
	"github.com/redis/go-redis/v9"
)

type TeamMemberRepository interface {
	Repository[models.TeamMember]
	GetDataByID(context.Context, uuid.UUID, DB) (*models.TeamMemberGetParams, error)
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
		member.Settings = make(map[string]interface{})
	}

	return &member, nil
}

func (r *teamMemberRepository) GetDataByID(ctx context.Context, id uuid.UUID, db DB) (*models.TeamMemberGetParams, error) {
	query :=
		`
        SELECT
            t.workspace_id, t.user_id, t.role, t.permissions, t.settings, u.first_name, u.last_name, u.email, u.email_verified,
			u.firebase_uid, w.name as workspace_name, w.plan as workspace_plan, w.website_url

        FROM team_members t
		INNER JOIN users u ON t.user_id = u.id
		INNER JOIN workspaces w ON t.workspace_id = w.id
        WHERE t.id = $1
        `
	row := db.QueryRowContext(ctx, query, id)

	var (
		settingsJSON    []byte
		permissionsJSON []byte
		member          models.TeamMemberGetParams
	)
	err := row.Scan(
		&member.WorkspaceID,
		&member.UserID,
		&member.Role,
		&permissionsJSON,
		&settingsJSON,
		&member.FirstName,
		&member.LastName,
		&member.Email,
		&member.EmailVerified,
		&member.FirebaseUID,
		&member.WorkspaceName,
		&member.WorkspacePlan,
		&member.WebsiteURL,
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
		member.Settings = make(map[string]interface{})
	}

	return &member, nil
}

func (r *teamMemberRepository) Create(ctx context.Context, team_member *models.TeamMember, db DB) error {
	log.Println("Startingto create")
	query := `
		INSERT INTO team_members 
			(id, workspace_id, user_id, role, permissions, settings) 
		VALUES ($1, $2, $3, $4, $5, $6)
	`
	_, err := db.ExecContext(ctx, query,
		team_member.ID,
		team_member.WorkspaceID,
		team_member.UserID,
		team_member.Role,
		team_member.Permissions,
		team_member.Settings,
	)
	log.Println("Finished creating")
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
