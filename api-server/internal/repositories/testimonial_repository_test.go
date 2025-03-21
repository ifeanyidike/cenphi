// package repositories_test

// import (
// 	"context"
// 	"database/sql"
// 	"encoding/json"
// 	"errors"
// 	"fmt"
// 	"testing"
// 	"time"

// 	"github.com/DATA-DOG/go-sqlmock"
// 	"github.com/google/uuid"
// 	"github.com/ifeanyidike/cenphi/internal/models"
// 	"github.com/ifeanyidike/cenphi/internal/repositories"
// 	"github.com/redis/go-redis/v9"
// 	"github.com/stretchr/testify/assert"
// )

// func setupMockDB() (*sql.DB, sqlmock.Sqlmock) {
// 	db, mock, err := sqlmock.New()
// 	if err != nil {
// 		panic(err)
// 	}
// 	return db, mock
// }

// func createTestTestimonial() models.Testimonial {
// 	id := uuid.New()
// 	workspaceID := uuid.New()
// 	rating := float32(4.5)
// 	email := "test@example.com"
// 	verifiedAt := time.Now()

// 	return models.Testimonial{
// 		ID:                 id,
// 		WorkspaceID:        workspaceID,
// 		Type:               models.TestimonialTypeText,
// 		Status:             models.StatusApproved,
// 		Content:            "This is a great product!",
// 		MediaURLs:          []string{"https://example.com/image.jpg"},
// 		Rating:             &rating,
// 		Language:           "en",
// 		CustomerName:       "John Doe",
// 		CustomerEmail:      &email,
// 		CustomerTitle:      "CEO",
// 		CustomerCompany:    "Acme Inc",
// 		CustomerLocation:   "New York",
// 		CustomerAvatarURL:  "https://example.com/avatar.jpg",
// 		CustomerMetadata:   map[string]interface{}{"age": 30},
// 		CollectionMethod:   models.CollectionAPI,
// 		VerificationMethod: models.VerificationEmail,
// 		VerificationData:   map[string]interface{}{"code": "123456"},
// 		VerifiedAt:         &verifiedAt,
// 		SourceData:         map[string]interface{}{"review_id": "123"},
// 		Tags:               []string{"product", "service"},
// 		Categories:         []string{"feedback"},
// 		CustomFields:       map[string]interface{}{"priority": "high"},
// 		ViewCount:          10,
// 		ShareCount:         5,
// 		ConversionCount:    2,
// 		EngagementMetrics:  map[string]interface{}{"clicks": 20},
// 		CreatedAt:          time.Now(),
// 		UpdatedAt:          time.Now(),
// 	}
// }

// func TestFetchByWorkspaceID(t *testing.T) {
// 	db, mock := setupMockDB()
// 	defer db.Close()

// 	redisClient := redis.NewClient(&redis.Options{})
// 	repo := repositories.NewTestimonialRepository(redisClient, db)

// 	ctx := context.Background()
// 	workspaceID := uuid.New()
// 	testimonial := createTestTestimonial()
// 	testimonial.WorkspaceID = workspaceID

// 	filter := models.TestimonialFilter{
// 		Types:       []models.TestimonialType{models.TestimonialTypeText},
// 		Statuses:    []models.ContentStatus{models.StatusApproved},
// 		MinRating:   3,
// 		MaxRating:   5,
// 		Tags:        []string{"product"},
// 		Categories:  []string{"feedback"},
// 		DateRange:   models.DateRange{Start: time.Now().AddDate(0, -1, 0), End: time.Now()},
// 		SearchQuery: "great",
// 	}

// 	// Convert complex types to JSON strings for the mock database
// 	mediaURLsJSON, _ := json.Marshal(testimonial.MediaURLs)
// 	customerMetadataJSON, _ := json.Marshal(testimonial.CustomerMetadata)
// 	verificationDataJSON, _ := json.Marshal(testimonial.VerificationData)
// 	sourceDataJSON, _ := json.Marshal(testimonial.SourceData)
// 	tagsJSON, _ := json.Marshal(testimonial.Tags)
// 	categoriesJSON, _ := json.Marshal(testimonial.Categories)
// 	customFieldsJSON, _ := json.Marshal(testimonial.CustomFields)
// 	engagementMetricsJSON, _ := json.Marshal(testimonial.EngagementMetrics)

// 	// Create expected SQL query pattern
// 	expectedQuery := `SELECT \* FROM testimonials WHERE workspace_id = \$1 AND type = ANY\(\$2::text\[\]\) AND status = ANY\(\$3::text\[\]\) AND \(\$4::int IS NULL OR rating >= \$4\) AND \(\$5::int IS NULL OR rating <= \$5\) AND tags @> \$6::text\[\] AND categories @> \$7::text\[\] AND created_at >= \$8 AND created_at <= \$9 AND content ILIKE '%' \|\| \$10 \|\| '%' ORDER BY created_at DESC`

