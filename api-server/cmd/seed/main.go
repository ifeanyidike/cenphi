// seed.go - Schema-qualified version
package main

import (
	"context"
	"database/sql"
	"flag"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"time"

	"github.com/ifeanyidike/cenphi/internal/config"
	_ "github.com/lib/pq" // Import PostgreSQL driver directly
)

func main() {
	// Parse command line flags
	envPtr := flag.String("env", "local", "Environment to seed: local or production")
	forcePtr := flag.Bool("force", false, "Skip confirmation for production seeding")
	debugPtr := flag.Bool("debug", false, "Enable verbose debugging output")
	seedFilePtr := flag.String("seedfile", "testimonial_seed.sql", "Path to seed SQL file")
	schemaPtr := flag.String("schema", "", "Database schema to use (leave empty for auto-detection)")
	flag.Parse()

	// Validate environment
	if *envPtr != "local" && *envPtr != "production" {
		log.Fatal("Environment must be either 'local' or 'production'")
	}

	// Load the appropriate environment file
	var envFile string
	if *envPtr == "production" {
		envFile = ".env.prod"
		fmt.Println("Loading production environment from env.prod...")
	} else {
		envFile = ".env"
		fmt.Println("Loading local environment from .env...")
	}

	// Try to load the environment file
	err := config.LoadEnv(envFile)
	if err != nil {
		fmt.Printf("Warning: Could not load %s file: %v\n", envFile, err)
		fmt.Println("Will continue with existing environment variables.")
	} else {
		fmt.Printf("Successfully loaded environment from %s\n", envFile)
	}

	// Set up connection parameters based on environment
	var dsn string
	if *envPtr == "local" {
		// Docker database connection
		dsn = fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=disable",
			getEnvOrDefault("DB_USERNAME", "postgres"),
			getEnvOrDefault("DB_PASSWORD", "postgres"),
			getEnvOrDefault("DB_HOST", "localhost"),
			getEnvOrDefault("DB_PORT", "5432"),
			getEnvOrDefault("DB_NAME", "postgres"),
		)
		fmt.Println("Connecting to local Docker database...", dsn)
	} else {
		// Production database connection
		dsn = fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=%s",
			os.Getenv("DB_USERNAME"),
			os.Getenv("DB_PASSWORD"),
			os.Getenv("DB_HOST"),
			os.Getenv("DB_PORT"),
			os.Getenv("DB_NAME"),
			getEnvOrDefault("DB_SSL_MODE", "require"),
		)
		fmt.Println("Connecting to production database...")

		// Show confirmation warning for production seeding
		if !*forcePtr {
			fmt.Println("WARNING: You are about to seed the PRODUCTION database.")
			fmt.Printf("Database: %s@%s:%s/%s\n",
				maskString(os.Getenv("DB_USERNAME")),
				os.Getenv("DB_HOST"),
				os.Getenv("DB_PORT"),
				os.Getenv("DB_NAME"))
			fmt.Println("Type 'CONFIRM' to proceed:")

			var confirmation string
			fmt.Scanln(&confirmation)
			if confirmation != "CONFIRM" {
				fmt.Println("Seeding cancelled by user")
				return
			}
		}
	}

	// Print connection information for debugging
	if *debugPtr {
		fmt.Printf("Current working directory: %s\n", getCurrentDir())
		fmt.Printf("Connection string: %s\n", maskPassword(dsn))

		// Print all environment variables
		fmt.Println("Environment variables:")
		for _, env := range os.Environ() {
			if strings.HasPrefix(env, "DB_") {
				parts := strings.SplitN(env, "=", 2)
				if len(parts) == 2 {
					if strings.Contains(parts[0], "PASSWORD") {
						fmt.Printf("  %s=%s\n", parts[0], "****")
					} else {
						fmt.Printf("  %s=%s\n", parts[0], parts[1])
					}
				}
			}
		}
	}

	// Connect to database directly
	fmt.Println("Establishing database connection...")
	db, err := sql.Open("postgres", dsn)
	if err != nil {
		log.Fatalf("Error creating database connection: %v", err)
	}
	defer db.Close()

	// Test the connection with increasing timeouts
	var connected bool
	for _, timeout := range []int{5, 10, 15} {
		fmt.Printf("Testing database connection (timeout: %ds)...\n", timeout)
		ctx, cancel := context.WithTimeout(context.Background(), time.Duration(timeout)*time.Second)
		err := db.PingContext(ctx)
		cancel()

		if err != nil {
			fmt.Printf("Connection failed: %v\n", err)
		} else {
			connected = true
			fmt.Println("Successfully connected to the database!")
			break
		}
	}

	if !connected {
		log.Fatal("Failed to connect to the database after multiple attempts")
	}

	// Dictionary to store schema for each table
	tableSchemas := make(map[string]string)

	// If a schema was specified, use it for all tables
	var targetSchema string
	if *schemaPtr != "" {
		targetSchema = *schemaPtr
		// Set the search path to the specified schema
		_, err = db.Exec(fmt.Sprintf("SET search_path TO %s,public", targetSchema))
		if err != nil {
			log.Fatalf("Failed to set schema to %s: %v", targetSchema, err)
		}
		fmt.Printf("Using specified schema: %s\n", targetSchema)
	} else {
		// Find the workspace table and its schema
		fmt.Println("Detecting schema for tables...")
		rows, err := db.Query(`
			SELECT table_schema, table_name 
			FROM information_schema.tables 
			WHERE table_name IN ('workspaces', 'customer_profiles', 'testimonials', 'testimonial_analyses')
			ORDER BY table_schema, table_name
		`)
		if err != nil {
			log.Fatalf("Error querying table schemas: %v", err)
		}
		defer rows.Close()

		for rows.Next() {
			var schema, tableName string
			if err := rows.Scan(&schema, &tableName); err != nil {
				log.Fatalf("Error scanning schema row: %v", err)
			}
			tableSchemas[tableName] = schema
			fmt.Printf("Found table %s in schema %s\n", tableName, schema)
		}

		// Check if we found the workspaces table
		if schema, exists := tableSchemas["workspaces"]; exists {
			targetSchema = schema
			fmt.Printf("Using schema from workspaces table: %s\n", targetSchema)
		} else {
			log.Fatal("Could not find workspaces table in any schema")
		}

		// Set the search path to the target schema
		_, err = db.Exec(fmt.Sprintf("SET search_path TO %s,public", targetSchema))
		if err != nil {
			log.Fatalf("Failed to set schema to %s: %v", targetSchema, err)
		}
	}

	// Find seed file
	seedFilePath := findSeedFile(*seedFilePtr)
	if seedFilePath == "" {
		log.Fatalf("Could not find seed file %s. Please specify the correct path with -seedfile flag.", *seedFilePtr)
	}

	fmt.Printf("Using seed file: %s\n", seedFilePath)

	// Read the SQL file
	seedSQL, err := os.ReadFile(seedFilePath)
	if err != nil {
		log.Fatalf("Failed to read seed file: %v", err)
	}

	// Extract workspace ID from the database
	var workspaceID string
	workspaceQuery := fmt.Sprintf("SELECT id FROM %s.workspaces LIMIT 1", targetSchema)
	err = db.QueryRow(workspaceQuery).Scan(&workspaceID)
	if err != nil {
		log.Fatalf("Failed to get workspace ID: %v", err)
	}

	fmt.Printf("Using workspace ID: %s\n", workspaceID)

	// Replace the placeholder workspace ID with the actual one
	seedSQLString := strings.Replace(
		string(seedSQL),
		"'a6569f79-3acc-4a32-80bb-938cd873b354'", // Replace this placeholder
		fmt.Sprintf("'%s'", workspaceID),         // With actual workspace ID
		1,
	)

	// Add schema qualification to all table names in the seedSQL
	seedSQLString = addSchemaToTables(seedSQLString, targetSchema)

	// Execute the seed SQL in a transaction
	ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
	defer cancel()

	tx, err := db.BeginTx(ctx, nil)
	if err != nil {
		log.Fatalf("Failed to begin transaction: %v", err)
	}

	fmt.Println("Executing seed SQL...")
	_, err = tx.ExecContext(ctx, seedSQLString)
	if err != nil {
		tx.Rollback()
		log.Fatalf("Failed to execute seed SQL: %v", err)
	}

	err = tx.Commit()
	if err != nil {
		log.Fatalf("Failed to commit transaction: %v", err)
	}

	fmt.Printf("Successfully seeded %s database with testimonial data\n", *envPtr)
}

