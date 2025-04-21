package repositories

//go:generate mockery --name=UserRepository --output=./mocks --case=underscore

import (
	"context"
	"encoding/json"
	"fmt"
<<<<<<< HEAD
	"log"
=======
>>>>>>> origin/master
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/ifeanyidike/cenphi/internal/models"
	"github.com/redis/go-redis/v9"
)

type UserRepository interface {
	Repository[models.User]
	FindByEmail(ctx context.Context, email string, db DB) (*models.User, error)
	FindByUID(ctx context.Context, uid string, db DB) (*models.User, error)
	UpdateAny(ctx context.Context, updates map[string]any, uid string, db DB) error
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
			(id, email, email_verified, name, firebase_uid, last_active_at, created_at) 
		VALUES ($1, $2, $3, $4, $5, $6, $7)
	`
	_, err := db.ExecContext(ctx, query,
		user.ID,
		user.Email,
		user.EmailVerified,
		user.Name,
		user.FirebaseUID,
		time.Now(),
		time.Now(),
	)
	return err
}

func (r *userRepository) Update(ctx context.Context, user *models.User, id uuid.UUID, db DB) error {
	query :=
		`UPDATE users 
		 	SET email = $1, name = $2, last_active_at = $3
		 WHERE id = $4
		`
	_, err := db.ExecContext(ctx, query, user.Email, user.Name, time.Now(), id)
	return err
}

func (r *userRepository) UpdateAny(ctx context.Context, updates map[string]any, uid string, db DB) error {
	var setStatements []string
	var args []any

	// The first argument is the uid for the WHERE clause.
	args = append(args, uid)
	argCount := 1

	for field, value := range updates {
		var dbField string
		switch field {
		case "email", "name":
			dbField = field
		case "email_verified":
			dbField = field
			// Ensure the value is a boolean.
			switch v := value.(type) {
			case bool:
				// Already a boolean.
			case int:
				value = v != 0
			case float64:
				value = v != 0
			default:
				return fmt.Errorf("unexpected type for %s: %T", field, value)
			}
		case "settings", "permissions":
			dbField = field
			jsonValue, err := json.Marshal(value)
			if err != nil {
				return fmt.Errorf("failed to marshal JSON for %s: %w", field, err)
			}
			value = jsonValue
		default:
			// Skip fields we don't want to update.
			continue
		}

		argCount++
		setStatements = append(setStatements, fmt.Sprintf("%s = $%d", dbField, argCount))
		args = append(args, value)
	}

	// Always update the updated_at field.
	setStatements = append(setStatements, "updated_at = NOW()")

	fmt.Println("setStatements", setStatements, args)
	if len(setStatements) == 0 {
		return nil
	}

	// Build the final query.
	query := fmt.Sprintf("UPDATE users SET %s WHERE firebase_uid = $1", strings.Join(setStatements, ", "))

	// Execute the query.
	_, err := db.ExecContext(ctx, query, args...)
	return err
}

func (r *userRepository) GetByID(ctx context.Context, id uuid.UUID, db DB) (*models.User, error) {
	query :=
		`
		SELECT 
			id, email, name, email_verified, last_active_at, created_at
		FROM users
		WHERE id = $1
		`
	row := db.QueryRowContext(ctx, query, id)

	var user models.User
	err := row.Scan(&user.ID, &user.Email, &user.Name, &user.EmailVerified, &user.LastActiveAt, &user.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *userRepository) FindByEmail(ctx context.Context, firebase_uid string, db DB) (*models.User, error) {
	query :=
		`
		SELECT 
			id, email, name, email_verified, last_active_at, created_at
		FROM users
		WHERE firebase_uid = $1
		`
	row := db.QueryRowContext(ctx, query, firebase_uid)

	var user models.User
	err := row.Scan(&user.ID, &user.Email, &user.Name, &user.EmailVerified, &user.LastActiveAt, &user.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *userRepository) FindByUID(ctx context.Context, uid string, db DB) (*models.User, error) {
	query :=
		`
		SELECT 
			id, email, name, email_verified, last_active_at, created_at
		FROM users
		WHERE firebase_uid = $1
		`
	row := db.QueryRowContext(ctx, query, uid)
	var user models.User

	err := row.Scan(&user.ID, &user.Email, &user.Name, &user.EmailVerified, &user.LastActiveAt, &user.CreatedAt)

	if err != nil {
		return nil, err
	}
	return &user, nil
}
