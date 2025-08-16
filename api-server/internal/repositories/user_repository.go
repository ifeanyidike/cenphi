package repositories

//go:generate mockery --name=UserRepository --output=./mocks --case=underscore

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
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
	GetWorkspaceByUID(ctx context.Context, uid string, db DB) (uuid.UUID, error)
	FindAndJoinByUID(ctx context.Context, uid string, db DB) (*models.TeamMemberGetParams, error)
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
		case "settings":
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

// func (r *userRepository) FindByUID(ctx context.Context, uid string, db DB) (*models.User, error) {
// 	query :=
// 		`
// 		SELECT
// 			id, firebase_uid, email, name, email_verified, last_active_at, created_at
// 		FROM users
// 		WHERE firebase_uid = $1
// 		`
// 	row := db.QueryRowContext(ctx, query, uid)
// 	var user models.User

// 	err := row.Scan(
// 		&user.ID,
// 		&user.FirebaseUID,
// 		&user.Email,
// 		&user.Name,
// 		&user.EmailVerified,
// 		&user.LastActiveAt,
// 		&user.CreatedAt,
// 	)
// 	fmt.Println("uid", uid)
// 	fmt.Println("found user", user)

// 	if err != nil {
// 		return nil, err
// 	}
// 	return &user, nil
// }

func (r *userRepository) GetWorkspaceByUID(ctx context.Context, uid string, db DB) (uuid.UUID, error) {
	fmt.Println("getting workspace id by uid")
	query := `
        SELECT
			u.id,
			t.workspace_id
        FROM users u
		INNER JOIN team_members t ON u.id = t.user_id
        WHERE u.firebase_uid = $1
    `

	row := db.QueryRowContext(ctx, query, uid)
	var userID uuid.UUID
	var workspaceID uuid.UUID

	err := row.Scan(
		&userID,
		&workspaceID,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			fmt.Println("No rows found for Firebase UID:", uid)
			return uuid.Nil, errors.New("user not found")
		}
		fmt.Printf("Scan error: %v\n", err)
		return uuid.Nil, err
	}

	// Check if we got an empty result even without error
	if userID == uuid.Nil {
		fmt.Println("Got empty user result for Firebase UID:", uid)
		return uuid.Nil, errors.New("user not found")
	}
	fmt.Println("workspaceID", workspaceID)

	return workspaceID, nil
}

func (r *userRepository) FindAndJoinByUID(ctx context.Context, uid string, db DB) (*models.TeamMemberGetParams, error) {
	query := `
        SELECT
			u.id, u.firebase_uid, u.email, u.name, u.email_verified, u.created_at,
			w.name as workspace_name, w.id as workspace_id, w.plan as workspace_plan,
			t.role, t.user_id, t.workspace_id
        FROM users u
		INNER JOIN team_members t ON u.id = t.user_id
		INNER JOIN workspaces w ON t.workspace_id = w.id
        WHERE u.firebase_uid = $1
    `

	row := db.QueryRowContext(ctx, query, uid)
	var u models.TeamMemberGetParams

	err := row.Scan(
		&u.UserID,
		&u.FirebaseUID,
		&u.Email,
		&u.Name,
		&u.EmailVerified,
		&u.CreatedAt,
		&u.WorkspaceName,
		&u.WorkspaceID,
		&u.WorkspacePlan,
		&u.Role,
		&u.UserID,
		&u.WorkspaceID,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			fmt.Println("No rows found for Firebase UID:", uid)
			return nil, errors.New("user not found")
		}
		fmt.Printf("Scan error: %v\n", err)
		return nil, err
	}

	// Check if we got an empty result even without error
	if u.UserID == uuid.Nil {
		fmt.Println("Got empty user result for Firebase UID:", uid)
		return nil, errors.New("user not found")
	}

	return &u, nil
}

func (r *userRepository) FindByUID(ctx context.Context, uid string, db DB) (*models.User, error) {
	query := `
        SELECT 
            id, firebase_uid, email, name, email_verified, last_active_at, created_at
        FROM users
        WHERE firebase_uid = $1
    `

	fmt.Printf("Executing query: %s with uid: %s\n", query, uid)

	row := db.QueryRowContext(ctx, query, uid)
	var user models.User

	err := row.Scan(
		&user.ID,
		&user.FirebaseUID,
		&user.Email,
		&user.Name,
		&user.EmailVerified,
		&user.LastActiveAt,
		&user.CreatedAt,
	)

	fmt.Printf("Scan error: %v\n", err)
	fmt.Printf("Found user: %+v\n", user)

	if err != nil {
		if err == sql.ErrNoRows {
			fmt.Println("No rows found for Firebase UID:", uid)
			return nil, errors.New("user not found")
		}
		fmt.Printf("Scan error: %v\n", err)
		return nil, err
	}

	// Check if we got an empty result even without error
	if user.ID == uuid.Nil {
		fmt.Println("Got empty user result for Firebase UID:", uid)
		return nil, errors.New("user not found")
	}

	return &user, nil
}

func (r *userRepository) UserExistsByUID(ctx context.Context, uid string, db DB) (bool, error) {
	query := "SELECT COUNT(*) FROM users WHERE firebase_uid = $1"
	var count int
	err := db.QueryRowContext(ctx, query, uid).Scan(&count)
	if err != nil {
		return false, err
	}
	fmt.Printf("Count of users with Firebase UID %s: %d\n", uid, count)
	return count > 0, nil
}
