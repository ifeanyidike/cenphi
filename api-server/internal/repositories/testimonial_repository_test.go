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
	expectedQuery := `SELECT id, workspace_id, customer_profile_id, testimonial_type, format, status, language, title, summary, content, transcript, media_urls, rating, media_url, media_duration, thumbnail_url, additional_media, custom_formatting, product_context, experience_context, collection_method, verification_method, verification_data, verification_status, verified_at, authenticity_score, source_data, published, published_at, scheduled_publish_at, tags, categories, custom_fields, view_count, share_count, conversion_count, engagement_metrics, created_at, updated_at FROM testimonials WHERE workspace_id = \$1 AND testimonial_type = ANY\(\$2::text\[\]\) AND status = ANY\(\$3::text\[\]\) AND \(\$4::int IS NULL OR rating >= \$4\) AND \(\$5::int IS NULL OR rating <= \$5\) AND tags @> \$6::text\[\] AND categories @> \$7::text\[\] AND created_at >= \$8 AND created_at <= \$9 AND content ILIKE '%' \|\| \$10 \|\| '%' ORDER BY created_at DESC`

	rows := sqlmock.NewRows([]string{
		"id", "workspace_id", "customer_profile_id", "testimonial_type", "format", "status", "language",
		"title", "summary", "content", "transcript", "media_urls", "rating", "media_url", "media_duration",
		"thumbnail_url", "additional_media", "custom_formatting", "product_context", "experience_context", "collection_method",
		"verification_method", "verification_data", "verification_status", "verified_at", "authenticity_score",
		"source_data", "published", "published_at", "scheduled_publish_at", "tags", "categories",
		"custom_fields", "view_count", "share_count", "conversion_count", "engagement_metrics", "created_at", "updated_at",
	}).AddRow(
		testimonial.ID, testimonial.WorkspaceID, testimonial.CustomerProfileID,
		testimonial.TestimonialType, testimonial.Format, testimonial.Status, testimonial.Language,
		testimonial.Title, testimonial.Summary, testimonial.Content, testimonial.Transcript, string(mediaURLsJSON),
		testimonial.Rating, testimonial.MediaURL, testimonial.MediaDuration, testimonial.ThumbnailURL,
		[]byte("[]"), // additional_media already set as JSON (empty array example)
		"{}",
		"{}", "{}", // product_context, purchase_context, experience_context
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
			testimonial.CustomFormatting,
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
			testimonial.CustomFormatting,
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
			testimonial.CustomFormatting,
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

// // FetchByID returns an error when the testimonial is not found.
// func TestFetchByIDReturnsErrorWhenTestimonialNotFound(t *testing.T) {
// 	db, mock := setupMockDB()
// 	defer db.Close()

// 	redisClient := redis.NewClient(&redis.Options{})
// 	repo := repositories.NewTestimonialRepository(redisClient)

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

// // FetchByIDWithAllRelatedData should return a testimonial with its related JSON data.
// func TestFetchByIDWithAllRelatedData(t *testing.T) {
// 	db, mock := setupMockDB()
// 	defer db.Close()

// 	redisClient := redis.NewClient(&redis.Options{})
// 	repo := repositories.NewTestimonialRepository(redisClient)

// 	ctx := context.Background()
// 	testID := uuid.New()

// 	expectedTestimonial := &models.Testimonial{
// 		ID:                testID,
// 		WorkspaceID:       uuid.New(),
// 		CustomerProfileID: func() *uuid.UUID { id := uuid.New(); return &id }(),
// 		TestimonialType:   models.TestimonialTypeCaseStudy,
// 		Format:            models.ContentFormatVideo,
// 		Status:            "published",
// 		Content:           "Great product!",
// 		Title:             "Awesome Video",
// 		// Other fields can be set as needed.
// 		CreatedAt: time.Now(),
// 		UpdatedAt: time.Now(),
// 	}

// 	rows := sqlmock.NewRows([]string{
// 		"id", "workspace_id", "customer_profile_id", "testimonial_type", "format", "status", "language",
// 		"title", "summary", "content", "transcript", "media_urls", "rating", "media_url", "media_duration",
// 		"thumbnail_url", "additional_media", "product_context", "purchase_context", "experience_context",
// 		"collection_method", "verification_method", "verification_data", "verification_status", "verified_at", "authenticity_score",
// 		"source_data", "published", "published_at", "scheduled_publish_at", "tags", "categories",
// 		"custom_fields", "view_count", "share_count", "conversion_count", "engagement_metrics", "created_at", "updated_at",
// 	}).
// 		AddRow(
// 			expectedTestimonial.ID,
// 			expectedTestimonial.WorkspaceID,
// 			expectedTestimonial.CustomerProfileID,
// 			expectedTestimonial.TestimonialType,
// 			expectedTestimonial.Format,
// 			expectedTestimonial.Status,
// 			"", // language
// 			expectedTestimonial.Title,
// 			"", // summary
// 			expectedTestimonial.Content,
// 			"",           // transcript
// 			"[]",         // media_urls
// 			nil,          // rating
// 			"",           // media_url
// 			0,            // media_duration
// 			"",           // thumbnail_url
// 			[]byte("[]"), // additional_media
// 			"{}",         // product_context
// 			"{}",         // purchase_context
// 			"{}",         // experience_context
// 			"",           // collection_method
// 			"",           // verification_method
// 			"{}",         // verification_data
// 			"",           // verification_status
// 			nil,          // verified_at
// 			nil,          // authenticity_score
// 			"{}",         // source_data
// 			false,        // published
// 			nil,          // published_at
// 			nil,          // scheduled_publish_at
// 			"[]",         // tags
// 			"[]",         // categories
// 			"{}",         // custom_fields
// 			0,            // view_count
// 			0,            // share_count
// 			0,            // conversion_count
// 			"{}",         // engagement_metrics
// 			expectedTestimonial.CreatedAt,
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
// 	// Since customer data is now abstracted, check CustomerProfileID instead.
// 	assert.NotNil(t, testimonial.CustomerProfileID)
// 	assert.Equal(t, expectedTestimonial.Content, testimonial.Content)

// 	mock.ExpectationsWereMet()
// }

// TestFetchByIDReturnsErrorWhenTestimonialNotFound tests the error case
func TestFetchByIDReturnsErrorWhenTestimonialNotFound(t *testing.T) {
	db, mock := setupMockDB()
	defer db.Close()

	redisClient := redis.NewClient(&redis.Options{})
	repo := repositories.NewTestimonialRepository(redisClient)

	ctx := context.Background()
	testID := uuid.New()
	queryRegex := `SELECT\s+t\.\*,\s*\(\s*SELECT json_agg\(a\.\*\)\s*FROM testimonial_analyses a\s*WHERE a\.testimonial_id = t\.id\s*\)\s+AS analyses,.*FROM testimonials t\s+WHERE t\.id = \$1;`

	mock.ExpectQuery(queryRegex).
		WithArgs(testID).
		WillReturnError(sql.ErrNoRows)

	testimonial, err := repo.FetchByID(ctx, testID, db)
	assert.Error(t, err)
	assert.Nil(t, testimonial)
	assert.Contains(t, err.Error(), fmt.Sprintf("testimonial with ID %s not found", testID))

	mock.ExpectationsWereMet()
}

// TestFetchByIDWithAllRelatedData tests the successful retrieval case
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
		TestimonialType:   models.TestimonialTypeCustomer,
		Format:            models.ContentFormatVideo,
		Status:            models.StatusApproved,
		Content:           "Great product!",
		Title:             "Awesome Video",
		TriggerSource:     "website_form",                                      // New field
		TriggerData:       map[string]interface{}{"campaign": "spring_launch"}, // New field
		// Other fields can be set as needed.
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	// Create mock rows with proper column names
	rows := sqlmock.NewRows([]string{
		"id", "workspace_id", "customer_profile_id", "testimonial_type", "format", "status", "language",
		"title", "summary", "content", "transcript", "media_urls", "rating", "media_url", "media_duration",
		"thumbnail_url", "additional_media", "custom_formatting", "product_context", "purchase_context", "experience_context",
		"collection_method", "trigger_source", "trigger_data", "verification_method", "verification_data",
		"verification_status", "verified_at", "authenticity_score", "source_data", "published", "published_at",
		"scheduled_publish_at", "tags", "categories", "custom_fields", "view_count", "share_count",
		"conversion_count", "engagement_metrics", "created_at", "updated_at",
		"analyses", "competitor_mentions", "ai_jobs",
	}).
		AddRow(
			expectedTestimonial.ID,
			expectedTestimonial.WorkspaceID,
			expectedTestimonial.CustomerProfileID,
			expectedTestimonial.TestimonialType,
			expectedTestimonial.Format,
			expectedTestimonial.Status,
			"en", // language
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
			"{}",
			"{}",                               // product_context
			"{}",                               // purchase_context
			"{}",                               // experience_context
			"website",                          // collection_method
			expectedTestimonial.TriggerSource,  // trigger_source
			"{\"campaign\":\"spring_launch\"}", // trigger_data
			"",                                 // verification_method
			"{}",                               // verification_data
			"",                                 // verification_status
			nil,                                // verified_at
			nil,                                // authenticity_score
			"{}",                               // source_data
			false,                              // published
			nil,                                // published_at
			nil,                                // scheduled_publish_at
			"[]",                               // tags
			"[]",                               // categories
			"{}",                               // custom_fields
			0,                                  // view_count
			0,                                  // share_count
			0,                                  // conversion_count
			"{}",                               // engagement_metrics
			expectedTestimonial.CreatedAt,
			expectedTestimonial.UpdatedAt,
			// Associated data
			"[]", // analyses (empty array)
			"[]", // competitor_mentions (empty array)
			"[]", // ai_jobs (empty array)
		)

	// Setup query expectation with the new structure
	queryRegex := `SELECT\s+t\.\*,\s*\(\s*SELECT json_agg\(a\.\*\)\s*FROM testimonial_analyses a\s*WHERE a\.testimonial_id = t\.id\s*\)\s+AS analyses,.*FROM testimonials t\s+WHERE t\.id = \$1;`
	mock.ExpectQuery(queryRegex).
		WithArgs(testID).
		WillReturnRows(rows)

	testimonial, err := repo.FetchByID(ctx, testID, db)
	assert.NoError(t, err)
	assert.NotNil(t, testimonial)
	assert.Equal(t, expectedTestimonial.ID, testimonial.ID)
	assert.NotNil(t, testimonial.CustomerProfileID)
	assert.Equal(t, expectedTestimonial.Content, testimonial.Content)
	assert.Equal(t, expectedTestimonial.TriggerSource, testimonial.TriggerSource)

	// Check that trigger data was properly unmarshaled
	assert.NotNil(t, testimonial.TriggerData)
	assert.Equal(t, "spring_launch", testimonial.TriggerData["campaign"])

	// Check that arrays are initialized but empty
	assert.Empty(t, testimonial.Analyses)
	assert.Empty(t, testimonial.CompetitorMentions)
	assert.Empty(t, testimonial.AIJobs)

	mock.ExpectationsWereMet()
}