// 	rows := sqlmock.NewRows([]string{
// 		"id", "workspace_id", "type", "status", "content", "media_urls", "rating", "language",
// 		"customer_name", "customer_email", "customer_title", "customer_company",
// 		"customer_location", "customer_avatar_url", "customer_metadata",
// 		"collection_method", "verification_method", "verification_data", "verified_at",
// 		"source_data", "tags", "categories", "custom_fields", "view_count", "share_count",
// 		"conversion_count", "engagement_metrics", "created_at", "updated_at",
// 	}).AddRow(
// 		testimonial.ID, testimonial.WorkspaceID, testimonial.Type, testimonial.Status,
// 		testimonial.Content, string(mediaURLsJSON), testimonial.Rating, testimonial.Language,
// 		testimonial.CustomerName, testimonial.CustomerEmail, testimonial.CustomerTitle,
// 		testimonial.CustomerCompany, testimonial.CustomerLocation, testimonial.CustomerAvatarURL,
// 		string(customerMetadataJSON), testimonial.CollectionMethod, testimonial.VerificationMethod,
// 		string(verificationDataJSON), testimonial.VerifiedAt, string(sourceDataJSON),
// 		string(tagsJSON), string(categoriesJSON), string(customFieldsJSON),
// 		testimonial.ViewCount, testimonial.ShareCount, testimonial.ConversionCount,
// 		string(engagementMetricsJSON), testimonial.CreatedAt, testimonial.UpdatedAt,
// 	)

// 	// Prepare expected arguments
// 	typesStr := "{text}"
// 	statusesStr := "{approved}"
// 	tagsStr := "{product}"
// 	categoriesStr := "{feedback}"

// 	mock.ExpectQuery(expectedQuery).
// 		WithArgs(
// 			workspaceID,
// 			typesStr,
// 			statusesStr,
// 			filter.MinRating,
// 			filter.MaxRating,
// 			tagsStr,
// 			categoriesStr,
// 			filter.DateRange.Start,
// 			filter.DateRange.End,
// 			filter.SearchQuery,
// 		).
// 		WillReturnRows(rows)

// 	testimonials, err := repo.FetchByWorkspaceID(ctx, workspaceID, filter, db)

// 	assert.NoError(t, err)
// 	assert.Len(t, testimonials, 1)
// 	assert.Equal(t, testimonial.ID, testimonials[0].ID)
// 	assert.Equal(t, testimonial.Content, testimonials[0].Content)
// 	assert.Equal(t, testimonial.CustomerName, testimonials[0].CustomerName)

// 	// Test error case
// 	mock.ExpectQuery(expectedQuery).
// 		WithArgs(
// 			workspaceID,
// 			typesStr,
// 			statusesStr,
// 			filter.MinRating,
// 			filter.MaxRating,
// 			tagsStr,
// 			categoriesStr,
// 			filter.DateRange.Start,
// 			filter.DateRange.End,
// 			filter.SearchQuery,
// 		).
// 		WillReturnError(sql.ErrConnDone)

// 	_, err = repo.FetchByWorkspaceID(ctx, workspaceID, filter, db)
// 	assert.Error(t, err)
// }

// func TestUpdateStatus(t *testing.T) {
// 	db, mock := setupMockDB()
// 	defer db.Close()

// 	redisClient := redis.NewClient(&redis.Options{})
// 	repo := repositories.NewTestimonialRepository(redisClient, db)

// 	ctx := context.Background()
// 	id := uuid.New()
// 	status := models.StatusApproved

// 	// Success case
// 	mock.ExpectExec("UPDATE testimonials SET status = \\$1 WHERE id = \\$2").
// 		WithArgs(status, id).
// 		WillReturnResult(sqlmock.NewResult(1, 1))

// 	err := repo.UpdateStatus(ctx, id, status, db)
// 	assert.NoError(t, err)

// 	// Error case: no rows affected
// 	mock.ExpectExec("UPDATE testimonials SET status = \\$1 WHERE id = \\$2").
// 		WithArgs(status, id).
// 		WillReturnResult(sqlmock.NewResult(0, 0))

// 	err = repo.UpdateStatus(ctx, id, status, db)
// 	assert.Error(t, err)
// 	assert.Contains(t, err.Error(), "no testimonial found")

// 	// Error case: query error
// 	mock.ExpectExec("UPDATE testimonials SET status = \\$1 WHERE id = \\$2").
// 		WithArgs(status, id).
// 		WillReturnError(sql.ErrConnDone)

// 	err = repo.UpdateStatus(ctx, id, status, db)
// 	assert.Error(t, err)
// 	assert.Contains(t, err.Error(), "error updating testimonial status")
// }

// func TestCreate(t *testing.T) {
// 	db, mock := setupMockDB()
// 	defer db.Close()

// 	redisClient := redis.NewClient(&redis.Options{})
// 	repo := repositories.NewTestimonialRepository(redisClient, db)

// 	ctx := context.Background()
// 	testimonial := createTestTestimonial()
// 	returnedID := uuid.New()
// 	now := time.Now()

// 	rows := sqlmock.NewRows([]string{"id", "created_at", "updated_at"}).
// 		AddRow(returnedID, now, now)

// 	mock.ExpectQuery("INSERT INTO testimonials").
// 		WithArgs(
// 			testimonial.WorkspaceID, testimonial.Type, testimonial.Status, testimonial.Content,
// 			testimonial.MediaURLs, testimonial.Rating, testimonial.Language,
// 			testimonial.CustomerName, testimonial.CustomerEmail, testimonial.CustomerTitle,
// 			testimonial.CustomerCompany, testimonial.CustomerLocation, testimonial.CustomerAvatarURL,
// 			testimonial.CustomerMetadata, testimonial.CollectionMethod, testimonial.VerificationMethod,
// 			testimonial.VerificationData, testimonial.VerifiedAt, testimonial.SourceData,
// 			testimonial.Tags, testimonial.Categories, testimonial.CustomFields,
// 		).
// 		WillReturnRows(rows)

