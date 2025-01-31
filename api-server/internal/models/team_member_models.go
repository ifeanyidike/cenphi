package models

import (
	"time"

	"github.com/go-playground/validator/v10"
	"github.com/google/uuid"
)

type TeamMember struct {
	ID          uuid.UUID              `json:"id" db:"id"`
	WorkspaceID uuid.UUID              `json:"workspace_id" db:"workspace_id" validate:"required"`
	UserID      uuid.UUID              `json:"user_id" db:"user_id" validate:"required"`
	Role        MemberRole             `json:"role" db:"role" validate:"required,oneof=owner admin member"`
	Settings    map[string]interface{} `json:"settings,omitempty" db:"settings"`
	Permissions map[string]interface{} `json:"permissions,omitempty" db:"permissions"`
	CreatedAt   time.Time              `json:"created_at" db:"created_at"`
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
	FirstName     string `json:"first_name" db:"first_name"`
	LastName      string `json:"last_name" db:"last_name"`
	Email         string `json:"email" db:"email"`
	FirebaseUID   string `json:"firebase_uid" db:"firebase_uid"`
	EmailVerified bool   `json:"email_verified" db:"email_verified"`
	WorkspaceName string `json:"workspace_name" db:"workspace_name"`
	WorkspacePlan Plan   `json:"workspace_plan" db:"workspace_plan"`
	WebsiteURL    string `json:"website_url" db:"website_url"`
}
