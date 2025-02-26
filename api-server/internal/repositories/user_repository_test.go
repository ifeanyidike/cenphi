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
			FirstName:     utils.RandomString(8),
			LastName:      utils.RandomString(8),
			CreatedAt:     time.Now(),
			UpdatedAt:     time.Now(),
		}

		err := repo.Create(context.Background(), user, db)
		require.NoError(t, err)
		t.Log("ID in test", user.ID)
		storedUser, err := repo.FindByUID(context.Background(), user.FirebaseUID, db)
		require.NoError(t, err)
		assert.Equal(t, user.Email, storedUser.Email)
		assert.Equal(t, user.FirstName, storedUser.FirstName)
		assert.Equal(t, user.LastName, storedUser.LastName)
	})

	t.Run("UpdateUser", func(t *testing.T) {
		// Create a user to update.
		user := &models.User{
			ID:            uuid.New(),
			Email:         utils.GenerateRandomEmail(),
			FirebaseUID:   utils.RandomString(10),
			EmailVerified: false,
			FirstName:     utils.RandomString(8),
			LastName:      utils.RandomString(8),
			CreatedAt:     time.Now(),
			UpdatedAt:     time.Now(),
		}
		err := repo.Create(context.Background(), user, db)
		require.NoError(t, err)

		// Update the user.
		user.FirstName = "UpdatedFirstName"
		user.LastName = "UpdatedLastName"
		user.UpdatedAt = time.Now()
		err = repo.Update(context.Background(), user, user.ID, db)
		require.NoError(t, err)

		// Verify the update.
		storedUser, err := repo.FindByUID(context.Background(), user.FirebaseUID, db)
		require.NoError(t, err)
		assert.Equal(t, "UpdatedFirstName", storedUser.FirstName)
		assert.Equal(t, "UpdatedLastName", storedUser.LastName)
	})

	t.Run("DeleteUser", func(t *testing.T) {
		// Create a user to delete.
		user := &models.User{
			ID:            uuid.New(),
			Email:         utils.GenerateRandomEmail(),
			FirebaseUID:   utils.RandomString(10),
			EmailVerified: false,
			FirstName:     utils.RandomString(8),
			LastName:      utils.RandomString(8),
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