// 	err := repo.Create(ctx, &testimonial, db)
// 	assert.NoError(t, err)
// 	assert.Equal(t, returnedID, testimonial.ID)
// 	assert.Equal(t, now, testimonial.CreatedAt)
// 	assert.Equal(t, now, testimonial.UpdatedAt)

// 	// Test error case
// 	mock.ExpectQuery("INSERT INTO testimonials").
// 		WithArgs(
// 			testimonial.WorkspaceID, testimonial.Type, testimonial.Status, testimonial.Content,
// 			testimonial.MediaURLs, testimonial.Rating, testimonial.Language,
// 			testimonial.CustomerName, testimonial.CustomerEmail, testimonial.CustomerTitle,
// 			testimonial.CustomerCompany, testimonial.CustomerLocation, testimonial.CustomerAvatarURL,
// 			testimonial.CustomerMetadata, testimonial.CollectionMethod, testimonial.VerificationMethod,
// 			testimonial.VerificationData, testimonial.VerifiedAt, testimonial.SourceData,
// 			testimonial.Tags, testimonial.Categories, testimonial.CustomFields,
// 		).
// 		WillReturnError(sql.ErrConnDone)

// 	err = repo.Create(ctx, &testimonial, db)
// 	assert.Error(t, err)
// }

// func TestBatchUpsert(t *testing.T) {
// 	db, mock := setupMockDB()
// 	defer db.Close()

// 	redisClient := redis.NewClient(&redis.Options{})
// 	repo := repositories.NewTestimonialRepository(redisClient, db)

// 	ctx := context.Background()
// 	testimonials := []models.Testimonial{createTestTestimonial(), createTestTestimonial()}

// 	// Mock transaction behavior
// 	mock.ExpectBegin()

// 	// For each testimonial in the batch, mock the upsert query
// 	returnedID := uuid.New().String()
// 	for range testimonials {
// 		mock.ExpectQuery("INSERT INTO testimonials").
// 			WillReturnRows(sqlmock.NewRows([]string{"id"}).AddRow(returnedID))
// 	}

// 	mock.ExpectCommit()

// 	err := repo.BatchUpsert(ctx, testimonials, db)
// 	assert.NoError(t, err)

// 	// Test transaction error
// 	mock.ExpectBegin()
// 	mock.ExpectQuery("INSERT INTO testimonials").
// 		WillReturnError(errors.New("database error"))
// 	mock.ExpectRollback()

// 	err = repo.BatchUpsert(ctx, []models.Testimonial{createTestTestimonial()}, db)
// 	assert.Error(t, err)
// }

// func TestUpsert(t *testing.T) {
// 	db, mock := setupMockDB()
// 	defer db.Close()

// 	redisClient := redis.NewClient(&redis.Options{})
// 	repo := repositories.NewTestimonialRepository(redisClient, db)

// 	ctx := context.Background()
// 	testimonial := createTestTestimonial()
// 	returnedID := uuid.New().String()

// 	mock.ExpectQuery("INSERT INTO testimonials").
// 		WithArgs(
// 			testimonial.WorkspaceID, testimonial.Type, testimonial.Status, testimonial.Content,
// 			testimonial.MediaURLs, testimonial.Rating, testimonial.Language,
// 			testimonial.CustomerName, testimonial.CustomerEmail, testimonial.CustomerTitle,
// 			testimonial.CustomerCompany, testimonial.CustomerLocation, testimonial.CustomerAvatarURL,
// 			testimonial.CustomerMetadata, testimonial.CollectionMethod, testimonial.VerificationMethod,
// 			testimonial.VerificationData, testimonial.VerifiedAt, testimonial.SourceData,
// 			testimonial.Tags, testimonial.Categories, testimonial.CustomFields,
// 		).
// 		WillReturnRows(sqlmock.NewRows([]string{"id"}).AddRow(returnedID))

// 	err := repo.Upsert(ctx, testimonial, db)
// 	assert.NoError(t, err)

// 	// Test error case
// 	mock.ExpectQuery("INSERT INTO testimonials").
// 		WithArgs(
// 			testimonial.WorkspaceID, testimonial.Type, testimonial.Status, testimonial.Content,
// 			testimonial.MediaURLs, testimonial.Rating, testimonial.Language,
// 			testimonial.CustomerName, testimonial.CustomerEmail, testimonial.CustomerTitle,
// 			testimonial.CustomerCompany, testimonial.CustomerLocation, testimonial.CustomerAvatarURL,
// 			testimonial.CustomerMetadata, testimonial.CollectionMethod, testimonial.VerificationMethod,
// 			testimonial.VerificationData, testimonial.VerifiedAt, testimonial.SourceData,
// 			testimonial.Tags, testimonial.Categories, testimonial.CustomFields,
// 		).
// 		WillReturnError(sql.ErrConnDone)

// 	err = repo.Upsert(ctx, testimonial, db)
// 	assert.Error(t, err)
// }

// // // Additional test for the mock implementation
// // func TestMockTestimonialRepository(t *testing.T) {
// // 	mockRepo := new(mocks.TestimonialRepository)
// // 	ctx := context.Background()
// // 	workspaceID := uuid.New()
// // 	testimonial := createTestTestimonial()

// // 	// Setup expectations
// // 	mockRepo.On("FetchByWorkspaceID", ctx, workspaceID,
// // 		mock.AnythingOfType("repositories.TestimonialFilter"),
// // 		mock.AnythingOfType("*sql.DB")).
// // 		Return([]models.Testimonial{testimonial}, nil)

// // 	// Call the method
// // 	result, err := mockRepo.FetchByWorkspaceID(ctx, workspaceID,
// // 		models.TestimonialFilter{}, &sql.DB{})

