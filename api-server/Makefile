# Load environment variables from the system or .env file
include .env
export $(shell sed 's/=.*//' .env)

# Variables
DB_URL ?= postgres://${DB_USERNAME}:${DB_PASSWORD}@${DB_HOST}/${DB_NAME}?sslmode=${DB_SSL_MODE}

MIGRATIONS_DIR=./scripts/migrations
NETWORK=$(shell docker network ls --filter name=cenphi_default --filter driver=bridge --format "{{.ID}}")
MIGRATE_CMD=docker run --rm --network=${NETWORK} -v $(shell pwd)/scripts/migrations:/migrations migrate/migrate 

# Targets
.PHONY: all up down create init-db

all: up

# Run migrations up
up:
	@echo "Detected network: ${NETWORK}"
	@echo "Running migrate up: $(DB_URL)"
	@echo "Command: $(MIGRATE_CMD) -path=/migrations -database=$(DB_URL) -verbose up"
	$(MIGRATE_CMD) -path=/migrations -database=$(DB_URL) -verbose up

# Run migrations down
down:
	@echo "Detected network: ${NETWORK}"
	$(MIGRATE_CMD) -path=/migrations -database=$(DB_URL) -verbose down -all

clean:
	@echo "Detected network: ${NETWORK}"
	$(MIGRATE_CMD) -path=/migrations -database=$(DB_URL) force 1

# Create a new migration file
# Usage: make create name=your_migration_name
create:
	@echo "Creating migration file: $(MIGRATIONS_DIR)/$(name)"
	mkdir -p $(MIGRATIONS_DIR)
	migrate create -ext sql -dir $(MIGRATIONS_DIR) -seq $(name)

# Initialize the database (optional custom logic)
init-db:
	@echo "Initializing the database..."
	PGPASSWORD=${DB_PASSWORD} psql -h localhost -U ${DB_USERNAME} -d ${DB_NAME} -f ./scripts/init_db.sql
