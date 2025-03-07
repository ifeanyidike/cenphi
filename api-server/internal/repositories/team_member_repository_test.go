package repositories_test

import (
	"context"
	"database/sql"
	"testing"
	"time"

	"github.com/go-redis/redismock/v9"
	"github.com/google/uuid"
	"github.com/ifeanyidike/cenphi/internal/models"
	"github.com/ifeanyidike/cenphi/internal/repositories"
	"github.com/ifeanyidike/cenphi/internal/utils"
	"github.com/redis/go-redis/v9"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func setupTestEntities(t *testing.T, db *sql.DB, redisClient *redis.Client) (*models.Workspace, *models.User, *models.TeamMember) {
	workspace := &models.Workspace{
		ID:         uuid.New(),
		Name:       utils.RandomString(11),
		Plan:       "free",
		WebsiteURL: "https://my-org.cenphi.app",
	}

	user := &models.User{
		ID:          uuid.New(),
		Email:       utils.GenerateRandomEmail(),
		FirebaseUID: utils.RandomString(10),
		Name:        utils.RandomString(12),
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	team_member := &models.TeamMember{
		ID:          uuid.New(),
		WorkspaceID: workspace.ID,
		UserID:      user.ID,
		Role:        models.Admin,
		Settings:    make(map[string]interface{}),
		Permissions: make(map[string]interface{}),
		CreatedAt:   time.Now(),
	}

	workspaceRepo := repositories.NewWorkspaceRepository(redisClient)
	userRepo := repositories.NewUserRepository(redisClient)
	teamMemberRepo := repositories.NewTeamMemberRepository(redisClient)

	require.NoError(t, workspaceRepo.Create(context.Background(), workspace, db))
	require.NoError(t, userRepo.Create(context.Background(), user, db))
	require.NoError(t, teamMemberRepo.Create(context.Background(), team_member, db))

	return workspace, user, team_member
}

func TestTeamMemberRepository(t *testing.T) {
	db, cleanup := repositories.SetupTestDB()
	defer cleanup()

	redisClient, _ := redismock.NewClientMock()
	workspaceRepo := repositories.NewWorkspaceRepository(redisClient)
	userRepo := repositories.NewUserRepository(redisClient)
	teamMemberRepo := repositories.NewTeamMemberRepository(redisClient)

	t.Run("CreateTeamMember", func(t *testing.T) {
		workspace, user, teamMember := setupTestEntities(t, db, redisClient)

		// Verify workspace creation
		storedWorkspace, err := workspaceRepo.GetByID(context.Background(), workspace.ID, db)
		require.NoError(t, err)
		assert.Equal(t, workspace.Name, storedWorkspace.Name)

		// Verify user creation
		storedUser, err := userRepo.FindByUID(context.Background(), user.FirebaseUID, db)
		require.NoError(t, err)
		assert.Equal(t, user.Email, storedUser.Email)

		// Verify team member creation
		storedTeamMember, err := teamMemberRepo.GetByID(context.Background(), teamMember.ID, db)
		require.NoError(t, err)
		assert.Equal(t, teamMember.UserID, storedTeamMember.UserID)
	})

	t.Run("GetTeamMembersData", func(t *testing.T) {
		workspace, user, teamMember := setupTestEntities(t, db, redisClient)

		// Verify workspace creation
		storedWorkspace, err := workspaceRepo.GetByID(context.Background(), workspace.ID, db)
		require.NoError(t, err)
		assert.Equal(t, workspace.Name, storedWorkspace.Name)

		// Verify user creation
		storedUser, err := userRepo.FindByUID(context.Background(), user.FirebaseUID, db)
		require.NoError(t, err)
		assert.Equal(t, user.Email, storedUser.Email)

		// Verify team member creation
		storedTeamMember, err := teamMemberRepo.GetDataByID(context.Background(), teamMember.ID, db)
		require.NoError(t, err)
		assert.Equal(t, teamMember.UserID, storedTeamMember.UserID)
		assert.Equal(t, user.Name, storedTeamMember.Name)
		assert.Equal(t, user.Email, storedTeamMember.Email)
		assert.Equal(t, user.FirebaseUID, storedTeamMember.FirebaseUID)
		assert.Equal(t, workspace.Name, storedTeamMember.WorkspaceName)
		assert.Equal(t, workspace.Plan, storedTeamMember.WorkspacePlan)
		assert.Equal(t, workspace.WebsiteURL, storedTeamMember.WebsiteURL)

	})

	t.Run("UpdateTeamMember", func(t *testing.T) {
		_, _, teamMember := setupTestEntities(t, db, redisClient)

		// Update the team member
		teamMember.Role = models.Owner
		require.NoError(t, teamMemberRepo.Update(context.Background(), teamMember, teamMember.ID, db))

		// Verify the update
		storedTeamMember, err := teamMemberRepo.GetByID(context.Background(), teamMember.ID, db)
		require.NoError(t, err)
		assert.Equal(t, teamMember.Role, storedTeamMember.Role)
	})

	t.Run("DeleteTeamMember", func(t *testing.T) {
		_, _, teamMember := setupTestEntities(t, db, redisClient)

		// Delete the team member
		require.NoError(t, teamMemberRepo.Delete(context.Background(), teamMember.ID, db))

		// Verify the deletion
		_, err := teamMemberRepo.GetByID(context.Background(), teamMember.ID, db)
		assert.Error(t, err)
	})

	t.Run("DeleteUser", func(t *testing.T) {
		_, user, teamMember := setupTestEntities(t, db, redisClient)

		require.NoError(t, userRepo.Delete(context.Background(), user.ID, db))

		// Verify the deletion
		_, err := teamMemberRepo.GetByID(context.Background(), teamMember.ID, db)
		assert.Error(t, err)
	})

	t.Run("DeleteWorkspace", func(t *testing.T) {
		workspace, _, teamMember := setupTestEntities(t, db, redisClient)

		require.NoError(t, workspaceRepo.Delete(context.Background(), workspace.ID, db))

		// Verify the deletion
		_, err := teamMemberRepo.GetByID(context.Background(), teamMember.ID, db)
		assert.Error(t, err)
	})
}