// // 	// Assert expectations
// // 	require.NoError(t, err)
// // 	assert.Len(t, result, 1)
// // 	assert.Equal(t, testimonial.ID, result[0].ID)
// // 	mockRepo.AssertExpectations(t)
// // }

// // FetchByID should return an error when the testimonial is not found in the database.
// func TestFetchByIDReturnsErrorWhenTestimonialNotFound(t *testing.T) {
// 	db, mock := setupMockDB()
// 	defer db.Close()

// 	redisClient := redis.NewClient(&redis.Options{})
// 	repo := repositories.NewTestimonialRepository(redisClient, db)

// 	ctx := context.Background()
// 	testID := uuid.New()
// 	queryRegex := `SELECT\s+t\.\*,\s*\(\s*SELECT json_agg\(sa\.\*\)\s*FROM story_analyses sa\s*WHERE sa\.testimonial_id = t\.id\s*\)\s+AS story_analyses,.*FROM testimonials t\s+WHERE t\.id = \$1;`

// 	mock.ExpectQuery(queryRegex).
// 		WithArgs(testID).
// 		WillReturnError(sql.ErrNoRows)

// 	testimonial, err := repo.FetchByID(ctx, testID, db)

// 	assert.Error(t, err)
// 	assert.Nil(t, testimonial)
// 	assert.Contains(t, err.Error(), fmt.Sprintf("testimonial with ID %s not found", testID))

// 	mock.ExpectationsWereMet()
// }

// // Fetch a testimonial by ID and ensure all related data is retrieved correctly.
// func TestFetchByIDWithAllRelatedData(t *testing.T) {
// 	db, mock := setupMockDB()
// 	defer db.Close()

// 	redisClient := redis.NewClient(&redis.Options{})
// 	repo := repositories.NewTestimonialRepository(redisClient, db)

// 	ctx := context.Background()
// 	testID := uuid.New()

// 	expectedTestimonial := &models.Testimonial{
// 		ID:           testID,
// 		WorkspaceID:  uuid.New(),
// 		Type:         "video",
// 		Status:       "published",
// 		Content:      "Great product!",
// 		CustomerName: "John Doe",
// 		CreatedAt:    time.Now(),
// 		UpdatedAt:    time.Now(),
// 	}

// 	rows := sqlmock.NewRows([]string{
// 		"id", "workspace_id", "type", "status", "content", "media_urls",
// 		"rating", "language", "customer_name", "customer_email",
// 		"customer_title", "customer_company", "customer_location",
// 		"customer_avatar_url", "customer_metadata", "collection_method",
// 		"verification_method", "verification_data", "verified_at",
// 		"source_data", "tags", "categories", "custom_fields",
// 		"view_count", "share_count", "conversion_count",
// 		"engagement_metrics", "created_at", "updated_at",
// 	}).
// 		AddRow(
// 			expectedTestimonial.ID, expectedTestimonial.WorkspaceID,
// 			expectedTestimonial.Type, expectedTestimonial.Status,
// 			expectedTestimonial.Content, expectedTestimonial.MediaURLs,
// 			expectedTestimonial.Rating, expectedTestimonial.Language,
// 			expectedTestimonial.CustomerName, expectedTestimonial.CustomerEmail,
// 			expectedTestimonial.CustomerTitle, expectedTestimonial.CustomerCompany,
// 			expectedTestimonial.CustomerLocation, expectedTestimonial.CustomerAvatarURL,
// 			expectedTestimonial.CustomerMetadata, expectedTestimonial.CollectionMethod,
// 			expectedTestimonial.VerificationMethod, expectedTestimonial.VerificationData,
// 			expectedTestimonial.VerifiedAt, expectedTestimonial.SourceData,
// 			expectedTestimonial.Tags, expectedTestimonial.Categories,
// 			expectedTestimonial.CustomFields, expectedTestimonial.ViewCount,
// 			expectedTestimonial.ShareCount, expectedTestimonial.ConversionCount,
// 			expectedTestimonial.EngagementMetrics, expectedTestimonial.CreatedAt,
// 			expectedTestimonial.UpdatedAt,
// 		)

// 	queryRegex := `SELECT\s+t\.\*,\s*\(\s*SELECT json_agg\(sa\.\*\)\s*FROM story_analyses sa\s*WHERE sa\.testimonial_id = t\.id\s*\)\s+AS story_analyses,.*FROM testimonials t\s+WHERE t\.id = \$1;`
// 	mock.ExpectQuery(queryRegex).
// 		WithArgs(testID).
// 		WillReturnRows(rows)

// 	testimonial, err := repo.FetchByID(ctx, testID, db)

// 	assert.NoError(t, err)
// 	assert.NotNil(t, testimonial)
// 	assert.Equal(t, expectedTestimonial.ID, testimonial.ID)
// 	assert.Equal(t, expectedTestimonial.CustomerName, testimonial.CustomerName)
// 	assert.Equal(t, expectedTestimonial.Content, testimonial.Content)

// 	mock.ExpectationsWereMet()
// }

package repositories_test

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"testing"
	"time"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/google/uuid"
	"github.com/ifeanyidike/cenphi/internal/models"
	"github.com/ifeanyidike/cenphi/internal/repositories"
	"github.com/redis/go-redis/v9"
	"github.com/stretchr/testify/assert"
)

// setupMockDB creates a mock database connection.
func setupMockDB() (*sql.DB, sqlmock.Sqlmock) {
	db, mock, err := sqlmock.New()
	if err != nil {
		panic(err)
	}
	return db, mock
}

