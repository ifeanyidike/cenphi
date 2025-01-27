package repositories

import (
	"database/sql"
	"log"
	"testing"

	_ "github.com/mattn/go-sqlite3"
)

// setupTestDB initializes an in-memory SQLite database for testing.
// func SetupTestDB() (*sql.DB, func()) {
// 	// Connect to an in-memory SQLite database
// 	db, err := sql.Open("sqlite3", ":memory:")
// 	if err != nil {
// 		log.Fatalf("Failed to connect to test database: %v", err)
// 	}

// 	// Create schema (replace with your schema)
// 	if _, err := db.Exec(`
// 		CREATE TABLE users (
// 			id TEXT PRIMARY KEY,
// 			email TEXT NOT NULL,
// 			email_verified BOOLEAN NOT NULL,
// 			firebase_uid TEXT NOT NULL,
// 			first_name TEXT NOT NULL,
// 			last_name TEXT NOT NULL,
// 			settings TEXT,
// 			permissions TEXT,
// 			last_active DATETIME,
// 			created_at DATETIME NOT NULL
// 		);

// 		CREATE TABLE workspaces (
//     		id TEXT PRIMARY KEY,
//     		name TEXT NOT NULL,
// 		    website_url TEXT NOT NULL,
//     		plan TEXT DEFAULT 'free',
//     		settings TEXT DEFAULT '{}',
//     		branding_settings TEXT DEFAULT '{}',
//     		custom_domain TEXT,
//     		analytics_settings TEXT DEFAULT '{}',
//     		integration_settings TEXT DEFAULT '{}',
//     		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
//     		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
// 		);

// 	`); err != nil {
// 		log.Fatalf("Failed to create test schema: %v", err)
// 	}

// 	// Return cleanup function to close DB connection
// 	cleanup := func() {
// 		db.Close()
// 	}
// 	return db, cleanup
// }

func SetupTestDB() (*sql.DB, func()) {
	// Connect to an in-memory SQLite database
	db, err := sql.Open("sqlite3", ":memory:")
	if err != nil {
		log.Fatalf("Failed to connect to test database: %v", err)
	}

	// Enable Write-Ahead Logging (WAL) for better performance
	if _, err := db.Exec("PRAGMA journal_mode=WAL;"); err != nil {
		log.Fatalf("Failed to enable WAL mode: %v", err)
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

		CREATE TABLE workspaces (
    		id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    		name TEXT NOT NULL,
		    website_url TEXT NOT NULL,
    		plan TEXT DEFAULT 'free',
    		settings TEXT DEFAULT '{}',
    		branding_settings TEXT DEFAULT '{}',
    		custom_domain TEXT,
    		analytics_settings TEXT DEFAULT '{}',
    		integration_settings TEXT DEFAULT '{}',
    		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
		);
	`); err != nil {
		log.Fatalf("Failed to create test schema: %v", err)
	}

	// Export the database to a file for viewing
	dumpToFile := func(filename string) {
		fileDB, err := sql.Open("sqlite3", filename)
		if err != nil {
			log.Fatalf("Failed to open file-backed database: %v", err)
		}
		defer fileDB.Close()

		// Export the current in-memory database to the file
		if _, err := db.Exec("VACUUM INTO ?", filename); err != nil {
			log.Fatalf("Failed to export in-memory database: %v", err)
		}
		log.Printf("Database exported to file: %s", filename)
	}

	// Cleanup function
	cleanup := func() {
		dumpToFile("test_db.sqlite") // Save database before cleanup
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
