package repositories

import (
	"sync"

	"github.com/redis/go-redis/v9"
)

// Repo provides access to all repositories.
type Repo interface {
	User() UserRepository
	TeamMember() TeamMemberRepository
	Workspace() WorkspaceRepository
}

type repo struct {
	redis          *redis.Client
	userRepo       UserRepository
	workspaceRepo  WorkspaceRepository
	teamMemberRepo TeamMemberRepository

	// Separate Once for each repo
	userOnce       sync.Once
	workspaceOnce  sync.Once
	teamMemberOnce sync.Once
}

func NewRepositoryManager(redis *redis.Client) Repo {
	return &repo{
		redis: redis,
	}
}

// User returns the UserRepository instance, initializing it lazily.
func (m *repo) User() UserRepository {
	m.userOnce.Do(func() {
		m.userRepo = NewUserRepository(m.redis)
	})
	return m.userRepo
}

// TeamMember returns the TeamMemberRepository instance, initializing it lazily.
func (m *repo) TeamMember() TeamMemberRepository {
	m.teamMemberOnce.Do(func() {
		m.teamMemberRepo = NewTeamMemberRepository(m.redis)
	})
	return m.teamMemberRepo
}

// Workspace returns the WorkspaceRepository instance, initializing it lazily.
func (m *repo) Workspace() WorkspaceRepository {
	m.workspaceOnce.Do(func() {
		m.workspaceRepo = NewWorkspaceRepository(m.redis)
	})
	return m.workspaceRepo
}