// createTestTestimonial returns a sample testimonial reflecting the new schema.
// Note: Customer-related fields are now abstracted. We simulate this by generating a CustomerProfileID.
func createTestTestimonial() models.Testimonial {
	id := uuid.New()
	workspaceID := uuid.New()
	cpID := uuid.New() // new customer profile ID
	rating := float32(4.5)
	verifiedAt := time.Now()

	return models.Testimonial{
		ID:                id,
		WorkspaceID:       workspaceID,
		CustomerProfileID: &cpID,
		// For new fields, set TestimonialType and Format:
		TestimonialType:    models.TestimonialTypeCustomer,
		Format:             models.ContentFormatText,
		Status:             models.StatusApproved,
		Language:           "en",
		Title:              "Great Product",
		Summary:            "It really works",
		Content:            "This is a great product!",
		Transcript:         "",
		MediaURLs:          []string{"https://example.com/image.jpg"},
		Rating:             &rating,
		MediaURL:           "https://example.com/media.jpg",
		MediaDuration:      120,
		ThumbnailURL:       "https://example.com/thumb.jpg",
		AdditionalMedia:    json.RawMessage(`["https://example.com/additional.jpg"]`),
		ProductContext:     map[string]interface{}{"product": "Gadget"},
		PurchaseContext:    map[string]interface{}{"date": time.Now().Format(time.RFC3339)},
		ExperienceContext:  map[string]interface{}{"experience": "positive"},
		CollectionMethod:   models.CollectionMethodAPI,
		VerificationMethod: models.VerificationTypeEmail,
		VerificationData:   map[string]interface{}{"code": "123456"},
		VerificationStatus: "verified",
		VerifiedAt:         &verifiedAt,
		AuthenticityScore:  nil,
		SourceData:         map[string]interface{}{"review_id": "123"},
		Published:          true,
		PublishedAt:        &verifiedAt,
		ScheduledPublishAt: nil,
		Tags:               []string{"product", "service"},
		Categories:         []string{"feedback"},
		CustomFields:       map[string]interface{}{"priority": "high"},
		ViewCount:          10,
		ShareCount:         5,
		ConversionCount:    2,
		EngagementMetrics:  map[string]interface{}{"clicks": 20},
		CreatedAt:          time.Now(),
		UpdatedAt:          time.Now(),
	}
}

func TestFetchByWorkspaceID(t *testing.T) {
	db, mock := setupMockDB()
	defer db.Close()

	redisClient := redis.NewClient(&redis.Options{})
	repo := repositories.NewTestimonialRepository(redisClient)

	ctx := context.Background()
	workspaceID := uuid.New()
	testimonial := createTestTestimonial()
	testimonial.WorkspaceID = workspaceID

	filter := models.TestimonialFilter{
		Types:       []models.TestimonialType{models.TestimonialTypeCustomer},
		Statuses:    []models.ContentStatus{models.StatusApproved},
		MinRating:   3,
		MaxRating:   5,
		Tags:        []string{"product"},
		Categories:  []string{"feedback"},
		DateRange:   models.DateRange{Start: time.Now().AddDate(0, -1, 0), End: time.Now()},
		SearchQuery: "great",
	}

	// Convert complex types to JSON strings as expected by the database.
	mediaURLsJSON, _ := json.Marshal(testimonial.MediaURLs)
	verificationDataJSON, _ := json.Marshal(testimonial.VerificationData)
	sourceDataJSON, _ := json.Marshal(testimonial.SourceData)
	tagsJSON, _ := json.Marshal(testimonial.Tags)
	categoriesJSON, _ := json.Marshal(testimonial.Categories)
	customFieldsJSON, _ := json.Marshal(testimonial.CustomFields)
	engagementMetricsJSON, _ := json.Marshal(testimonial.EngagementMetrics)

	// Expected query now selects explicit columns in the new order. []byte("{}")
	expectedQuery := `SELECT id, workspace_id, customer_profile_id, testimonial_type, format, status, language, title, summary, content, transcript, media_urls, rating, media_url, media_duration, thumbnail_url, additional_media, product_context, experience_context, collection_method, verification_method, verification_data, verification_status, verified_at, authenticity_score, source_data, published, published_at, scheduled_publish_at, tags, categories, custom_fields, view_count, share_count, conversion_count, engagement_metrics, created_at, updated_at FROM testimonials WHERE workspace_id = \$1 AND testimonial_type = ANY\(\$2::text\[\]\) AND status = ANY\(\$3::text\[\]\) AND \(\$4::int IS NULL OR rating >= \$4\) AND \(\$5::int IS NULL OR rating <= \$5\) AND tags @> \$6::text\[\] AND categories @> \$7::text\[\] AND created_at >= \$8 AND created_at <= \$9 AND content ILIKE '%' \|\| \$10 \|\| '%' ORDER BY created_at DESC`

	rows := sqlmock.NewRows([]string{
		"id", "workspace_id", "customer_profile_id", "testimonial_type", "format", "status", "language",
		"title", "summary", "content", "transcript", "media_urls", "rating", "media_url", "media_duration",
		"thumbnail_url", "additional_media", "product_context", "experience_context", "collection_method",
		"verification_method", "verification_data", "verification_status", "verified_at", "authenticity_score",
		"source_data", "published", "published_at", "scheduled_publish_at", "tags", "categories",
		"custom_fields", "view_count", "share_count", "conversion_count", "engagement_metrics", "created_at", "updated_at",
	}).AddRow(
		testimonial.ID, testimonial.WorkspaceID, testimonial.CustomerProfileID,
		testimonial.TestimonialType, testimonial.Format, testimonial.Status, testimonial.Language,
		testimonial.Title, testimonial.Summary, testimonial.Content, testimonial.Transcript, string(mediaURLsJSON),
		testimonial.Rating, testimonial.MediaURL, testimonial.MediaDuration, testimonial.ThumbnailURL,
		[]byte("[]"), // additional_media already set as JSON (empty array example)
		"{}", "{}",   // product_context, purchase_context, experience_context
		testimonial.CollectionMethod, testimonial.VerificationMethod, string(verificationDataJSON),
		testimonial.VerificationStatus, testimonial.VerifiedAt, nil, string(sourceDataJSON),
		testimonial.Published, testimonial.PublishedAt, testimonial.ScheduledPublishAt,
		string(tagsJSON), string(categoriesJSON), string(customFieldsJSON),
		testimonial.ViewCount, testimonial.ShareCount, testimonial.ConversionCount,
		string(engagementMetricsJSON), testimonial.CreatedAt, testimonial.UpdatedAt,
	)

	// Prepare expected arguments.
	typesStr := "{customer}"
	statusesStr := "{approved}"
	tagsStr := "{product}"
	categoriesStr := "{feedback}"

	mock.ExpectQuery(expectedQuery).
		WithArgs(
			workspaceID,
			typesStr,
			statusesStr,
			filter.MinRating,
			filter.MaxRating,
			tagsStr,
			categoriesStr,
			filter.DateRange.Start,
			filter.DateRange.End,
			filter.SearchQuery,
		).
		WillReturnRows(rows)

	testimonials, err := repo.FetchByWorkspaceID(ctx, workspaceID, filter, db)
	assert.NoError(t, err)
	assert.Len(t, testimonials, 1)
	// Instead of checking customer name, we check that CustomerProfileID is set.
	assert.NotNil(t, testimonials[0].CustomerProfileID)
	assert.Equal(t, testimonial.Content, testimonials[0].Content)

	// Test error case
	mock.ExpectQuery(expectedQuery).
		WithArgs(
			workspaceID,
			typesStr,
			statusesStr,
			filter.MinRating,
			filter.MaxRating,
			tagsStr,
			categoriesStr,
			filter.DateRange.Start,
			filter.DateRange.End,
			filter.SearchQuery,
		).
		WillReturnError(sql.ErrConnDone)

	_, err = repo.FetchByWorkspaceID(ctx, workspaceID, filter, db)
	assert.Error(t, err)
}

