package repositories

import (
	"database/sql"
	"log"
	"os"
	"path/filepath"
	"testing"

	// _ "github.com/mattn/go-sqlite3"

	_ "github.com/jackc/pgx/v5/stdlib"
	"github.com/joho/godotenv"
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

// func SetupTestDB() (*sql.DB, func()) {
// 	// Connect to an in-memory SQLite database
// 	db, err := sql.Open("sqlite3", ":memory:")
// 	if err != nil {
// 		log.Fatalf("Failed to connect to test database: %v", err)
// 	}

// 	// Enable Write-Ahead Logging (WAL) for better performance
// 	if _, err := db.Exec("PRAGMA journal_mode=WAL;"); err != nil {
// 		log.Fatalf("Failed to enable WAL mode: %v", err)
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
//     		id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
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

// 	// Export the database to a file for viewing
// 	dumpToFile := func(filename string) {
// 		fileDB, err := sql.Open("sqlite3", filename)
// 		if err != nil {
// 			log.Fatalf("Failed to open file-backed database: %v", err)
// 		}
// 		defer fileDB.Close()

// 		// Export the current in-memory database to the file
// 		if _, err := db.Exec("VACUUM INTO ?", filename); err != nil {
// 			log.Fatalf("Failed to export in-memory database: %v", err)
// 		}
// 		log.Printf("Database exported to file: %s", filename)
// 	}

// 	// Cleanup function
// 	cleanup := func() {
// 		dumpToFile("test_db.sqlite") // Save database before cleanup
// 		db.Close()
// 	}

// 	return db, cleanup
// }

// // Example test for verifying setup
// func TestSetupTestDB(t *testing.T) {
// 	db, cleanup := SetupTestDB()
// 	defer cleanup()

// 	// Validate database connection
// 	if err := db.Ping(); err != nil {
// 		t.Fatalf("Test DB is not reachable: %v", err)
// 	}
// }

func LocateProjectRoot(marker string) string {
	cwd, err := os.Getwd()
	if err != nil {
		log.Fatalf("Error getting current working directory: %v", err)
	}

	for {
		// Check if the marker file exists in the current directory
		markerPath := filepath.Join(cwd, marker)
		if _, err := os.Stat(markerPath); err == nil {
			return cwd
		}

		// Move up one directory
		parentDir := filepath.Dir(cwd)
		if parentDir == cwd {
			// Reached the filesystem root, marker not found
			log.Fatalf("Marker file %s not found, ensure you're running in the correct project structure", marker)
		}
		cwd = parentDir
	}
}

func SetupTestDB() (*sql.DB, func()) {
	// Start a PostgreSQL container
	rootDir := LocateProjectRoot(".env.test")

	envPath := filepath.Join(rootDir, ".env.test")

	if err := godotenv.Load(envPath); err != nil {
		log.Fatalf("Error loading .env.test file: %v", err)
	}

	// Build the connection string

	dsn := "postgres://" + os.Getenv("DB_USERNAME") + ":" + os.Getenv("DB_PASSWORD") +
		"@" + os.Getenv("DB_HOST") + ":" + os.Getenv("DB_PORT") +
		"/" + os.Getenv("DB_NAME") + "?sslmode=disable"

	// Connect to the PostgreSQL database
	db, err := sql.Open("pgx", dsn)
	if err != nil {
		log.Println("DB PARAMS", os.Getenv("DB_USERNAME"), " ", os.Getenv("DB_PASSWORD"), " ", os.Getenv("DB_HOST"), " ", os.Getenv("DB_PORT"), " ", os.Getenv("DB_NAME"))
		log.Fatalf("Failed to connect to test database: %v", err)
	}

	// Drop all tables, types, and extensions to ensure a clean state
	if _, err := db.Exec(`
		CREATE EXTENSION IF NOT EXISTS plpgsql;

		DO $$
		BEGIN
			-- Drop all tables
			EXECUTE (
				COALESCE(
					(
						SELECT string_agg('DROP TABLE IF EXISTS ' || quote_ident(tablename) || ' CASCADE;', ' ')
						FROM pg_tables
						WHERE schemaname = 'public'
					), ''
				)
			);

			-- Drop all types (e.g., enums)
			EXECUTE (
				COALESCE(
					(
						SELECT string_agg('DROP TYPE IF EXISTS ' || quote_ident(t.typname) || ' CASCADE;', ' ')
						FROM pg_type t
						JOIN pg_namespace n ON n.oid = t.typnamespace
						WHERE n.nspname = 'public'
					), ''
				)
			);

			-- Drop all extensions
			EXECUTE (
				COALESCE(
					(
						SELECT string_agg('DROP EXTENSION IF EXISTS ' || quote_ident(extname) || ' CASCADE;', ' ')
						FROM pg_extension
					), ''
				)
			);
		END
		$$;
	`); err != nil {
		log.Fatalf("Failed to clean test database: %v", err)
	}

	// Create schema (replace with your schema)
	if _, err := db.Exec(`
		CREATE EXTENSION IF NOT EXISTS "uuid-ossp"; 
		CREATE TYPE workspace_plan AS ENUM ('free', 'pro', 'enterprise');
		CREATE TYPE member_role AS ENUM ('owner', 'admin', 'editor', 'viewer');
		
		CREATE TABLE users (
		    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
		    firebase_uid VARCHAR(128) NOT NULL UNIQUE,
    		email VARCHAR(255) NOT NULL UNIQUE,
    		email_verified BOOLEAN DEFAULT FALSE,
    		name VARCHAR(255),
    		settings JSONB DEFAULT '{}',
    		permissions JSONB DEFAULT '{}',
    		last_active_at TIMESTAMPTZ,
    		created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
		);

		CREATE TABLE workspaces (
    		id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
		    name VARCHAR(255) NOT NULL,
		    website_url VARCHAR(255) NOT NULL,
		    plan workspace_plan DEFAULT 'free',
		    settings JSONB DEFAULT '{}',
		    branding_settings JSONB DEFAULT '{}',
		    custom_domain VARCHAR(255),
		    analytics_settings JSONB DEFAULT '{}',
		    integration_settings JSONB DEFAULT '{}',
		    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
		    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
		);

		CREATE TABLE team_members (
		    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    		workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    		user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    		role member_role NOT NULL,
    		settings JSONB DEFAULT '{}',
    		permissions JSONB DEFAULT '{}',
    		created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    		UNIQUE(workspace_id, user_id)
		);
	`); err != nil {
		log.Fatalf("Failed to create test schema: %v", err)
	}

	// Cleanup function
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
	t.Log("Test DB connection successful")
}
