package repositories_test

import (
	"context"
	"testing"
	"time"

	"github.com/go-redis/redismock/v9"
	"github.com/google/uuid"
	"github.com/ifeanyidike/cenphi/internal/models"
	"github.com/ifeanyidike/cenphi/internal/repositories"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestWorkspaceRepository(t *testing.T) {
	db, cleanup := repositories.SetupTestDB()
	defer cleanup()

	redisClient, _ := redismock.NewClientMock()
	repo := repositories.NewWorkspaceRepository(redisClient)

	t.Run("CreateWorkspace", func(t *testing.T) {
		workspace := &models.Workspace{
			ID:       uuid.New(),
			Name:     "my-org-workspace",
			Plan:     models.PlanEssential,
			Industry: "health",
			// CustomDomain: "my-org.cenphi.app",
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
			BrandingSettings: &models.BrandingSettings{
				LogoURL:      "https://example.com/logo.png",
				PrimaryColor: "#000000",
			},
			AnalyticsSettings: map[string]any{
				"google_analytics_id": "UA-12345678-90",
			},
			IntegrationSettings: &models.IntegrationSettings{
				GoogleAnalyticsID: "UA-12345678-90",
				SlackWebhookURL:   "https://hooks.slack.com/services/T0000000/B0000000/XXXXXXXXXXXXXXXXXXXXXXXXXX",
			},
			Settings: map[string]any{
				"theme": "dark",
			},
			WebsiteURL: "https://my-org.cenphi.app",
		}

		// settingsJSON, _ := workspace.MarshalSettings()
		// brandingJSON, _ := workspace.MarshalBrandingSettings()
		// analyticsJSON, _ := workspace.MarshalAnalyticsSettings()
		// integrationJSON, _ := workspace.MarshalIntegrationSettings()

		t.Log("Before running create")
		err := repo.Create(context.Background(), workspace, db)
		t.Log("After running create")
		require.NoError(t, err)

		storedUser, err := repo.GetByID(context.Background(), workspace.ID, db)
		require.NoError(t, err)
		assert.Equal(t, workspace.Name, storedUser.Name)
		assert.Equal(t, workspace.ID, storedUser.ID)
		assert.Equal(t, workspace.WebsiteURL, storedUser.WebsiteURL)

		storedUser, err = repo.GetByID(context.Background(), workspace.ID, db)
		require.NoError(t, err)
		assert.Equal(t, workspace.Name, storedUser.Name)
		assert.Equal(t, workspace.ID, storedUser.ID)
		assert.Equal(t, workspace.WebsiteURL, storedUser.WebsiteURL)
		assert.Equal(t, workspace.Industry, storedUser.Industry)
	})

	t.Run("UpdateWorkspace", func(t *testing.T) {
		// Create a workspace to update.
		workspace := &models.Workspace{
			ID:       uuid.New(),
			Name:     "my-org-workspace",
			Plan:     models.PlanEssential,
			Industry: "education",
			// CustomDomain: "my-org.cenphi.app",
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
			BrandingSettings: &models.BrandingSettings{
				LogoURL:      "https://example.com/logo.png",
				PrimaryColor: "#000000",
			},
			AnalyticsSettings: map[string]any{
				"google_analytics_id": "UA-12345678-90",
			},
			IntegrationSettings: &models.IntegrationSettings{
				GoogleAnalyticsID: "UA-12345678-90",
				SlackWebhookURL:   "https://hooks.slack.com/services/T0000000/B0000000/XXXXXXXXXXXXXXXXXXXXXXXXXX",
			},
			Settings: map[string]any{
				"theme": "dark",
			},
			WebsiteURL: "https://my-org.cenphi.app",
		}
		err := repo.Create(context.Background(), workspace, db)
		require.NoError(t, err)

		// Update the workspace.
		workspace.Name = "my-updated-org-workspace"
		workspace.Plan = models.PlanAccelerate
		workspace.CustomDomain = "updated-my-org.cenphi.app"
		workspace.Industry = "government"
		// workspace.BrandingSettings.LogoURL = "https://example.com/updated-logo.png"
		// workspace.AnalyticsSettings["google_analytics_id"] = "UA-98765432-10"
		// workspace.IntegrationSettings.GoogleAnalyticsID = "UA-98765432-10"
		// workspace.IntegrationSettings.SlackWebhookURL = "https://hooks.slack.com/services/T0000000/B0000000/YYYYYYYYYYYYYYYYY"
		// workspace.Settings["theme"] = "light"
		workspace.WebsiteURL = "https://updated-my-org.cenphi.app"

		workspace.UpdatedAt = time.Now()
		err = repo.Update(context.Background(), workspace, workspace.ID, db)
		require.NoError(t, err)

		// Verify the update.
		storedWorkspace, err := repo.GetByID(context.Background(), workspace.ID, db)
		require.NoError(t, err)
		assert.Equal(t, workspace.Name, storedWorkspace.Name)
		assert.Equal(t, workspace.ID, storedWorkspace.ID)
		assert.Equal(t, workspace.WebsiteURL, storedWorkspace.WebsiteURL)
		assert.Equal(t, workspace.CustomDomain, storedWorkspace.CustomDomain)
		assert.Equal(t, workspace.Industry, storedWorkspace.Industry)

	})

	t.Run("DeleteUser", func(t *testing.T) {
		// Create a workspace to delete.
		workspace := &models.Workspace{
			ID:        uuid.New(),
			Name:      "my-org-workspace",
			Plan:      models.PlanEssential,
			Industry:  "software",
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
			Settings: map[string]any{
				"theme": "dark",
			},
			WebsiteURL: "https://my-org.cenphi.app",
		}
		err := repo.Create(context.Background(), workspace, db)
		require.NoError(t, err)

		err = repo.Delete(context.Background(), workspace.ID, db)
		require.NoError(t, err)

		_, err = repo.GetByID(context.Background(), workspace.ID, db)
		// require.NoError(t, err)
		// assert.Nil(t, err)
		assert.Error(t, err)
	})
}