func TestUpdateStatus(t *testing.T) {
	db, mock := setupMockDB()
	defer db.Close()

	redisClient := redis.NewClient(&redis.Options{})
	repo := repositories.NewTestimonialRepository(redisClient)

	ctx := context.Background()
	id := uuid.New()
	status := models.StatusApproved

	// Success case
	mock.ExpectExec("UPDATE testimonials SET status = \\$1 WHERE id = \\$2").
		WithArgs(status, id).
		WillReturnResult(sqlmock.NewResult(1, 1))

	err := repo.UpdateStatus(ctx, id, status, db)
	assert.NoError(t, err)

	// Error case: no rows affected
	mock.ExpectExec("UPDATE testimonials SET status = \\$1 WHERE id = \\$2").
		WithArgs(status, id).
		WillReturnResult(sqlmock.NewResult(0, 0))

	err = repo.UpdateStatus(ctx, id, status, db)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "no testimonial found")

	// Error case: query error
	mock.ExpectExec("UPDATE testimonials SET status = \\$1 WHERE id = \\$2").
		WithArgs(status, id).
		WillReturnError(sql.ErrConnDone)

	err = repo.UpdateStatus(ctx, id, status, db)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "error updating testimonial status")
}

func TestCreate(t *testing.T) {
	db, mock := setupMockDB()
	defer db.Close()

	redisClient := redis.NewClient(&redis.Options{})
	repo := repositories.NewTestimonialRepository(redisClient)

	ctx := context.Background()
	testimonial := createTestTestimonial()
	returnedID := uuid.New()
	now := time.Now()

	// Expected columns now reflect the new schema.
	rows := sqlmock.NewRows([]string{"id", "created_at", "updated_at"}).
		AddRow(returnedID, now, now)

	mock.ExpectQuery("INSERT INTO testimonials").
		WithArgs(
			testimonial.WorkspaceID,
			testimonial.CustomerProfileID,
			testimonial.TestimonialType,
			testimonial.Format,
			testimonial.Status,
			testimonial.Language,
			testimonial.Title,
			testimonial.Summary,
			testimonial.Content,
			testimonial.Transcript,
			testimonial.MediaURLs, // driver.Value will marshal to JSON
			testimonial.Rating,
			testimonial.MediaURL,
			testimonial.MediaDuration,
			testimonial.ThumbnailURL,
			testimonial.AdditionalMedia,
			testimonial.ProductContext,
			testimonial.PurchaseContext,
			testimonial.ExperienceContext,
			testimonial.CollectionMethod,
			testimonial.VerificationMethod,
			testimonial.VerificationData,
			testimonial.VerificationStatus,
			testimonial.VerifiedAt,
			testimonial.AuthenticityScore,
			testimonial.SourceData,
			testimonial.Published,
			testimonial.PublishedAt,
			testimonial.ScheduledPublishAt,
			testimonial.Tags,
			testimonial.Categories,
			testimonial.CustomFields,
			testimonial.ViewCount,
			testimonial.ShareCount,
			testimonial.ConversionCount,
			testimonial.EngagementMetrics,
		).
		WillReturnRows(rows)

	err := repo.Create(ctx, &testimonial, db)
	assert.NoError(t, err)
	assert.Equal(t, returnedID, testimonial.ID)
	assert.Equal(t, now, testimonial.CreatedAt)
	assert.Equal(t, now, testimonial.UpdatedAt)

	// Test error case
	mock.ExpectQuery("INSERT INTO testimonials").
		WithArgs(
			testimonial.WorkspaceID,
			testimonial.CustomerProfileID,
			testimonial.TestimonialType,
			testimonial.Format,
			testimonial.Status,
			testimonial.Language,
			testimonial.Title,
			testimonial.Summary,
			testimonial.Content,
			testimonial.Transcript,
			testimonial.MediaURLs,
			testimonial.Rating,
			testimonial.MediaURL,
			testimonial.MediaDuration,
			testimonial.ThumbnailURL,
			testimonial.AdditionalMedia,
			testimonial.ProductContext,
			testimonial.PurchaseContext,
			testimonial.ExperienceContext,
			testimonial.CollectionMethod,
			testimonial.VerificationMethod,
			testimonial.VerificationData,
			testimonial.VerificationStatus,
			testimonial.VerifiedAt,
			testimonial.AuthenticityScore,
			testimonial.SourceData,
			testimonial.Published,
			testimonial.PublishedAt,
			testimonial.ScheduledPublishAt,
			testimonial.Tags,
			testimonial.Categories,
			testimonial.CustomFields,
			testimonial.ViewCount,
			testimonial.ShareCount,
			testimonial.ConversionCount,
			testimonial.EngagementMetrics,
		).
		WillReturnError(sql.ErrConnDone)

	err = repo.Create(ctx, &testimonial, db)
	assert.Error(t, err)
}

