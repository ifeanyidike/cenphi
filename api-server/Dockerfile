# Build stage
FROM golang:1.24-alpine AS builder
ENV CGO_ENABLED=0

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
ARG VERSION=dev
RUN CGO_ENABLED=0 go build \
    -ldflags="-s -w -X main.Version=${VERSION}" \
    -trimpath \
    -o /app/api \
    ./cmd

# Create a custom certificate directory and download certificates
RUN mkdir -p /app/certs && \
    curl -sSL https://pki.goog/roots.pem -o /app/certs/google_roots.pem && \
    curl -sSL https://curl.se/ca/cacert.pem -o /app/certs/cacert.pem

# Final stage - Minimal production image
FROM alpine:latest

# Install only essential packages
RUN apk add --no-cache curl tzdata bind-tools

# Create app directories
RUN mkdir -p /app/certs /app/data

# Copy the binary and certificates from the builder stage
COPY --from=builder /app/api /app/api
COPY --from=builder /app/certs/ /app/certs/

# Copy the entrypoint script
COPY scripts/docker-entrypoint.sh /app/docker-entrypoint.sh
# Fix line endings and make executable
RUN sed -i 's/\r$//' /app/docker-entrypoint.sh && \
    chmod 755 /app/docker-entrypoint.sh

# Set environment variables to point to our custom certificate locations
ENV SSL_CERT_FILE=/app/certs/cacert.pem
ENV GOOGLE_APPLICATION_CREDENTIALS=/app/cenphiio-service-account.json

# Set the PORT environment variable for platforms that require it
ENV PORT=8081

# Set working directory
WORKDIR /app

# Expose the port
EXPOSE 8081

# Use the entrypoint script
ENTRYPOINT ["/app/docker-entrypoint.sh"]

# Default command
CMD ["/app/api"]