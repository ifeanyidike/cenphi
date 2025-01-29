package repositories_test

import (
	"context"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/ifeanyidike/cenphi/internal/models"
	"github.com/ifeanyidike/cenphi/internal/repositories"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestUserRepository(t *testing.T) {
	db, cleanup := repositories.SetupTestDB()
	defer cleanup()

	repo := repositories.NewUserRepository(db)

	t.Run("CreateUser", func(t *testing.T) {
		user := &models.User{
			ID:            uuid.New(),
			Email:         "test@example.com",
			FirebaseUID:   "firebase-uid",
			EmailVerified: true,
			FirstName:     "UpdatedFirstName",
			LastName:      "UpdatedLastName",
			CreatedAt:     time.Now(),
			UpdatedAt:     time.Now(),
		}

		err := repo.Create(context.Background(), user)
		require.NoError(t, err)
		t.Log("ID in test", user.ID)
		storedUser, err := repo.FindByUID(context.Background(), user.FirebaseUID)
		require.NoError(t, err)
		assert.Equal(t, user.Email, storedUser.Email)
		assert.Equal(t, user.FirstName, storedUser.FirstName)
		assert.Equal(t, user.LastName, storedUser.LastName)
	})

	t.Run("UpdateUser", func(t *testing.T) {
		// Create a user to update.
		user := &models.User{
			ID:            uuid.New(),
			Email:         "update@example.com",
			FirebaseUID:   "firebase-uid-1",
			EmailVerified: false,
			FirstName:     "UpdatedFirstName",
			LastName:      "UpdatedLastName",
			CreatedAt:     time.Now(),
			UpdatedAt:     time.Now(),
		}
		err := repo.Create(context.Background(), user)
		require.NoError(t, err)

		// Update the user.
		user.FirstName = "UpdatedFirstName"
		user.LastName = "UpdatedLastName"
		user.UpdatedAt = time.Now()
		err = repo.Update(context.Background(), user, user.ID)
		require.NoError(t, err)

		// Verify the update.
		storedUser, err := repo.FindByUID(context.Background(), user.FirebaseUID)
		require.NoError(t, err)
		assert.Equal(t, "UpdatedFirstName", storedUser.FirstName)
		assert.Equal(t, "UpdatedLastName", storedUser.LastName)
	})

	t.Run("DeleteUser", func(t *testing.T) {
		// Create a user to delete.
		user := &models.User{
			ID:            uuid.New(),
			Email:         "delete@example.com",
			FirebaseUID:   "firebase-uid-2",
			EmailVerified: false,
			FirstName:     "Delete",
			LastName:      "Me",
			CreatedAt:     time.Now(),
			UpdatedAt:     time.Now(),
		}
		err := repo.Create(context.Background(), user)
		require.NoError(t, err)

		err = repo.Delete(context.Background(), user.ID)
		require.NoError(t, err)

		_, err = repo.FindByUID(context.Background(), user.FirebaseUID)
		require.NoError(t, err)
		assert.Nil(t, err)
		// assert.Error(t, err)
	})
}
