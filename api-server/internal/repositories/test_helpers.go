package repositories

import (
	"database/sql"
	"log"
	"testing"

	_ "github.com/mattn/go-sqlite3"
)

// setupTestDB initializes an in-memory SQLite database for testing.
func SetupTestDB() (*sql.DB, func()) {
	// Connect to an in-memory SQLite database
	db, err := sql.Open("sqlite3", ":memory:")
	if err != nil {
		log.Fatalf("Failed to connect to test database: %v", err)
	}

	// Create schema (replace with your schema)
	if _, err := db.Exec(`
		CREATE TABLE users (
			id TEXT PRIMARY KEY,
			email TEXT NOT NULL,
			email_verified BOOLEAN NOT NULL,
			firebase_uid TEXT NOT NULL,
			first_name TEXT NOT NULL,
			last_name TEXT NOT NULL,
			settings TEXT,
			permissions TEXT,
			last_active DATETIME,
			created_at DATETIME NOT NULL
		);
	`); err != nil {
		log.Fatalf("Failed to create test schema: %v", err)
	}

	// Return cleanup function to close DB connection
	cleanup := func() {
		db.Close()
	}
	return db, cleanup
}

// Example test for verifying setup
func TestSetupTestDB(t *testing.T) {
	db, cleanup := SetupTestDB()
	defer cleanup()

	// Validate database connection
	if err := db.Ping(); err != nil {
		t.Fatalf("Test DB is not reachable: %v", err)
	}
}
