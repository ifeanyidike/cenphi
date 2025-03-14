package repositories_test

import (
	"context"
	"testing"
	"time"

	"github.com/go-redis/redismock/v9"
	"github.com/google/uuid"
	"github.com/ifeanyidike/cenphi/internal/models"
	"github.com/ifeanyidike/cenphi/internal/repositories"
	"github.com/ifeanyidike/cenphi/internal/utils"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestUserRepository(t *testing.T) {
	db, cleanup := repositories.SetupTestDB()
	defer cleanup()
	// db, _, _ := sqlmock.New()

	redisClient, _ := redismock.NewClientMock()
	repo := repositories.NewUserRepository(redisClient)

	t.Run("CreateUser", func(t *testing.T) {
		user := &models.User{
			ID:            uuid.New(),
			Email:         utils.GenerateRandomEmail(),
			FirebaseUID:   utils.RandomString(10),
			EmailVerified: true,
			Name:          utils.RandomString(12),
			CreatedAt:     time.Now(),
			UpdatedAt:     time.Now(),
		}

		err := repo.Create(context.Background(), user, db)
		require.NoError(t, err)
		t.Log("ID in test", user.ID)
		storedUser, err := repo.FindByUID(context.Background(), user.FirebaseUID, db)
		require.NoError(t, err)
		assert.Equal(t, user.Email, storedUser.Email)
		assert.Equal(t, user.Name, storedUser.Name)
	})

	t.Run("UpdateUser", func(t *testing.T) {
		// Create a user to update.
		user := &models.User{
			ID:            uuid.New(),
			Email:         utils.GenerateRandomEmail(),
			FirebaseUID:   utils.RandomString(10),
			EmailVerified: false,
			Name:          utils.RandomString(12),
			CreatedAt:     time.Now(),
			UpdatedAt:     time.Now(),
		}
		err := repo.Create(context.Background(), user, db)
		require.NoError(t, err)

		// Update the user.
		newUserName := utils.RandomString(10)
		user.Name = newUserName
		user.UpdatedAt = time.Now()
		err = repo.Update(context.Background(), user, user.ID, db)
		require.NoError(t, err)

		// Verify the update.
		storedUser, err := repo.FindByUID(context.Background(), user.FirebaseUID, db)
		require.NoError(t, err)
		assert.Equal(t, newUserName, storedUser.Name)
	})

	t.Run("UpdateUserAny", func(t *testing.T) {
		// Create a user to update.
		user := &models.User{
			ID:            uuid.New(),
			Email:         utils.GenerateRandomEmail(),
			FirebaseUID:   utils.RandomString(10),
			EmailVerified: false,
			Name:          utils.RandomString(12),
			CreatedAt:     time.Now(),
			UpdatedAt:     time.Now(),
		}
		err := repo.Create(context.Background(), user, db)
		require.NoError(t, err)

		newUserName := utils.RandomString(10)

		updates := map[string]any{
			"email_verified": true,
			"name":           newUserName,
			"updated_at":     time.Now(),
		}

		err = repo.UpdateAny(context.Background(), updates, user.FirebaseUID, db)
		require.NoError(t, err)

		// Verify the update.
		storedUser, err := repo.FindByUID(context.Background(), user.FirebaseUID, db)
		require.NoError(t, err)
		assert.Equal(t, newUserName, storedUser.Name)
	})

	t.Run("DeleteUser", func(t *testing.T) {
		// Create a user to delete.
		user := &models.User{
			ID:            uuid.New(),
			Email:         utils.GenerateRandomEmail(),
			FirebaseUID:   utils.RandomString(10),
			EmailVerified: false,
			Name:          utils.RandomString(12),
			CreatedAt:     time.Now(),
			UpdatedAt:     time.Now(),
		}
		err := repo.Create(context.Background(), user, db)
		require.NoError(t, err)

		err = repo.Delete(context.Background(), user.ID, db)
		require.NoError(t, err)

		_, err = repo.FindByUID(context.Background(), user.FirebaseUID, db)
		// require.NoError(t, err)
		// assert.Nil(t, err)
		assert.Error(t, err)
	})
}
