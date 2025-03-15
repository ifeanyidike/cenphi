# # Build stage
# FROM golang:1.23.1-alpine AS builder

# # Set the working directory
# WORKDIR /app

# RUN apk add --no-cache \
#     ffmpeg \
#     libmad \
#     libsndfile \
#     libid3tag \
#     gd \
#     boost \
#     wget \
#     curl \
#     bash

# COPY go.mod go.sum ./
# RUN go mod download

# COPY . .

# RUN go build -o /app/api cmd/main.go

# # Run stage
# FROM alpine:3.18

# COPY --from=builder /app/api /app/api

# # Expose port
# EXPOSE 8081

# # Run the API server
# CMD ["/app/api"]


# # api-server Build Stage
# FROM golang:1.23.1-alpine AS builder

# WORKDIR /app

# # Install build dependencies + timezone data if needed
# RUN apk add --no-cache make git tzdata

# COPY go.mod go.sum ./
# RUN go mod download

# COPY . .

# # Copy .env file (if required inside the container)
# # COPY .env /app/.env 

# # Build static binary with optimizations
# RUN CGO_ENABLED=0 go build \
#     -ldflags="-s -w" \
#     -trimpath \
#     -o /app/api \
#     ./cmd

# # Final stage - Minimal Image
# FROM scratch

# # Set the working directory to /app
# WORKDIR /app

# # Copy .env file to final container (if needed)
# #COPY --from=builder /app/.env /app/.env
# # RUN if [ -f /app/.env ]; then cp /app/.env /app/.env; else echo ".env not found, skipping"; fi

# # # Add SSL certificates (if needed for HTTPS calls)
# # COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/

# # Copy binary
# COPY --from=builder /app/api .

# # Health check (optional)
# # HEALTHCHECK --interval=30s --timeout=3s CMD ["/app/api", "health"]

# EXPOSE 8081

# # Run as non-root user
# # USER 1000:1000

# ENTRYPOINT ["/app/api"]

# FROM golang:1.23.1-alpine AS builder

# WORKDIR /app

# # Install build dependencies + timezone data if needed
# RUN apk add --no-cache make git tzdata

# COPY go.mod go.sum ./
# RUN go mod download

# COPY . .

# # Build static binary with optimizations
# RUN CGO_ENABLED=0 go build \
#     -ldflags="-s -w" \
#     -trimpath \
#     -o /app/api \
#     ./cmd

# # Final stage - Minimal Image
# FROM scratch

# # Set the working directory to /app
# WORKDIR /app

# # Copy SSL certificates for HTTPS calls
# #COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/

# # Copy binary
# COPY --from=builder /app/api .

# # Create a simple init script to handle .env file or env vars
# COPY --from=builder /app/scripts/docker-entrypoint.sh /app/docker-entrypoint.sh

# EXPOSE 8081

# ENTRYPOINT ["/app/api"]


# FROM golang:1.23.1-alpine AS builder

# WORKDIR /app

# # Install build dependencies + timezone data if needed
# RUN apk add --no-cache make git tzdata ca-certificates

# COPY go.mod go.sum ./
# RUN go mod download

# ARG CACHE_BUSTER=unknown
# RUN echo "Cache buster: ${CACHE_BUSTER}"

# COPY . .

# # Build static binary with optimizations
# RUN CGO_ENABLED=0 go build \
#     -ldflags="-s -w" \
#     -trimpath \
#     -o /app/api \
#     ./cmd

# # Final stage - Minimal Image
# FROM alpine:latest

# # Set the working directory to /app
# WORKDIR /app

# # Install CA certificates
# RUN apk add --no-cache ca-certificates

# # Copy SSL certificates for HTTPS calls
# COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/

# # Copy Google's root certificates
# COPY google_roots.pem /app/google_roots.pem

# # Copy binary
# COPY --from=builder /app/api .

# # Create a simple init script to handle .env file or env vars
# COPY --from=builder /app/scripts/docker-entrypoint.sh /app/docker-entrypoint.sh

# EXPOSE 8081

# ENTRYPOINT ["/app/api"]


# Build stage
FROM golang:1.23.1-alpine AS builder

# Install build dependencies
RUN apk add --no-cache make git tzdata ca-certificates curl

# Set working directory
WORKDIR /app

# Copy go mod files first to leverage Docker layer caching
COPY go.mod go.sum ./
RUN go mod download

# Add a cache buster argument to force rebuilds when needed
ARG CACHE_BUSTER=unknown
RUN echo "Cache buster: ${CACHE_BUSTER}"

# Copy the rest of the source code
COPY . .

# Build a static binary with optimizations
RUN CGO_ENABLED=0 go build \
    -ldflags="-s -w -X main.Version=$(git describe --tags --always || echo 'dev')" \
    -trimpath \
    -o /app/api \
    ./cmd

# Download Google's root certificates during build
RUN curl -sSL https://pki.goog/roots.pem -o /app/google_roots.pem

# Final stage - Minimal production image
FROM alpine:latest

# Set working directory
WORKDIR /app

# Install CA certificates and other runtime dependencies
RUN apk add --no-cache ca-certificates curl tzdata && \
    update-ca-certificates

# Create a non-root user to run the application
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Set environment variables to tell Go where to find cert files
ENV SSL_CERT_FILE=/etc/ssl/certs/ca-certificates.crt
ENV SSL_CERT_DIR=/etc/ssl/certs

# Download and install Google's root certificates directly
RUN curl -sSL https://pki.goog/roots.pem -o /usr/local/share/ca-certificates/google_roots.crt && \
    chmod 644 /usr/local/share/ca-certificates/google_roots.crt && \
    update-ca-certificates && \
    # Verify certificate setup
    echo "Certificate verification:" && \
    curl -sSL --head https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com || echo "Warning: Certificate verification failed"

# Copy the binary from the builder stage
COPY --from=builder /app/api /app/

# Copy Google's root certificates
COPY --from=builder /app/google_roots.pem /app/google_roots.pem

# Copy the entrypoint script and ensure it has Unix line endings and is executable
COPY scripts/docker-entrypoint.sh /app/docker-entrypoint.sh
# Fix line endings and make executable - this is critical
RUN sed -i 's/\r$//' /app/docker-entrypoint.sh && \
    chmod +x /app/docker-entrypoint.sh

# Create directory for app data
RUN mkdir -p /app/data && \
    chown -R appuser:appgroup /app

# Set permissions on the application directory
RUN chown -R appuser:appgroup /app

# Switch to non-root user
USER appuser

# Set the PORT environment variable for platforms that require it
ENV PORT=8081

# Expose the port
EXPOSE 8081

# Use the entrypoint script
ENTRYPOINT ["/app/docker-entrypoint.sh"]

# Default command
CMD ["/app/api"]