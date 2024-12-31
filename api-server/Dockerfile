# Build stage
FROM golang:1.23.1-alpine AS builder

# Set the working directory
WORKDIR /app

RUN apk add --no-cache \
    ffmpeg \
    libmad \
    libsndfile \
    libid3tag \
    gd \
    boost \
    wget \
    curl \
    bash

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN go build -o /app/api cmd/api/main.go

# Run stage
FROM alpine:3.18

COPY --from=builder /app/api /app/api

# Expose port
EXPOSE 8081

# Run the API server
CMD ["/app/api"]
