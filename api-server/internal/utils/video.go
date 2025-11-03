package utils

import (
	"context"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"os/exec"
	"strconv"
	"strings"
	"time"

	"cloud.google.com/go/storage"
	"google.golang.org/api/option"
)

// VideoMetadata contains extracted video information
type VideoMetadata struct {
	Duration     float64 `json:"duration"`
	ThumbnailURL string  `json:"thumbnail_url"`
	Width        int     `json:"width"`
	Height       int     `json:"height"`
}

// ExtractVideoMetadata extracts duration and generates thumbnail for a video
// videoURL can be either a GCS URL (gs://bucket/path) or HTTP URL
// Returns VideoMetadata with duration and uploaded thumbnail URL
func ExtractVideoMetadata(videoURL string, workspaceID string) (*VideoMetadata, error) {
	// Download video to temp file
	tempVideoPath, err := downloadVideoToTemp(videoURL)
	if err != nil {
		return nil, fmt.Errorf("failed to download video: %w", err)
	}
	defer os.Remove(tempVideoPath)

	// Extract duration using ffprobe
	duration, width, height, err := extractVideoDuration(tempVideoPath)
	if err != nil {
		return nil, fmt.Errorf("failed to extract duration: %w", err)
	}

	// Generate thumbnail at 25% mark
	thumbnailPath, err := generateThumbnail(tempVideoPath, duration*0.25)
	if err != nil {
		return nil, fmt.Errorf("failed to generate thumbnail: %w", err)
	}
	defer os.Remove(thumbnailPath)

	// Upload thumbnail to GCS
	thumbnailURL, err := uploadThumbnailToGCS(thumbnailPath, workspaceID)
	if err != nil {
		return nil, fmt.Errorf("failed to upload thumbnail: %w", err)
	}

	return &VideoMetadata{
		Duration:     duration,
		ThumbnailURL: thumbnailURL,
		Width:        width,
		Height:       height,
	}, nil
}

// downloadVideoToTemp downloads video from URL to a temporary file
func downloadVideoToTemp(videoURL string) (string, error) {
	var tempFile *os.File
	var err error

	// Check if it's a GCS URL
	if strings.HasPrefix(videoURL, "gs://") {
		return downloadFromGCS(videoURL)
	}

	// Download from HTTP/HTTPS
	resp, err := http.Get(videoURL)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("failed to download video: status %d", resp.StatusCode)
	}

	// Create temp file
	tempFile, err = os.CreateTemp("", "video-*.mp4")
	if err != nil {
		return "", err
	}
	defer tempFile.Close()

	// Copy content
	_, err = io.Copy(tempFile, resp.Body)
	if err != nil {
		os.Remove(tempFile.Name())
		return "", err
	}

	return tempFile.Name(), nil
}

// downloadFromGCS downloads a file from Google Cloud Storage
func downloadFromGCS(gcsURL string) (string, error) {
	// Parse GCS URL: gs://bucket/path
	gcsURL = strings.TrimPrefix(gcsURL, "gs://")
	parts := strings.SplitN(gcsURL, "/", 2)
	if len(parts) != 2 {
		return "", fmt.Errorf("invalid GCS URL format")
	}

	bucket := parts[0]
	object := parts[1]

	ctx := context.Background()

	// Initialize GCS client
	client, err := storage.NewClient(ctx, option.WithCredentialsFile(os.Getenv("GOOGLE_APPLICATION_CREDENTIALS")))
	if err != nil {
		return "", fmt.Errorf("failed to create GCS client: %w", err)
	}
	defer client.Close()

	// Create temp file
	tempFile, err := os.CreateTemp("", "video-*.mp4")
	if err != nil {
		return "", err
	}
	defer tempFile.Close()

	// Download object
	reader, err := client.Bucket(bucket).Object(object).NewReader(ctx)
	if err != nil {
		os.Remove(tempFile.Name())
		return "", fmt.Errorf("failed to read GCS object: %w", err)
	}
	defer reader.Close()

	// Copy content
	_, err = io.Copy(tempFile, reader)
	if err != nil {
		os.Remove(tempFile.Name())
		return "", err
	}

	return tempFile.Name(), nil
}