// Add schema qualification to all table names in SQL
func addSchemaToTables(sql, schema string) string {
	// List of tables to qualify
	tables := []string{
		"customer_profiles",
		"testimonials",
		"testimonial_analyses",
		"competitor_mentions",
		"workspaces",
	}

	// Replace each table name with schema-qualified name
	result := sql
	for _, table := range tables {
		// This regex matches INSERT INTO tablename or any other SQL followed by tablename
		// but not schema.tablename (to avoid double qualification)
		re := regexp.MustCompile(`(INSERT\s+INTO\s+|UPDATE\s+|FROM\s+|JOIN\s+)(?:(?:[^\.])` + table + `)`)
		result = re.ReplaceAllString(result, "$1"+schema+"."+table)
	}

	return result
}

// Helper to get environment variable with a default fallback
func getEnvOrDefault(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}

// Helper to mask password in a connection string for logging
func maskPassword(dsn string) string {
	// Find the password part and replace it with asterisks
	if strings.Contains(dsn, ":") && strings.Contains(dsn, "@") {
		parts := strings.Split(dsn, ":")
		if len(parts) >= 3 {
			userPart := parts[1]
			if idx := strings.Index(userPart, "@"); idx != -1 {
				// We have the standard postgres://user:password@host format
				return strings.Replace(dsn,
					parts[1][:idx],
					"****",
					1)
			}
		}
	}

	// If we can't parse it properly, do a more general masking
	return strings.Replace(dsn,
		os.Getenv("DB_PASSWORD"),
		"****",
		1)
}

// Helper to mask sensitive strings for logging
func maskString(s string) string {
	if len(s) <= 2 {
		return "****"
	}
	visible := len(s) / 4
	if visible < 1 {
		visible = 1
	}
	return s[:visible] + strings.Repeat("*", len(s)-visible)
}

// Get current working directory
func getCurrentDir() string {
	dir, err := os.Getwd()
	if err != nil {
		return "unknown"
	}
	return dir
}

// Find the seed file by trying multiple locations
func findSeedFile(fileName string) string {
	// Try various possible locations
	possibleLocations := []string{
		fileName,
		filepath.Join(".", fileName),
		filepath.Join("database", "seeds", fileName),
		filepath.Join(".", "database", "seeds", fileName),
		filepath.Join("..", "database", "seeds", fileName),
	}

	// Add any folders in the current directory that might have the seed file
	entries, err := os.ReadDir(".")
	if err == nil {
		for _, entry := range entries {
			if entry.IsDir() {
				possibleLocations = append(possibleLocations,
					filepath.Join(entry.Name(), fileName),
					filepath.Join(entry.Name(), "seeds", fileName),
					filepath.Join(entry.Name(), "database", "seeds", fileName),
				)
			}
		}
	}

	for _, location := range possibleLocations {
		if _, err := os.Stat(location); err == nil {
			return location
		}
	}

	return ""
}
