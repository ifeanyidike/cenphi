package repositories

import (
	"database/sql"
	"sync"
)

// Repo provides access to all repositories.
type Repo interface {
	User() UserRepository // Expose the UserRepository
	// Add methods for other repositories here, e.g., Product() ProductRepository
	Close() error // Close the database connection
}

type repo struct {
	db        *sql.DB
	userRepo  UserRepository
	initOnce  sync.Once
	closeOnce sync.Once
}

// NewRepositoryManager creates a new Repo with the given database connection.
func NewRepositoryManager(db *sql.DB) Repo {
	return &repo{
		db: db,
	}
}

// User returns the UserRepository instance, initializing it lazily.
func (m *repo) User() UserRepository {
	m.initOnce.Do(func() {
		m.userRepo = NewUserRepository(m.db)
	})
	return m.userRepo
}

// Close closes the database connection.
func (m *repo) Close() error {
	var err error
	m.closeOnce.Do(func() {
		err = m.db.Close()
	})
	return err
}
