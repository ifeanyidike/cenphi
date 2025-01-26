package repositories

import (
	"context"
	"database/sql"
	"time"

	"github.com/ifeanyidike/cenphi/internal/models"
)

type UserRepository interface {
	Repository[models.User]
	FindByEmail(ctx context.Context, email string) (*models.User, error)
	FindByUID(ctx context.Context, uid string) (*models.User, error)
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

func (r *userRepository) Create(ctx context.Context, user *models.User) error {
	query := `
		INSERT INTO users 
			(email, email_verified, first_name, last_name, firebase_uid, last_active, created_at) 
		VALUES (?, ?, ?, ?, ?, ?)
	`
	_, err := r.db.ExecContext(ctx, query,
		user.Email,
		user.EmailVerified,
		user.FirstName,
		user.LastName,
		user.FirebaseUID,
		time.Now(),
		time.Now(),
	)
	return err
}

func (r *userRepository) Update(ctx context.Context, user *models.User) error {
	query :=
		`UPDATE users 
		 	SET email = ?, first_name = ?, last_name = ?, last_active = ? 
		 WHERE id = ?
		`
	_, err := r.db.ExecContext(ctx, query, user.Email, user.FirstName, user.LastName, time.Now(), user.ID)
	return err
}

func (r *userRepository) FindByEmail(ctx context.Context, email string) (*models.User, error) {
	query :=
		`
		SELECT 
			id, email, first_name, last_name, email_verified, last_active, created_at
		FROM users
		WHERE firebase_uid = ?
		`
	row := r.db.QueryRowContext(ctx, query, email)

	var user models.User
	err := row.Scan(&user.ID, &user.Email, &user.FirstName, &user.LastName, &user.EmailVerified, &user.LastActive, &user.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *userRepository) FindByUID(ctx context.Context, uid string) (*models.User, error) {
	query :=
		`
		SELECT 
			id, email, first_name, last_name, email_verified, last_active, created_at
		FROM users
		WHERE firebase_uid = ?
		`
	row := r.db.QueryRowContext(ctx, query, uid)
	var user models.User
	err := row.Scan(&user.ID, &user.Email, &user.FirstName, &user.LastName, &user.EmailVerified, &user.LastActive, &user.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &user, nil
}