// TestFetchByIDWithPopulatedRelatedData tests retrieval with populated related entities
func TestFetchByIDWithPopulatedRelatedData(t *testing.T) {
	db, mock := setupMockDB()
	defer db.Close()

	redisClient := redis.NewClient(&redis.Options{})
	repo := repositories.NewTestimonialRepository(redisClient)

	ctx := context.Background()
	testID := uuid.New()

	// Create example related data JSON
	analysesJSON := `[
        {
            "id": "` + uuid.New().String() + `",
            "testimonial_id": "` + testID.String() + `",
            "analysis_type": "sentiment",
            "sentiment_score": 0.8,
            "analysis_data": {"mood": "positive", "confidence": 0.85},
            "created_at": "2023-01-01T12:00:00Z"
        }
    ]`

	competitorMentionsJSON := `[
        {
            "id": "` + uuid.New().String() + `",
            "testimonial_id": "` + testID.String() + `",
            "competitor_name": "Competitor Inc",
            "sentiment": "neutral",
            "created_at": "2023-01-01T12:00:00Z"
        }
    ]`

	aiJobsJSON := `[
        {
            "id": "` + uuid.New().String() + `",
            "testimonial_id": "` + testID.String() + `",
            "job_type": "analysis",
            "status": "completed",
            "input_parameters": {},
            "output_data": {"found_topics": ["quality", "service"]},
            "created_at": "2023-01-01T12:00:00Z",
            "updated_at": "2023-01-01T12:05:00Z"
        }
    ]`

	// Setup rows with the same structure as before but with populated related data
	rows := sqlmock.NewRows([]string{
		"id", "workspace_id", "customer_profile_id", "testimonial_type", "format", "status", "language",
		"title", "summary", "content", "transcript", "media_urls", "rating", "media_url", "media_duration",
		"thumbnail_url", "additional_media", "custom_formatting", "product_context", "purchase_context", "experience_context",
		"collection_method", "trigger_source", "trigger_data", "verification_method", "verification_data",
		"verification_status", "verified_at", "authenticity_score", "source_data", "published", "published_at",
		"scheduled_publish_at", "tags", "categories", "custom_fields", "view_count", "share_count",
		"conversion_count", "engagement_metrics", "created_at", "updated_at",
		"analyses", "competitor_mentions", "ai_jobs",
	}).
		AddRow(
			testID,
			uuid.New(),
			uuid.New(),
			"customer",
			"video",
			"approved",
			"en",
			"Great Video",
			"",
			"Great product!",
			"",
			"[]",
			4,
			"",
			0,
			"",
			[]byte("[]"),
			"{}",
			"{}",
			"{}",
			"{}",
			"website",
			"website_form",
			"{\"campaign\":\"spring_launch\"}",
			"",
			"{}",
			"",
			nil,
			nil,
			"{}",
			false,
			nil,
			nil,
			"[]",
			"[]",
			"{}",
			0,
			0,
			0,
			"{}",
			time.Now(),
			time.Now(),
			// Populated related data
			analysesJSON,
			competitorMentionsJSON,
			aiJobsJSON,
		)

	// Setup query expectation with the new structure
	queryRegex := `SELECT\s+t\.\*,\s*\(\s*SELECT json_agg\(a\.\*\)\s*FROM testimonial_analyses a\s*WHERE a\.testimonial_id = t\.id\s*\)\s+AS analyses,.*FROM testimonials t\s+WHERE t\.id = \$1;`
	mock.ExpectQuery(queryRegex).
		WithArgs(testID).
		WillReturnRows(rows)

	testimonial, err := repo.FetchByID(ctx, testID, db)
	assert.NoError(t, err)
	assert.NotNil(t, testimonial)

	// Check related data is populated
	assert.Len(t, testimonial.Analyses, 1)
	assert.Equal(t, models.AnalysisTypeSentiment, testimonial.Analyses[0].AnalysisType)
	assert.Equal(t, float32(0.8), *testimonial.Analyses[0].SentimentScore)

	assert.Len(t, testimonial.CompetitorMentions, 1)
	assert.Equal(t, "Competitor Inc", testimonial.CompetitorMentions[0].CompetitorName)

	assert.Len(t, testimonial.AIJobs, 1)
	assert.Equal(t, models.AIServiceCategoryAnalysis, testimonial.AIJobs[0].JobType)
	assert.Equal(t, "completed", testimonial.AIJobs[0].Status)

	mock.ExpectationsWereMet()
}
