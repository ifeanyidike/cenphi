package mocks

import (
	"context"
	"log"

	"github.com/google/uuid"
	"github.com/ifeanyidike/cenphi/internal/models"
	"github.com/ifeanyidike/cenphi/internal/repositories"
	"github.com/stretchr/testify/mock"
)

type TeamMemberRepository struct {
	mock.Mock
}

func (m *TeamMemberRepository) Create(ctx context.Context, team_member *models.TeamMember, db repositories.DB) error {
	log.Println("creating...")
	args := m.Called(ctx, team_member, db)
	log.Println("fininshed")
	return args.Error(0)
}

func (m *TeamMemberRepository) GetByID(ctx context.Context, id uuid.UUID, db repositories.DB) (*models.TeamMember, error) {
	args := m.Called(ctx, id, db)
	return args.Get(0).(*models.TeamMember), args.Error(1)
}

func (m *TeamMemberRepository) GetDataByID(ctx context.Context, id uuid.UUID, db repositories.DB) (*models.TeamMemberGetParams, error) {
	args := m.Called(ctx, id, db)
	return args.Get(0).(*models.TeamMemberGetParams), args.Error(1)
}

func (m *TeamMemberRepository) Update(ctx context.Context, team_member *models.TeamMember, id uuid.UUID, db repositories.DB) error {
	args := m.Called(ctx, team_member, id, db)
	return args.Error(0)
}

func (m *TeamMemberRepository) Delete(ctx context.Context, id uuid.UUID, db repositories.DB) error {
	args := m.Called(ctx, id, db)
	return args.Error(0)
}

func (m *TeamMemberRepository) GetByWorkspaceID(ctx context.Context, id uuid.UUID, page, pageSize int, db repositories.DB) ([]*models.TeamMember, error) {
	args := m.Called(ctx, id, page, pageSize, db)
	return args.Get(0).([]*models.TeamMember), args.Error(1)
}
