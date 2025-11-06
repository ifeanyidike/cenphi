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
	GetWorkspaceIDByUID(ctx context.Context, uid string, db DB) (uuid.UUID, error)
	GetWorkspaceByUID(ctx context.Context, uid string, db DB) (models.Workspace, error)
	GetWorkspaceAndUserIDByUID(ctx context.Context, uid string, db DB) (models.WorkspaceWithUserID, error)
	FindAndJoinByUID(ctx context.Context, uid string, db DB) (*models.TeamMemberGetParams, error)
	UpdateAnyByUid(ctx context.Context, updates map[string]any, uid string, db DB) error
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

func (r *userRepository) UpdateAnyByUid(ctx context.Context, updates map[string]any, uid string, db DB) error {
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

func (r *userRepository) FindByEmail(ctx context.Context, email string, db DB) (*models.User, error) {
	query :=
		`
		SELECT
			id, firebase_uid, email, name, email_verified, last_active_at, created_at
		FROM users
		WHERE email = $1
		`
	row := db.QueryRowContext(ctx, query, email)

	var user models.User
	err := row.Scan(&user.ID, &user.FirebaseUID, &user.Email, &user.Name, &user.EmailVerified, &user.LastActiveAt, &user.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *userRepository) GetWorkspaceIDByUID(ctx context.Context, uid string, db DB) (uuid.UUID, error) {
	start := time.Now()

	// Try cache first
	cacheKey := fmt.Sprintf("workspace_id:uid:%s", uid)
	cachedWorkspaceID, err := r.redis.Get(ctx, cacheKey).Result()
	if err == nil {
		// Cache hit - parse UUID and return
		workspaceID, parseErr := uuid.Parse(cachedWorkspaceID)
		if parseErr == nil {
			fmt.Printf("✅ Cache HIT for workspace_id (uid: %s) in %v\n", uid, time.Since(start))
			return workspaceID, nil
		}
		// If parse fails, continue to DB query (corrupted cache)
		fmt.Printf("⚠️ Cache data corrupted, falling back to DB\n")
	} else if err != redis.Nil {
		// Redis error (not a cache miss) - log but continue to DB
		fmt.Printf("⚠️ Redis error: %v, falling back to DB\n", err)
	}

	// Cache miss or error - query database
	fmt.Printf("🔍 Cache MISS - querying DB for uid: %s\n", uid)

	query := `
        SELECT t.workspace_id
        FROM users u
        INNER JOIN team_members t ON u.id = t.user_id
        WHERE u.firebase_uid::text = $1::text
        LIMIT 1
    `

	var workspaceID uuid.UUID
	err = db.QueryRowContext(ctx, query, uid).Scan(&workspaceID)

	duration := time.Since(start)

	if err != nil {
		if err == sql.ErrNoRows {
			fmt.Printf("❌ No workspace found for Firebase UID: %s\n", uid)
			return uuid.Nil, fmt.Errorf("user not found or not associated with workspace")
		}
		fmt.Printf("❌ Query error: %v\n", err)
		return uuid.Nil, err
	}

	// Cache the result for 1 hour (workspace membership rarely changes)
	cacheErr := r.redis.Set(ctx, cacheKey, workspaceID.String(), 1*time.Hour).Err()
	if cacheErr != nil {
		// Log warning but don't fail the request
		fmt.Printf("⚠️ Failed to cache workspace_id: %v\n", cacheErr)
	}

	fmt.Printf("✅ Found workspaceID: %s in %v (cached for 1h)\n", workspaceID, duration)
	return workspaceID, nil
}

func (r *userRepository) GetWorkspaceByUID(ctx context.Context, uid string, db DB) (models.Workspace, error) {
	start := time.Now()
	fmt.Printf("🔍 Starting optimized GetWorkspaceIDByUID for uid: %s\n", uid)

	// Optimized query - only get what we need
	query := `
        SELECT w.id, w.name, w.website_url, w.industry, w.plan, w.brand_context, w.total_testimonials
        FROM workspaces w
        INNER JOIN team_members t ON w.id = t.workspace_id
		INNER JOIN users u ON u.id = t.user_id
        WHERE u.firebase_uid::text = $1::text
        LIMIT 1
    `

	var w models.Workspace
	err := db.QueryRowContext(ctx, query, uid).Scan(
		&w.ID, &w.Name, &w.WebsiteURL, &w.Industry, &w.Plan, &w.BrandContext, &w.TotalTestimonials)

	duration := time.Since(start)
	fmt.Printf("⏱️ Optimized query took: %v\n", duration)

	if err != nil {
		if err == sql.ErrNoRows {
			fmt.Printf("❌ No workspace found for Firebase UID: %s\n", uid)
			return models.Workspace{}, fmt.Errorf("user not found or not associated with workspace")
		}
		fmt.Printf("❌ Query error: %v\n", err)
		return models.Workspace{}, err
	}

	return w, nil
}

func (r *userRepository) GetWorkspaceAndUserIDByUID(ctx context.Context, uid string, db DB) (models.WorkspaceWithUserID, error) {
	start := time.Now()
	fmt.Printf("🔍 Starting optimized GetWorkspaceIDByUID for uid: %s\n", uid)

	// Optimized query - only get what we need
	query := `
        SELECT w.id, w.name, w.website_url, w.industry, w.plan, w.brand_context, w.total_testimonials, u.id
        FROM workspaces w
        INNER JOIN team_members t ON w.id = t.workspace_id
		INNER JOIN users u ON u.id = t.user_id
        WHERE u.firebase_uid::text = $1::text
        LIMIT 1
    `

	var w models.WorkspaceWithUserID
	err := db.QueryRowContext(ctx, query, uid).Scan(
		&w.ID, &w.Name, &w.WebsiteURL, &w.Industry, &w.Plan, &w.BrandContext, &w.TotalTestimonials, &w.UserID)

	duration := time.Since(start)
	fmt.Printf("⏱️ Optimized query took: %v\n", duration)

	if err != nil {
		if err == sql.ErrNoRows {
			fmt.Printf("❌ No workspace with user data found for Firebase UID: %s\n", uid)
			return models.WorkspaceWithUserID{}, fmt.Errorf("user not found or not associated with workspace")
		}
		fmt.Printf("❌ Query error: %v\n", err)
		return models.WorkspaceWithUserID{}, err
	}

	return w, nil
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
        WHERE u.firebase_uid::text = $1::text
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

	fmt.Printf("Found user: %+v\n", user)

	if err != nil {
		fmt.Printf("Scan error: %v\n", err)
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
