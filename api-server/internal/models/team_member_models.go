package models

import (
	"time"

	"github.com/go-playground/validator/v10"
	"github.com/google/uuid"
)

type TeamMember struct {
	ID          uuid.UUID  `json:"id" db:"id"`
	WorkspaceID uuid.UUID  `json:"workspace_id" db:"workspace_id" validate:"required"`
	UserID      uuid.UUID  `json:"user_id" db:"user_id" validate:"required"`
	Role        MemberRole `json:"role" db:"role" validate:"required,oneof=owner admin member"`
	Permissions JSONMap    `json:"permissions,omitempty" db:"permissions"`

	UpdatedAt time.Time `json:"updated_at" db:"updated_at"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`

	// Relationships
	User      *User      `json:"user,omitempty" db:"-"`
	Workspace *Workspace `json:"workspace,omitempty" db:"-"`
}

type MemberRole string

const (
	Owner  MemberRole = "owner"
	Admin  MemberRole = "admin"
	Viewer MemberRole = "viewer"
	Editor MemberRole = "editor"
)

func ValidateTeamMember(team_member *TeamMember) error {
	validate := validator.New()

	if err := validate.Struct(team_member); err != nil {
		return err
	}
	return nil
}

type TeamMemberGetParams struct {
	TeamMember
	Name          string `json:"name" db:"name"`
	Email         string `json:"email" db:"email"`
	FirebaseUID   string `json:"firebase_uid" db:"firebase_uid"`
	EmailVerified bool   `json:"email_verified" db:"email_verified"`
	WorkspaceName string `json:"workspace_name" db:"workspace_name"`
	WorkspacePlan Plan   `json:"workspace_plan" db:"workspace_plan"`
	WebsiteURL    string `json:"website_url" db:"website_url"`
	Industry      string `json:"industry" db:"industry"`
}