func TestBatchUpsert(t *testing.T) {
	db, mock := setupMockDB()
	defer db.Close()

	redisClient := redis.NewClient(&redis.Options{})
	repo := repositories.NewTestimonialRepository(redisClient)

	ctx := context.Background()
	// Create two test testimonials.
	testimonials := []models.Testimonial{createTestTestimonial(), createTestTestimonial()}

	// Mock transaction behavior.
	mock.ExpectBegin()

	// For each testimonial in the batch, mock the upsert query.
	returnedID := uuid.New().String()
	for range testimonials {
		mock.ExpectQuery("INSERT INTO testimonials").
			WillReturnRows(sqlmock.NewRows([]string{"id"}).AddRow(returnedID))
	}

	mock.ExpectCommit()

	err := repo.BatchUpsert(ctx, testimonials, db)
	assert.NoError(t, err)

	// Test transaction error.
	mock.ExpectBegin()
	mock.ExpectQuery("INSERT INTO testimonials").
		WillReturnError(errors.New("database error"))
	mock.ExpectRollback()

	err = repo.BatchUpsert(ctx, []models.Testimonial{createTestTestimonial()}, db)
	assert.Error(t, err)
}

func TestUpsert(t *testing.T) {
	db, mock := setupMockDB()
	defer db.Close()

	redisClient := redis.NewClient(&redis.Options{})
	repo := repositories.NewTestimonialRepository(redisClient)

	ctx := context.Background()
	testimonial := createTestTestimonial()
	returnedID := uuid.New().String()

	mock.ExpectQuery("INSERT INTO testimonials").
		WithArgs(
			testimonial.WorkspaceID,
			testimonial.CustomerProfileID,
			testimonial.TestimonialType,
			testimonial.Format,
			testimonial.Status,
			testimonial.Language,
			testimonial.Title,
			testimonial.Summary,
			testimonial.Content,
			testimonial.Transcript,
			testimonial.MediaURLs,
			testimonial.Rating,
			testimonial.MediaURL,
			testimonial.MediaDuration,
			testimonial.ThumbnailURL,
			testimonial.AdditionalMedia,
			testimonial.ProductContext,
			testimonial.PurchaseContext,
			testimonial.ExperienceContext,
			testimonial.CollectionMethod,
			testimonial.VerificationMethod,
			testimonial.VerificationData,
			testimonial.VerificationStatus,
			testimonial.VerifiedAt,
			testimonial.AuthenticityScore,
			testimonial.SourceData,
			testimonial.Published,
			testimonial.PublishedAt,
			testimonial.ScheduledPublishAt,
			testimonial.Tags,
			testimonial.Categories,
			testimonial.CustomFields,
			testimonial.ViewCount,
			testimonial.ShareCount,
			testimonial.ConversionCount,
			testimonial.EngagementMetrics,
		).
		WillReturnRows(sqlmock.NewRows([]string{"id"}).AddRow(returnedID))

	err := repo.Upsert(ctx, testimonial, db)
	assert.NoError(t, err)

	// Test error case.
	mock.ExpectQuery("INSERT INTO testimonials").
		WithArgs(
			testimonial.WorkspaceID,
			testimonial.CustomerProfileID,
			testimonial.TestimonialType,
			testimonial.Format,
			testimonial.Status,
			testimonial.Language,
			testimonial.Title,
			testimonial.Summary,
			testimonial.Content,
			testimonial.Transcript,
			testimonial.MediaURLs,
			testimonial.Rating,
			testimonial.MediaURL,
			testimonial.MediaDuration,
			testimonial.ThumbnailURL,
			testimonial.AdditionalMedia,
			testimonial.ProductContext,
			testimonial.PurchaseContext,
			testimonial.ExperienceContext,
			testimonial.CollectionMethod,
			testimonial.VerificationMethod,
			testimonial.VerificationData,
			testimonial.VerificationStatus,
			testimonial.VerifiedAt,
			testimonial.AuthenticityScore,
			testimonial.SourceData,
			testimonial.Published,
			testimonial.PublishedAt,
			testimonial.ScheduledPublishAt,
			testimonial.Tags,
			testimonial.Categories,
			testimonial.CustomFields,
			testimonial.ViewCount,
			testimonial.ShareCount,
			testimonial.ConversionCount,
			testimonial.EngagementMetrics,
		).
		WillReturnError(sql.ErrConnDone)

	err = repo.Upsert(ctx, testimonial, db)
	assert.Error(t, err)
}