// extractVideoDuration uses ffprobe to get video duration and dimensions
func extractVideoDuration(videoPath string) (duration float64, width int, height int, err error) {
	// Run ffprobe to get duration and dimensions
	cmd := exec.Command("ffprobe",
		"-v", "error",
		"-show_entries", "format=duration:stream=width,height",
		"-of", "default=noprint_wrappers=1",
		videoPath,
	)

	output, err := cmd.CombinedOutput()
	if err != nil {
		return 0, 0, 0, fmt.Errorf("ffprobe failed: %w, output: %s", err, string(output))
	}

	// Parse output
	lines := strings.Split(string(output), "\n")
	for _, line := range lines {
		if strings.HasPrefix(line, "duration=") {
			durationStr := strings.TrimPrefix(line, "duration=")
			duration, err = strconv.ParseFloat(durationStr, 64)
			if err != nil {
				return 0, 0, 0, fmt.Errorf("failed to parse duration: %w", err)
			}
		} else if strings.HasPrefix(line, "width=") {
			widthStr := strings.TrimPrefix(line, "width=")
			width, err = strconv.Atoi(widthStr)
			if err != nil {
				log.Printf("Warning: failed to parse width: %v", err)
			}
		} else if strings.HasPrefix(line, "height=") {
			heightStr := strings.TrimPrefix(line, "height=")
			height, err = strconv.Atoi(heightStr)
			if err != nil {
				log.Printf("Warning: failed to parse height: %v", err)
			}
		}
	}

	if duration == 0 {
		return 0, 0, 0, fmt.Errorf("could not extract duration from video")
	}

	return duration, width, height, nil
}

// generateThumbnail extracts a frame from video at specified timestamp
// Optimized for fast extraction, good quality, and small file size
func generateThumbnail(videoPath string, timestamp float64) (string, error) {
	// Create temp file for thumbnail
	tempFile, err := os.CreateTemp("", "thumbnail-*.jpg")
	if err != nil {
		return "", err
	}
	tempFile.Close()
	thumbnailPath := tempFile.Name()

	// Use ffmpeg to extract frame with optimizations:
	// - Scale to max width 960px (maintains aspect ratio, good for thumbnails)
	// - q:v 5 provides good quality with smaller file size (2-10 scale, 5 is balanced)
	// - Fast decode with limited frame seeking
	cmd := exec.Command("ffmpeg",
		"-ss", fmt.Sprintf("%.2f", timestamp), // Seek to timestamp (before input for faster seeking)
		"-i", videoPath,
		"-vf", "scale='min(960,iw)':-1", // Scale to max 960px width, maintain aspect ratio
		"-vframes", "1",                 // Extract single frame
		"-q:v", "5",                     // Balanced quality (smaller file, still good quality)
		"-y",                            // Overwrite output file
		thumbnailPath,
	)

	output, err := cmd.CombinedOutput()
	if err != nil {
		os.Remove(thumbnailPath)
		return "", fmt.Errorf("ffmpeg failed: %w, output: %s", err, string(output))
	}

	return thumbnailPath, nil
}

// extractVideoDurationFromURL extracts video metadata directly from HTTP URL without downloading
// MUCH FASTER than downloading entire video first!
func extractVideoDurationFromURL(videoURL string) (float64, int, int, error) {
	cmd := exec.Command("ffprobe",
		"-v", "error",
		"-select_streams", "v:0",
		"-show_entries", "stream=duration,width,height",
		"-of", "csv=p=0",
		videoURL, // ffprobe reads directly from URL!
	)

	output, err := cmd.CombinedOutput()
	if err != nil {
		return 0, 0, 0, fmt.Errorf("ffprobe failed: %w, output: %s", err, string(output))
	}

	parts := strings.Split(strings.TrimSpace(string(output)), ",")
	if len(parts) < 3 {
		return 0, 0, 0, fmt.Errorf("unexpected ffprobe output format: %s", string(output))
	}

	width, err := strconv.Atoi(parts[0])
	if err != nil {
		return 0, 0, 0, fmt.Errorf("failed to parse width: %w", err)
	}

	height, err := strconv.Atoi(parts[1])
	if err != nil {
		return 0, 0, 0, fmt.Errorf("failed to parse height: %w", err)
	}

	duration, err := strconv.ParseFloat(parts[2], 64)
	if err != nil {
		return 0, 0, 0, fmt.Errorf("failed to parse duration: %w", err)
	}

	return duration, width, height, nil
}

// generateThumbnailFromURL creates thumbnail directly from HTTP URL without downloading entire video
// MUCH FASTER - only reads the portion needed for thumbnail!
func generateThumbnailFromURL(videoURL string, timestamp float64) (string, error) {
	tempFile, err := os.CreateTemp("", "thumbnail-*.jpg")
	if err != nil {
		return "", err
	}
	tempFile.Close()
	thumbnailPath := tempFile.Name()

	// ffmpeg reads directly from URL - only downloads what it needs!
	cmd := exec.Command("ffmpeg",
		"-ss", fmt.Sprintf("%.2f", timestamp), // Seek before input for speed
		"-i", videoURL,                        // Read directly from URL!
		"-vf", "scale='min(960,iw)':-1",
		"-vframes", "1",
		"-q:v", "5",
		"-y",
		thumbnailPath,
	)

	output, err := cmd.CombinedOutput()
	if err != nil {
		os.Remove(thumbnailPath)
		return "", fmt.Errorf("ffmpeg failed: %w, output: %s", err, string(output))
	}

	return thumbnailPath, nil
}

