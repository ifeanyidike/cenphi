// mocks/repo.go
package mocks

import (
	"github.com/ifeanyidike/cenphi/internal/repositories"
	"github.com/stretchr/testify/mock"
)

type Repo struct {
	mock.Mock
}

func (m *Repo) User() repositories.UserRepository {
	args := m.Called()
	return args.Get(0).(repositories.UserRepository)
}

func (m *Repo) Workspace() repositories.WorkspaceRepository {
	args := m.Called()
	return args.Get(0).(repositories.WorkspaceRepository)
}

func (m *Repo) TeamMember() repositories.TeamMemberRepository {
	args := m.Called()
	return args.Get(0).(repositories.TeamMemberRepository)
}

func (m *Repo) Close() error {
	args := m.Called()
	return args.Error(0)
}
