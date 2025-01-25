package repositories

import (
	"database/sql"
	"time"

	"github.com/ifeanyidike/cenphi/internal/models"
)

type UserRepository interface {
	Repository[models.User]
	FindByEmail(email string) (*models.User, error)
}

type userRepository struct {
	*BaseRepository[models.User]
	db *sql.DB
}

func NewUserRepository(db *sql.DB) UserRepository {
	return &userRepository{
		BaseRepository: NewBaseRepository[models.User](db, "users"),
		db:             db,
	}
}

func (r *userRepository) Create(user *models.User) error {
	query := "INSERT INTO users (email, password, first_name, last_name, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)"
	_, err := r.db.Exec(query, user.Email, user.Password, user.FirstName, user.LastName, time.Now(), time.Now())
	return err
}

func (r *userRepository) Update(user *models.User) error {
	query := "UPDATE users SET email = ?, first_name = ?, last_name = ?, updated_at = ? WHERE id = ?"
	_, err := r.db.Exec(query, user.Email, user.FirstName, user.LastName, time.Now(), user.ID)
	return err
}

func (r *userRepository) FindByEmail(email string) (*models.User, error) {
	query := "SELECT id, email, first_name, last_name, created_at, updated_at FROM users WHERE email = ?"
	row := r.db.QueryRow(query, email)

	var user models.User
	err := row.Scan(&user.ID, &user.Email, &user.FirstName, &user.LastName, &user.CreatedAt, &user.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &user, nil
}
