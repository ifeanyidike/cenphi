package mocks

import (
	"context"

	"github.com/google/uuid"
	"github.com/ifeanyidike/cenphi/internal/models"
	"github.com/stretchr/testify/mock"
)

type TeamMemberService struct {
	mock.Mock
}

func (m *TeamMemberService) AddTeamMember(ctx context.Context, team_member *models.TeamMember) error {
	args := m.Called(ctx, team_member)
	return args.Error(0)
}

func (m *TeamMemberService) GetTeamMemberData(ctx context.Context, id uuid.UUID) (*models.TeamMemberGetParams, error) {
	args := m.Called(ctx, id)
	return args.Get(0).(*models.TeamMemberGetParams), args.Error(1)
}

func (m *TeamMemberService) GetTeamMembers(ctx context.Context, workspaceID uuid.UUID, page, pageSize int) ([]*models.TeamMember, error) {

	args := m.Called(ctx, workspaceID, page, pageSize)
	return args.Get(0).([]*models.TeamMember), args.Error(1)
}

func (m *TeamMemberService) RemoveTeamMember(ctx context.Context, id uuid.UUID) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}
