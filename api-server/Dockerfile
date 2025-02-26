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


# api-server Build Stage
FROM golang:1.23.1-alpine AS builder

WORKDIR /app

# Install build dependencies + timezone data if needed
RUN apk add --no-cache make git tzdata

COPY go.mod go.sum ./
RUN go mod download

COPY . .

# Copy .env file (if required inside the container)
COPY .env /app/.env 

# Build static binary with optimizations
RUN CGO_ENABLED=0 go build \
    -ldflags="-s -w" \
    -trimpath \
    -o /app/api \
    ./cmd

# Final stage - Minimal Image
FROM scratch

# Set the working directory to /app
WORKDIR /app

# Copy .env file to final container (if needed)
#COPY --from=builder /app/.env /app/.env
# RUN if [ -f /app/.env ]; then cp /app/.env /app/.env; else echo ".env not found, skipping"; fi

# # Add SSL certificates (if needed for HTTPS calls)
# COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/

# Copy binary
COPY --from=builder /app/api .

# Health check (optional)
# HEALTHCHECK --interval=30s --timeout=3s CMD ["/app/api", "health"]

EXPOSE 8081

# Run as non-root user
# USER 1000:1000

ENTRYPOINT ["/app/api"]
