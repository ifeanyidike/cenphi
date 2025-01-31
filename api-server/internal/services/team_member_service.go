// team_member_service.go
package services

import (
	"context"
	"database/sql"

	"github.com/google/uuid"
	"github.com/ifeanyidike/cenphi/internal/models"
	"github.com/ifeanyidike/cenphi/internal/repositories"
)

type TeamMemberService interface {
	AddTeamMember(ctx context.Context, teamMember *models.TeamMember) error
	RemoveTeamMember(ctx context.Context, id uuid.UUID) error
	GetTeamMembers(ctx context.Context, workspaceID uuid.UUID, page, pageSize int) ([]*models.TeamMember, error)
	GetTeamMemberData(ctx context.Context, id uuid.UUID) (*models.TeamMemberGetParams, error)
}

type teamMemberService struct {
	repo repositories.TeamMemberRepository
	db   *sql.DB
}

func NewTeamMemberService(repo repositories.TeamMemberRepository, db *sql.DB) TeamMemberService {
	return &teamMemberService{repo: repo, db: db}
}

func (s *teamMemberService) AddTeamMember(ctx context.Context, teamMember *models.TeamMember) error {
	return s.repo.Create(ctx, teamMember, s.db)
}

func (s *teamMemberService) RemoveTeamMember(ctx context.Context, id uuid.UUID) error {
	return s.repo.Delete(ctx, id, s.db)
}

func (s *teamMemberService) GetTeamMembers(ctx context.Context, workspaceID uuid.UUID, page, pageSize int) ([]*models.TeamMember, error) {
	return s.repo.GetByWorkspaceID(ctx, workspaceID, page, pageSize, s.db)
}

func (s *teamMemberService) GetTeamMemberData(ctx context.Context, id uuid.UUID) (*models.TeamMemberGetParams, error) {
	return s.repo.GetDataByID(ctx, id, s.db)
}