// uploadThumbnailToGCS uploads thumbnail to Google Cloud Storage
func uploadThumbnailToGCS(thumbnailPath string, workspaceID string) (string, error) {
	ctx := context.Background()

	// Get bucket name from environment
	bucketName := os.Getenv("GCS_BUCKET_NAME")
	if bucketName == "" {
		return "", fmt.Errorf("GCS_BUCKET_NAME not set")
	}

	// Initialize GCS client
	client, err := storage.NewClient(ctx, option.WithCredentialsFile(os.Getenv("GOOGLE_APPLICATION_CREDENTIALS")))
	if err != nil {
		return "", fmt.Errorf("failed to create GCS client: %w", err)
	}
	defer client.Close()

	// Generate unique object name
	timestamp := time.Now().Unix()
	objectName := fmt.Sprintf("thumbnails/%s/%d.jpg", workspaceID, timestamp)

	// Open thumbnail file
	file, err := os.Open(thumbnailPath)
	if err != nil {
		return "", err
	}
	defer file.Close()

	// Upload to GCS
	wc := client.Bucket(bucketName).Object(objectName).NewWriter(ctx)
	wc.ContentType = "image/jpeg"
	wc.CacheControl = "public, max-age=31536000" // Cache for 1 year

	if _, err := io.Copy(wc, file); err != nil {
		return "", fmt.Errorf("failed to copy to GCS: %w", err)
	}

	if err := wc.Close(); err != nil {
		return "", fmt.Errorf("failed to close GCS writer: %w", err)
	}

	// Return public URL
	thumbnailURL := fmt.Sprintf("https://storage.googleapis.com/%s/%s", bucketName, objectName)
	return thumbnailURL, nil
}

// ExtractDurationOnly extracts only the duration without generating thumbnail
func ExtractDurationOnly(videoURL string) (float64, error) {
	// Download video to temp file
	tempVideoPath, err := downloadVideoToTemp(videoURL)
	if err != nil {
		return 0, fmt.Errorf("failed to download video: %w", err)
	}
	defer os.Remove(tempVideoPath)

	// Extract duration using ffprobe
	duration, _, _, err := extractVideoDuration(tempVideoPath)
	if err != nil {
		return 0, fmt.Errorf("failed to extract duration: %w", err)
	}

	return duration, nil
}

// ExtractVideoMetadataWithOCI extracts duration and generates thumbnail for a video, uploading to OCI storage
// This is the preferred method when OCI storage provider is available
// OPTIMIZED: Uses ffmpeg to read directly from HTTP URL without downloading entire video
func ExtractVideoMetadataWithOCI(ctx context.Context, videoURL string, workspaceID string, storageProvider interface{}) (*VideoMetadata, error) {
	// Import storage interface locally to avoid circular dependencies
	type StorageUploader interface {
		Upload(ctx context.Context, filePath string, destinationPath string, contentType string) (string, error)
	}

	provider, ok := storageProvider.(StorageUploader)
	if !ok {
		return nil, fmt.Errorf("invalid storage provider type")
	}

	// Extract duration using ffprobe directly from URL (no download needed!)
	duration, width, height, err := extractVideoDurationFromURL(videoURL)
	if err != nil {
		return nil, fmt.Errorf("failed to extract duration: %w", err)
	}

	// Generate thumbnail at 25% mark directly from URL (much faster!)
	thumbnailPath, err := generateThumbnailFromURL(videoURL, duration*0.25)
	if err != nil {
		return nil, fmt.Errorf("failed to generate thumbnail: %w", err)
	}
	defer os.Remove(thumbnailPath)

	// Upload thumbnail to OCI storage
	timestamp := time.Now().Unix()
	thumbnailStoragePath := fmt.Sprintf("thumbnails/%s/%d.jpg", workspaceID, timestamp)

	thumbnailURL, err := provider.Upload(ctx, thumbnailPath, thumbnailStoragePath, "image/jpeg")
	if err != nil {
		return nil, fmt.Errorf("failed to upload thumbnail to OCI: %w", err)
	}

	return &VideoMetadata{
		Duration:     duration,
		ThumbnailURL: thumbnailURL,
		Width:        width,
		Height:       height,
	}, nil
}