// FetchByID returns an error when the testimonial is not found.
func TestFetchByIDReturnsErrorWhenTestimonialNotFound(t *testing.T) {
	db, mock := setupMockDB()
	defer db.Close()

	redisClient := redis.NewClient(&redis.Options{})
	repo := repositories.NewTestimonialRepository(redisClient)

	ctx := context.Background()
	testID := uuid.New()
	queryRegex := `SELECT\s+t\.\*,\s*\(\s*SELECT json_agg\(sa\.\*\)\s*FROM story_analyses sa\s*WHERE sa\.testimonial_id = t\.id\s*\)\s+AS story_analyses,.*FROM testimonials t\s+WHERE t\.id = \$1;`

	mock.ExpectQuery(queryRegex).
		WithArgs(testID).
		WillReturnError(sql.ErrNoRows)

	testimonial, err := repo.FetchByID(ctx, testID, db)
	assert.Error(t, err)
	assert.Nil(t, testimonial)
	assert.Contains(t, err.Error(), fmt.Sprintf("testimonial with ID %s not found", testID))

	mock.ExpectationsWereMet()
}

// FetchByIDWithAllRelatedData should return a testimonial with its related JSON data.
func TestFetchByIDWithAllRelatedData(t *testing.T) {
	db, mock := setupMockDB()
	defer db.Close()

	redisClient := redis.NewClient(&redis.Options{})
	repo := repositories.NewTestimonialRepository(redisClient)

	ctx := context.Background()
	testID := uuid.New()

	expectedTestimonial := &models.Testimonial{
		ID:                testID,
		WorkspaceID:       uuid.New(),
		CustomerProfileID: func() *uuid.UUID { id := uuid.New(); return &id }(),
		TestimonialType:   models.TestimonialTypeCaseStudy,
		Format:            models.ContentFormatVideo,
		Status:            "published",
		Content:           "Great product!",
		Title:             "Awesome Video",
		// Other fields can be set as needed.
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	rows := sqlmock.NewRows([]string{
		"id", "workspace_id", "customer_profile_id", "testimonial_type", "format", "status", "language",
		"title", "summary", "content", "transcript", "media_urls", "rating", "media_url", "media_duration",
		"thumbnail_url", "additional_media", "product_context", "purchase_context", "experience_context",
		"collection_method", "verification_method", "verification_data", "verification_status", "verified_at", "authenticity_score",
		"source_data", "published", "published_at", "scheduled_publish_at", "tags", "categories",
		"custom_fields", "view_count", "share_count", "conversion_count", "engagement_metrics", "created_at", "updated_at",
	}).
		AddRow(
			expectedTestimonial.ID,
			expectedTestimonial.WorkspaceID,
			expectedTestimonial.CustomerProfileID,
			expectedTestimonial.TestimonialType,
			expectedTestimonial.Format,
			expectedTestimonial.Status,
			"", // language
			expectedTestimonial.Title,
			"", // summary
			expectedTestimonial.Content,
			"",           // transcript
			"[]",         // media_urls
			nil,          // rating
			"",           // media_url
			0,            // media_duration
			"",           // thumbnail_url
			[]byte("[]"), // additional_media
			"{}",         // product_context
			"{}",         // purchase_context
			"{}",         // experience_context
			"",           // collection_method
			"",           // verification_method
			"{}",         // verification_data
			"",           // verification_status
			nil,          // verified_at
			nil,          // authenticity_score
			"{}",         // source_data
			false,        // published
			nil,          // published_at
			nil,          // scheduled_publish_at
			"[]",         // tags
			"[]",         // categories
			"{}",         // custom_fields
			0,            // view_count
			0,            // share_count
			0,            // conversion_count
			"{}",         // engagement_metrics
			expectedTestimonial.CreatedAt,
			expectedTestimonial.UpdatedAt,
		)

	queryRegex := `SELECT\s+t\.\*,\s*\(\s*SELECT json_agg\(sa\.\*\)\s*FROM story_analyses sa\s*WHERE sa\.testimonial_id = t\.id\s*\)\s+AS story_analyses,.*FROM testimonials t\s+WHERE t\.id = \$1;`
	mock.ExpectQuery(queryRegex).
		WithArgs(testID).
		WillReturnRows(rows)

	testimonial, err := repo.FetchByID(ctx, testID, db)
	assert.NoError(t, err)
	assert.NotNil(t, testimonial)
	assert.Equal(t, expectedTestimonial.ID, testimonial.ID)
	// Since customer data is now abstracted, check CustomerProfileID instead.
	assert.NotNil(t, testimonial.CustomerProfileID)
	assert.Equal(t, expectedTestimonial.Content, testimonial.Content)

	mock.ExpectationsWereMet()
}
