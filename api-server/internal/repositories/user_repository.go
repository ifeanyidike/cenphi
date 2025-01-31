package repositories

import (
	"context"
	"log"
	"time"

	"github.com/google/uuid"
	"github.com/ifeanyidike/cenphi/internal/models"
	"github.com/redis/go-redis/v9"
)

type UserRepository interface {
	Repository[models.User]
	FindByEmail(ctx context.Context, email string, db DB) (*models.User, error)
	FindByUID(ctx context.Context, uid string, db DB) (*models.User, error)
}

type userRepository struct {
	*BaseRepository[models.User]
}

func NewUserRepository(redis *redis.Client) UserRepository {
	return &userRepository{
		BaseRepository: NewBaseRepository[models.User](redis, "users"),
	}
}

func (r *userRepository) Create(ctx context.Context, user *models.User, db DB) error {
	query := `
		INSERT INTO users 
			(id, email, email_verified, first_name, last_name, firebase_uid, last_active_at, created_at) 
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
	`
	_, err := db.ExecContext(ctx, query,
		user.ID,
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

func (r *userRepository) Update(ctx context.Context, user *models.User, id uuid.UUID, db DB) error {
	query :=
		`UPDATE users 
		 	SET email = $1, first_name = $2, last_name = $3, last_active_at = $4 
		 WHERE id = $5
		`
	_, err := db.ExecContext(ctx, query, user.Email, user.FirstName, user.LastName, time.Now(), id)
	return err
}

func (r *userRepository) GetByID(ctx context.Context, id uuid.UUID, db DB) (*models.User, error) {
	log.Println("In get by id call")
	query :=
		`
		SELECT 
			id, email, first_name, last_name, email_verified, last_active_at, created_at
		FROM users
		WHERE id = $1
		`
	row := db.QueryRowContext(ctx, query, id)

	var user models.User
	err := row.Scan(&user.ID, &user.Email, &user.FirstName, &user.LastName, &user.EmailVerified, &user.LastActiveAt, &user.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *userRepository) FindByEmail(ctx context.Context, firebase_uid string, db DB) (*models.User, error) {
	query :=
		`
		SELECT 
			id, email, first_name, last_name, email_verified, last_active_at, created_at
		FROM users
		WHERE firebase_uid = $1
		`
	row := db.QueryRowContext(ctx, query, firebase_uid)

	var user models.User
	err := row.Scan(&user.ID, &user.Email, &user.FirstName, &user.LastName, &user.EmailVerified, &user.LastActiveAt, &user.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *userRepository) FindByUID(ctx context.Context, uid string, db DB) (*models.User, error) {
	query :=
		`
		SELECT 
			id, email, first_name, last_name, email_verified, last_active_at, created_at
		FROM users
		WHERE firebase_uid = $1
		`
	row := db.QueryRowContext(ctx, query, uid)
	var user models.User
	err := row.Scan(&user.ID, &user.Email, &user.FirstName, &user.LastName, &user.EmailVerified, &user.LastActiveAt, &user.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &user, nil
}
