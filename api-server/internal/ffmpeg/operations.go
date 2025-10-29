// internal/ffmpeg/operations.go
package ffmpeg

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"math"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/ifeanyidike/cenphi/internal/storage"
	"go.uber.org/zap"
)

// Processor handles FFmpeg operations
type Processor struct {
	Logger          *zap.Logger
	TempDir         string
	OutputDir       string
	FFmpegPath      string
	FFprobePath     string
	storageProvider storage.Provider
	tempFiles       map[string]time.Time
	tempMutex       sync.Mutex
	cleanupInterval time.Duration
	cleanupAge      time.Duration
	stopCleanup     chan struct{}
}

// VideoInfo contains information about a video file
type VideoInfo struct {
	Duration    float64
	Width       int
	Height      int
	Bitrate     int64
	Format      string
	HasAudio    bool
	AudioCodec  string
	VideoCodec  string
	FrameRate   float64
	AspectRatio float64
	FileSize    int64
}

// AudioInfo contains information about an audio file
type AudioInfo struct {
	Duration   float64
	Bitrate    int64
	Format     string
	Channels   int
	SampleRate int
	FileSize   int64
	AudioCodec string
}

// SubtitleStyle defines the styling for subtitles
type SubtitleStyle struct {
	FontName     string
	FontSize     int
	PrimaryColor string
	OutlineColor string
	BackColor    string
	Bold         bool
	Italic       bool
	BorderStyle  int
	Outline      float64
	Shadow       float64
	Alignment    int
	MarginL      int
	MarginR      int
	MarginV      int
}

// ProcessingResult contains the result of an FFmpeg operation
type ProcessingResult struct {
	OutputPath     string
	OutputURL      string
	ThumbnailPath  string
	ThumbnailURL   string
	Width          int
	Height         int
	Duration       float64
	FileSize       int64
	Format         string
	ProcessingTime float64
	Command        string
	AppliedFilters []string
	AppliedOptions []string
}

// ProcessingRequest represents a request for media processing with upload
type ProcessingRequest struct {
	InputPath          string
	OutputFormat       string
	ProcessingCallback func(context.Context, string, string) (*ProcessingResult, error)
	ObjectPath         string
	ContentType        string
}

// NewProcessor creates a new FFmpeg processor
func NewProcessor(logger *zap.Logger, storageProvider storage.Provider) *Processor {
	tempDir := os.Getenv("TEMP_DIR")
	if tempDir == "" {
		tempDir = filepath.Join(os.TempDir(), "media_processing")
	}
	outputDir := os.Getenv("MEDIA_OUTPUT_DIR")
	if outputDir == "" {
		outputDir = filepath.Join(tempDir, "output")
	}

	// Create necessary directories
	os.MkdirAll(filepath.Join(tempDir, "downloads"), 0755)
	// os.MkdirAll(filepath.Join(outputDir, "videos"), 0755)
	// os.MkdirAll(filepath.Join(outputDir, "audio"), 0755)
	// os.MkdirAll(filepath.Join(outputDir, "images"), 0755)
	// os.MkdirAll(filepath.Join(outputDir, "thumbnails"), 0755)

	ffmpegPath, err := exec.LookPath("ffmpeg")
	if err != nil {
		logger.Warn("ffmpeg not found in PATH, using 'ffmpeg' directly", zap.Error(err))
		ffmpegPath = "ffmpeg"
	}

	ffprobePath, err := exec.LookPath("ffprobe")
	if err != nil {
		logger.Warn("ffprobe not found in PATH, using 'ffprobe' directly", zap.Error(err))
		ffprobePath = "ffprobe"
	}

	processor := &Processor{
		Logger:          logger,
		TempDir:         tempDir,
		OutputDir:       outputDir,
		FFmpegPath:      ffmpegPath,
		FFprobePath:     ffprobePath,
		storageProvider: storageProvider,
		tempFiles:       make(map[string]time.Time),
		cleanupInterval: 15 * time.Minute,
		cleanupAge:      30 * time.Minute,
		stopCleanup:     make(chan struct{}),
	}
	go processor.tempFileCleanupRoutine()

	return processor
}

// DownloadMedia downloads media from a URL, with improved error handling and retries
func (p *Processor) DownloadMedia(ctx context.Context, mediaURL string, maxRetries int) (string, error) {
	p.Logger.Info("Downloading media", zap.String("url", mediaURL))

	// Handle file:// URLs
	if strings.HasPrefix(mediaURL, "file://") {
		localPath := strings.TrimPrefix(mediaURL, "file://")
		if _, err := os.Stat(localPath); err != nil {
			return "", fmt.Errorf("file not found: %s", localPath)
		}
		return localPath, nil
	}

	mediaURL = strings.TrimSpace(mediaURL)

	// Generate a temp file for download
	ext := filepath.Ext(mediaURL)
	if ext == "" {
		ext = ".mp4" // Default extension
	}

	tempFile := filepath.Join(p.TempDir, "downloads", fmt.Sprintf("%s%s", uuid.New().String(), ext))

	// Create the output directory if it doesn't exist
	if err := os.MkdirAll(filepath.Dir(tempFile), 0755); err != nil {
		return "", fmt.Errorf("failed to create download directory: %v", err)
	}

	// Try various download methods
	var err error
	var downloadAttempted bool

	for retry := range maxRetries {
		if retry > 0 {
			p.Logger.Info("Retrying download", zap.String("url", mediaURL), zap.Int("attempt", retry+1))
			time.Sleep(time.Duration(retry) * 2 * time.Second) // Exponential backoff
		}

		// First try with HTTP
		downloadAttempted = true
		err = p.downloadWithHTTP(ctx, mediaURL, tempFile)
		if err == nil {
			break
		}

		// First try with curl
		downloadAttempted = true
		err = p.downloadWithCurl(ctx, mediaURL, tempFile)
		if err == nil {
			break
		}

		p.Logger.Warn("curl download failed, trying ffmpeg", zap.Error(err))

		// If curl fails, try with ffmpeg
		downloadAttempted = true
		err = p.downloadWithFFmpeg(ctx, mediaURL, tempFile)
		if err == nil {
			break
		}

		p.Logger.Warn("ffmpeg download failed", zap.Error(err))

		// If this is the last attempt, don't remove the file, in case it's partially downloaded
		if retry < maxRetries-1 {
			// Remove the potentially corrupted file
			os.Remove(tempFile)
		}
	}

	if !downloadAttempted || err != nil {
		return "", fmt.Errorf("all download methods failed: %v", err)
	}

	// Verify the file was downloaded
	fileInfo, err := os.Stat(tempFile)
	if err != nil {
		return "", fmt.Errorf("error verifying download: %v", err)
	}

	if fileInfo.Size() == 0 {
		return "", fmt.Errorf("downloaded file is empty")
	}

	p.Logger.Info("Download completed",
		zap.String("path", tempFile),
		zap.Int64("size", fileInfo.Size()))

	return tempFile, nil
}

// downloadWithCurl tries to download a file using curl
func (p *Processor) downloadWithCurl(ctx context.Context, mediaURL, tempFile string) error {
	// Use curl with timeouts, retries, and user agent
	cmd := exec.CommandContext(ctx, "curl",
		"--connect-timeout", "15",
		"--max-time", "300",
		"--retry", "3",
		"--retry-delay", "2",
		"--retry-max-time", "60",
		"-L",                                                                                                                        // Follow redirects
		"-A", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36", // User agent
		"-o", tempFile,
		mediaURL)

	output, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("curl download error: %v, output: %s", err, string(output))
	}
	return nil
}

// downloadWithHTTP

func (p *Processor) downloadWithHTTP(ctx context.Context, url, outPath string) error {
	client := &http.Client{
		Timeout: 5 * time.Minute,
		Transport: &http.Transport{
			MaxIdleConns:        10,
			IdleConnTimeout:     30 * time.Second,
			DisableCompression:  true,
			TLSHandshakeTimeout: 10 * time.Second,
		},
	}

	// Create request
	req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		return fmt.Errorf("error creating request: %v", err)
	}

	// Add headers to look like a browser
	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36")

	// Send request
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("http request failed: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("bad status: %s", resp.Status)
	}

	// Create output file
	out, err := os.Create(outPath)
	if err != nil {
		return fmt.Errorf("failed to create output file: %v", err)
	}
	defer out.Close()

	// Copy data to file
	_, err = io.Copy(out, resp.Body)
	if err != nil {
		return fmt.Errorf("download write error: %v", err)
	}

	return nil

}

// downloadWithFFmpeg tries to download a file using ffmpeg
func (p *Processor) downloadWithFFmpeg(ctx context.Context, mediaURL, tempFile string) error {
	// Use FFmpeg to download
	cmd := exec.CommandContext(ctx, p.FFmpegPath,
		"-y", // Overwrite output file
		"-reconnect", "1",
		"-reconnect_streamed", "1",
		"-reconnect_delay_max", "30",
		"-i", mediaURL,
		"-c", "copy", // Copy codecs without re-encoding
		tempFile)

	output, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("ffmpeg download error: %v, output: %s", err, string(output))
	}
	return nil
}

// GetVideoInfo gets information about a video file using ffprobe
func (p *Processor) GetVideoInfo(ctx context.Context, filePath string) (VideoInfo, error) {
	p.Logger.Info("Getting video info", zap.String("path", filePath))

	var info VideoInfo

	// Run ffprobe with timeout
	cmd := exec.CommandContext(ctx, p.FFprobePath,
		"-v", "quiet",
		"-print_format", "json",
		"-show_format",
		"-show_streams",
		filePath)

	output, err := cmd.Output()
	if err != nil {
		return info, fmt.Errorf("ffprobe error: %v", err)
	}

	// Parse the JSON output using Go's encoding/json
	var result map[string]any
	err = json.Unmarshal(output, &result)
	if err != nil {
		return info, fmt.Errorf("error parsing ffprobe output: %v", err)
	}

	// Extract format information
	if format, ok := result["format"].(map[string]any); ok {
		info.Format, _ = format["format_name"].(string)

		// Parse duration
		if durationStr, ok := format["duration"].(string); ok {
			info.Duration, _ = strconv.ParseFloat(durationStr, 64)
		}

		// Parse bitrate
		if bitrateStr, ok := format["bit_rate"].(string); ok {
			info.Bitrate, _ = strconv.ParseInt(bitrateStr, 10, 64)
		}

		// Parse file size
		if sizeStr, ok := format["size"].(string); ok {
			info.FileSize, _ = strconv.ParseInt(sizeStr, 10, 64)
		}
	}

	// Extract stream information
	if streams, ok := result["streams"].([]any); ok {
		for _, s := range streams {
			stream, ok := s.(map[string]any)
			if !ok {
				continue
			}

			codecType, _ := stream["codec_type"].(string)

			if codecType == "video" {
				// Get video stream info
				info.VideoCodec, _ = stream["codec_name"].(string)
				info.Width = int(stream["width"].(float64))
				info.Height = int(stream["height"].(float64))

				// Calculate aspect ratio
				if info.Height > 0 {
					info.AspectRatio = float64(info.Width) / float64(info.Height)
				}

				// Parse frame rate
				if r_frame_rate, ok := stream["r_frame_rate"].(string); ok {
					parts := strings.Split(r_frame_rate, "/")
					if len(parts) == 2 {
						num, _ := strconv.ParseInt(parts[0], 10, 64)
						den, _ := strconv.ParseInt(parts[1], 10, 64)
						if den > 0 {
							info.FrameRate = float64(num) / float64(den)
						}
					}
				}
			} else if codecType == "audio" {
				// Get audio stream info
				info.HasAudio = true
				info.AudioCodec, _ = stream["codec_name"].(string)
			}
		}
	}

	p.Logger.Info("Video info retrieved",
		zap.Int("width", info.Width),
		zap.Int("height", info.Height),
		zap.Float64("duration", info.Duration),
		zap.Int64("size", info.FileSize))

	return info, nil
}

// GetAudioInfo gets information about an audio file
func (p *Processor) GetAudioInfo(ctx context.Context, filePath string) (AudioInfo, error) {
	p.Logger.Info("Getting audio info", zap.String("path", filePath))

	var info AudioInfo

	// Run ffprobe with timeout
	cmd := exec.CommandContext(ctx, p.FFprobePath,
		"-v", "quiet",
		"-print_format", "json",
		"-show_format",
		"-show_streams",
		filePath)

	output, err := cmd.Output()
	if err != nil {
		return info, fmt.Errorf("ffprobe error: %v", err)
	}

	// Parse the JSON output
	var result map[string]any
	err = json.Unmarshal(output, &result)
	if err != nil {
		return info, fmt.Errorf("error parsing ffprobe output: %v", err)
	}

	// Extract format information
	if format, ok := result["format"].(map[string]interface{}); ok {
		info.Format, _ = format["format_name"].(string)

		// Parse duration
		if durationStr, ok := format["duration"].(string); ok {
			info.Duration, _ = strconv.ParseFloat(durationStr, 64)
		}

		// Parse bitrate
		if bitrateStr, ok := format["bit_rate"].(string); ok {
			info.Bitrate, _ = strconv.ParseInt(bitrateStr, 10, 64)
		}

		// Parse file size
		if sizeStr, ok := format["size"].(string); ok {
			info.FileSize, _ = strconv.ParseInt(sizeStr, 10, 64)
		}
	}

	// Extract audio stream information
	if streams, ok := result["streams"].([]interface{}); ok {
		for _, s := range streams {
			stream, ok := s.(map[string]interface{})
			if !ok {
				continue
			}

			codecType, _ := stream["codec_type"].(string)

			if codecType == "audio" {
				info.AudioCodec, _ = stream["codec_name"].(string)

				// Get audio-specific info
				if channels, ok := stream["channels"].(float64); ok {
					info.Channels = int(channels)
				}

				if sampleRate, ok := stream["sample_rate"].(string); ok {
					sr, _ := strconv.Atoi(sampleRate)
					info.SampleRate = sr
				}

				break // We only need one audio stream
			}
		}
	}

	p.Logger.Info("Audio info retrieved",
		zap.String("format", info.Format),
		zap.Float64("duration", info.Duration),
		zap.Int("channels", info.Channels),
		zap.Int("sample_rate", info.SampleRate))

	return info, nil
}

// GenerateThumbnail generates a thumbnail from a video
func (p *Processor) GenerateThumbnail(ctx context.Context, videoPath string, timestamp float64, width int) (string, error) {
	p.Logger.Info("Generating thumbnail",
		zap.String("video", videoPath),
		zap.Float64("timestamp", timestamp))

	// Create output filename
	thumbnailID := uuid.New().String()[:8]
	thumbnailPath := filepath.Join(p.OutputDir, "thumbnails", fmt.Sprintf("thumbnail_%s.jpg", thumbnailID))

	// Create output directory if needed
	if err := os.MkdirAll(filepath.Dir(thumbnailPath), 0755); err != nil {
		return "", fmt.Errorf("failed to create thumbnail directory: %v", err)
	}

	// Default values
	if width <= 0 {
		width = 640
	}

	if timestamp <= 0 {
		// Get video info to determine a good timestamp
		info, err := p.GetVideoInfo(ctx, videoPath)
		if err != nil {
			return "", fmt.Errorf("error getting video info: %v", err)
		}

		// Use 1/3 of duration or 3 seconds, whichever is less
		timestamp = math.Min(info.Duration/3, 3.0)
	}

	// Format timestamp
	timestampStr := formatTimestamp(timestamp)

	// Run FFmpeg to extract frame
	cmd := exec.CommandContext(ctx, p.FFmpegPath,
		"-y",
		"-ss", timestampStr,
		"-i", videoPath,
		"-vframes", "1",
		// "-vf", fmt.Sprintf("scale=%d:-1", width),
		"-vf", fmt.Sprintf("scale=%d:-1:flags=lanczos", width),
		"-q:v", "1", // Quality level (1-31, 1 is best)
		"-pix_fmt", "yuv420p",
		thumbnailPath)

	output, err := cmd.CombinedOutput()
	if err != nil {
		return "", fmt.Errorf("thumbnail generation error: %v, output: %s", err, string(output))
	}

	p.Logger.Info("Thumbnail generated", zap.String("path", thumbnailPath))
	return thumbnailPath, nil
}

// ResizeVideo resizes a video to target width and height
func (p *Processor) ResizeVideo(ctx context.Context, inputPath string, width int, height int,
	keepAspectRatio bool, outputFormat string) (*ProcessingResult, error) {
	p.Logger.Info("Resizing video",
		zap.String("input", inputPath),
		zap.Int("width", width),
		zap.Int("height", height),
		zap.Bool("keepAspect", keepAspectRatio))

	startTime := time.Now()

	// Create unique output filename
	outputID := uuid.New().String()[:8]

	if outputFormat == "" {
		outputFormat = "mp4"
	}

	baseName := fmt.Sprintf("resize_%dx%d_%s", width, height, outputID)
	outputPath := filepath.Join(p.OutputDir, "videos", fmt.Sprintf("%s.%s", baseName, outputFormat))

	// Create output directory if needed
	if err := os.MkdirAll(filepath.Dir(outputPath), 0755); err != nil {
		return nil, fmt.Errorf("failed to create output directory: %v", err)
	}

	// Build filter based on aspect ratio preference
	var scaleFilter string
	if keepAspectRatio {
		scaleFilter = fmt.Sprintf("scale=%d:%d:force_original_aspect_ratio=decrease,pad=%d:%d:(ow-iw)/2:(oh-ih)/2",
			width, height, width, height)
	} else {
		scaleFilter = fmt.Sprintf("scale=%d:%d", width, height)
	}

	// Build FFmpeg command
	args := []string{
		"-y",
		"-i", inputPath,
		"-vf", scaleFilter,
		"-c:v", "libx264",
		"-preset", "medium",
		"-crf", "23", // Quality level (lower is better)
		"-c:a", "aac",
		"-b:a", "128k",
		outputPath,
	}

	// Run FFmpeg
	cmd := exec.CommandContext(ctx, p.FFmpegPath, args...)
	output, err := cmd.CombinedOutput()

	if err != nil {
		return nil, fmt.Errorf("subtitle addition error: %v, output: %s", err, string(output))
	}

	// Get info about the output file
	info, err := p.GetVideoInfo(ctx, outputPath)
	if err != nil {
		p.Logger.Warn("Failed to get subtitled video info", zap.Error(err))
	}

	// Generate thumbnail
	thumbnailPath, err := p.GenerateThumbnail(ctx, outputPath, 1.0, 0)
	if err != nil {
		p.Logger.Warn("Failed to generate thumbnail", zap.Error(err))
	}

	// Create result
	result := &ProcessingResult{
		OutputPath:     outputPath,
		OutputURL:      pathToURL(outputPath),
		ThumbnailPath:  thumbnailPath,
		ThumbnailURL:   pathToURL(thumbnailPath),
		Width:          info.Width,
		Height:         info.Height,
		Duration:       info.Duration,
		FileSize:       info.FileSize,
		Format:         info.Format,
		ProcessingTime: time.Since(startTime).Seconds(),
		Command:        strings.Join(append([]string{p.FFmpegPath}, args...), " "),
		AppliedFilters: []string{},
	}

	p.Logger.Info("Subtitles added successfully",
		zap.String("output", outputPath),
		zap.Float64("processingTime", result.ProcessingTime))

	return result, nil
}

// ColorCorrectVideo applies color correction to a video
func (p *Processor) ColorCorrectVideo(ctx context.Context, inputPath string,
	brightness float64, contrast float64, saturation float64,
	outputFormat string) (*ProcessingResult, error) {
	p.Logger.Info("Applying color correction",
		zap.String("input", inputPath),
		zap.Float64("brightness", brightness),
		zap.Float64("contrast", contrast),
		zap.Float64("saturation", saturation))

	startTime := time.Now()

	// Create unique output filename
	outputID := uuid.New().String()[:8]

	if outputFormat == "" {
		outputFormat = "mp4"
	}

	baseName := fmt.Sprintf("color_corrected_%s", outputID)
	outputPath := filepath.Join(p.OutputDir, "videos", fmt.Sprintf("%s.%s", baseName, outputFormat))

	// Create output directory if needed
	if err := os.MkdirAll(filepath.Dir(outputPath), 0755); err != nil {
		return nil, fmt.Errorf("failed to create output directory: %v", err)
	}

	// Build color correction filter
	// Default values if not specified
	if brightness == 0 {
		brightness = 1.0
	}
	if contrast == 0 {
		contrast = 1.0
	}
	if saturation == 0 {
		saturation = 1.0
	}

	colorFilter := fmt.Sprintf("eq=brightness=%.2f:contrast=%.2f:saturation=%.2f:gamma=1.0",
		math.Max(0.9, math.Min(1.1, brightness)), // Limit brightness range
		math.Max(0.9, math.Min(1.2, contrast)),   // Limit contrast range
		math.Max(0.9, math.Min(1.3, saturation))) // Limit saturation range

	// Build FFmpeg command
	args := []string{
		"-y",
		"-i", inputPath,
		"-vf", colorFilter,
		"-c:v", "libx264",
		"-preset", "medium",
		"-crf", "23",
		"-c:a", "copy",
		"-pix_fmt", "yuv420p",
		"-colorspace", "bt709",
		"-color_primaries", "bt709",
		"-color_trc", "bt709",
		outputPath,
	}

	// Run FFmpeg
	cmd := exec.CommandContext(ctx, p.FFmpegPath, args...)
	output, err := cmd.CombinedOutput()

	if err != nil {
		return nil, fmt.Errorf("color correction error: %v, output: %s", err, string(output))
	}

	// Get info about the output file
	info, err := p.GetVideoInfo(ctx, outputPath)
	if err != nil {
		p.Logger.Warn("Failed to get color corrected video info", zap.Error(err))
	}

	// Generate thumbnail
	thumbnailPath, err := p.GenerateThumbnail(ctx, outputPath, 1.0, 0)
	if err != nil {
		p.Logger.Warn("Failed to generate thumbnail", zap.Error(err))
	}

	// Create result
	result := &ProcessingResult{
		OutputPath:     outputPath,
		OutputURL:      pathToURL(outputPath),
		ThumbnailPath:  thumbnailPath,
		ThumbnailURL:   pathToURL(thumbnailPath),
		Width:          info.Width,
		Height:         info.Height,
		Duration:       info.Duration,
		FileSize:       info.FileSize,
		Format:         info.Format,
		ProcessingTime: time.Since(startTime).Seconds(),
		Command:        strings.Join(append([]string{p.FFmpegPath}, args...), " "),
		AppliedFilters: []string{colorFilter},
	}

	p.Logger.Info("Color correction applied successfully",
		zap.String("output", outputPath),
		zap.Float64("processingTime", result.ProcessingTime))

	return result, nil
}

// StabilizeVideo applies video stabilization
func (p *Processor) StabilizeVideo(ctx context.Context, inputPath string, outputFormat string) (*ProcessingResult, error) {
	p.Logger.Info("Stabilizing video", zap.String("input", inputPath))

	startTime := time.Now()

	// Create unique output filename
	outputID := uuid.New().String()[:8]

	if outputFormat == "" {
		outputFormat = "mp4"
	}

	baseName := fmt.Sprintf("stabilized_%s", outputID)
	outputPath := filepath.Join(p.OutputDir, "videos", fmt.Sprintf("%s.%s", baseName, outputFormat))

	// Also need a temporary file for the first pass
	tempFile := filepath.Join(p.TempDir, fmt.Sprintf("transforms_%s.trf", outputID))

	// Create output directory if needed
	if err := os.MkdirAll(filepath.Dir(outputPath), 0755); err != nil {
		return nil, fmt.Errorf("failed to create output directory: %v", err)
	}

	// First pass - detect transforms
	detectArgs := []string{
		"-i", inputPath,
		"-vf", "vidstabdetect=shakiness=10:accuracy=15:result=" + tempFile,
		"-f", "null",
		"-",
	}

	// Run first pass
	detectCmd := exec.CommandContext(ctx, p.FFmpegPath, detectArgs...)
	detectOutput, err := detectCmd.CombinedOutput()

	if err != nil {
		return nil, fmt.Errorf("stabilization detection error: %v, output: %s", err, string(detectOutput))
	}

	// Second pass - apply transforms
	stabilizeArgs := []string{
		"-y",
		"-i", inputPath,
		"-vf", "vidstabtransform=input=" + tempFile + ":zoom=1:smoothing=30,unsharp=5:5:0.8:3:3:0.4",
		"-c:v", "libx264",
		"-preset", "medium",
		"-crf", "23",
		"-c:a", "copy",
		outputPath,
	}

	// Run second pass
	stabilizeCmd := exec.CommandContext(ctx, p.FFmpegPath, stabilizeArgs...)
	stabilizeOutput, err := stabilizeCmd.CombinedOutput()

	if err != nil {
		return nil, fmt.Errorf("stabilization transform error: %v, output: %s", err, string(stabilizeOutput))
	}

	// Clean up temp file
	os.Remove(tempFile)

	// Get info about the output file
	info, err := p.GetVideoInfo(ctx, outputPath)
	if err != nil {
		p.Logger.Warn("Failed to get stabilized video info", zap.Error(err))
	}

	// Generate thumbnail
	thumbnailPath, err := p.GenerateThumbnail(ctx, outputPath, 1.0, 0)
	if err != nil {
		p.Logger.Warn("Failed to generate thumbnail", zap.Error(err))
	}

	// Create result
	result := &ProcessingResult{
		OutputPath:     outputPath,
		OutputURL:      pathToURL(outputPath),
		ThumbnailPath:  thumbnailPath,
		ThumbnailURL:   pathToURL(thumbnailPath),
		Width:          info.Width,
		Height:         info.Height,
		Duration:       info.Duration,
		FileSize:       info.FileSize,
		Format:         info.Format,
		ProcessingTime: time.Since(startTime).Seconds(),
		Command:        strings.Join(append([]string{p.FFmpegPath}, stabilizeArgs...), " "),
		AppliedFilters: []string{"vidstabtransform", "unsharp"},
	}

	p.Logger.Info("Video stabilization completed",
		zap.String("output", outputPath),
		zap.Float64("processingTime", result.ProcessingTime))

	return result, nil
}

// ChangeVideoSpeed changes the playback speed of a video
func (p *Processor) ChangeVideoSpeed(ctx context.Context, inputPath string, speedFactor float64,
	preserveAudioPitch bool, outputFormat string) (*ProcessingResult, error) {
	p.Logger.Info("Changing video speed",
		zap.String("input", inputPath),
		zap.Float64("speedFactor", speedFactor),
		zap.Bool("preserveAudioPitch", preserveAudioPitch))

	// Validate speed factor
	if speedFactor <= 0 {
		return nil, fmt.Errorf("speed factor must be greater than 0")
	}

	startTime := time.Now()

	// Create unique output filename
	outputID := uuid.New().String()[:8]

	if outputFormat == "" {
		outputFormat = "mp4"
	}

	baseName := fmt.Sprintf("speed_%.2fx_%s", speedFactor, outputID)
	outputPath := filepath.Join(p.OutputDir, "videos", fmt.Sprintf("%s.%s", baseName, outputFormat))

	// Create output directory if needed
	if err := os.MkdirAll(filepath.Dir(outputPath), 0755); err != nil {
		return nil, fmt.Errorf("failed to create output directory: %v", err)
	}

	args := []string{
		"-y",
		"-i", inputPath,
	}

	// Video speed filter
	videoFilter := fmt.Sprintf("setpts=%.4f*PTS", 1/speedFactor)

	// Audio speed filter based on whether to preserve pitch
	audioFilter := ""
	if preserveAudioPitch {
		// Audio tempo filter (works between 0.5x and 2.0x)
		if speedFactor >= 0.5 && speedFactor <= 2.0 {
			audioFilter = fmt.Sprintf("atempo=%.4f", speedFactor)
		} else if speedFactor > 2.0 {
			// For faster speeds, chain multiple atempo filters (each limited to 2.0x)
			audioFilter = "atempo=2.0"
			remainingFactor := speedFactor / 2.0
			if remainingFactor > 1.0 {
				audioFilter += fmt.Sprintf(",atempo=%.4f", remainingFactor)
			}
		} else {
			// For slower speeds (< 0.5x)
			audioFilter = "atempo=0.5"
			remainingFactor := speedFactor / 0.5
			if remainingFactor < 1.0 {
				audioFilter += fmt.Sprintf(",atempo=%.4f", remainingFactor)
			}
		}
	} else {
		// Simple audio speed change without pitch preservation
		audioFilter = fmt.Sprintf("asetrate=44100*%.4f", speedFactor)
	}

	// Add filters to args
	args = append(args,
		"-filter_complex", fmt.Sprintf("[0:v]%s[v];[0:a]%s[a]", videoFilter, audioFilter),
		"-map", "[v]",
		"-map", "[a]",
		"-c:v", "libx264",
		"-preset", "medium",
		"-crf", "23",
		"-c:a", "aac",
		"-b:a", "128k",
		outputPath)

	// Run FFmpeg
	cmd := exec.CommandContext(ctx, p.FFmpegPath, args...)
	output, err := cmd.CombinedOutput()

	if err != nil {
		return nil, fmt.Errorf("speed change error: %v, output: %s", err, string(output))
	}

	// Get info about the output file
	info, err := p.GetVideoInfo(ctx, outputPath)
	if err != nil {
		p.Logger.Warn("Failed to get speed-changed video info", zap.Error(err))
	}

	// Generate thumbnail
	thumbnailPath, err := p.GenerateThumbnail(ctx, outputPath, 1.0, 0)
	if err != nil {
		p.Logger.Warn("Failed to generate thumbnail", zap.Error(err))
	}

	// Create result
	result := &ProcessingResult{
		OutputPath:     outputPath,
		OutputURL:      pathToURL(outputPath),
		ThumbnailPath:  thumbnailPath,
		ThumbnailURL:   pathToURL(thumbnailPath),
		Width:          info.Width,
		Height:         info.Height,
		Duration:       info.Duration,
		FileSize:       info.FileSize,
		Format:         info.Format,
		ProcessingTime: time.Since(startTime).Seconds(),
		Command:        strings.Join(append([]string{p.FFmpegPath}, args...), " "),
		AppliedFilters: []string{videoFilter},
		AppliedOptions: []string{fmt.Sprintf("speed=%.2fx", speedFactor)},
	}

	p.Logger.Info("Video speed changed successfully",
		zap.String("output", outputPath),
		zap.Float64("processingTime", result.ProcessingTime))

	return result, nil
}

// ExtractAudio extracts the audio track from a video
func (p *Processor) ExtractAudio(ctx context.Context, inputPath string, audioFormat string,
	audioBitrate string) (*ProcessingResult, error) {
	p.Logger.Info("Extracting audio",
		zap.String("input", inputPath),
		zap.String("format", audioFormat),
		zap.String("bitrate", audioBitrate))

	startTime := time.Now()

	// Create unique output filename
	outputID := uuid.New().String()[:8]

	if audioFormat == "" {
		audioFormat = "mp3"
	}

	if audioBitrate == "" {
		audioBitrate = "192k"
	}

	baseName := fmt.Sprintf("audio_%s", outputID)
	outputPath := filepath.Join(p.OutputDir, "audio", fmt.Sprintf("%s.%s", baseName, audioFormat))

	// Create output directory if needed
	if err := os.MkdirAll(filepath.Dir(outputPath), 0755); err != nil {
		return nil, fmt.Errorf("failed to create output directory: %v", err)
	}

	// Build FFmpeg command based on desired format
	args := []string{
		"-y",
		"-i", inputPath,
		"-vn", // No video
	}

	// Add format-specific options
	switch audioFormat {
	case "mp3":
		args = append(args,
			"-c:a", "libmp3lame",
			"-b:a", audioBitrate,
			"-ar", "44100", // 44.1kHz sample rate
		)
	case "aac", "m4a":
		args = append(args,
			"-c:a", "aac",
			"-b:a", audioBitrate,
			"-ar", "44100",
		)
	case "ogg":
		args = append(args,
			"-c:a", "libvorbis",
			"-b:a", audioBitrate,
			"-ar", "44100",
		)
	case "flac":
		args = append(args,
			"-c:a", "flac",
			"-ar", "44100",
		)
	case "wav":
		args = append(args,
			"-c:a", "pcm_s16le",
			"-ar", "44100",
		)
	default:
		// Default to MP3
		args = append(args,
			"-c:a", "libmp3lame",
			"-b:a", audioBitrate,
			"-ar", "44100",
		)
	}

	args = append(args, outputPath)

	// Run FFmpeg
	cmd := exec.CommandContext(ctx, p.FFmpegPath, args...)
	output, err := cmd.CombinedOutput()

	if err != nil {
		return nil, fmt.Errorf("audio extraction error: %v, output: %s", err, string(output))
	}

	// Get audio info if possible
	audioInfo, err := p.GetAudioInfo(ctx, outputPath)
	if err != nil {
		p.Logger.Warn("Failed to get extracted audio info", zap.Error(err))
	}

	// Create result
	result := &ProcessingResult{
		OutputPath:     outputPath,
		OutputURL:      pathToURL(outputPath),
		Duration:       audioInfo.Duration,
		FileSize:       audioInfo.FileSize,
		Format:         audioInfo.Format,
		ProcessingTime: time.Since(startTime).Seconds(),
		Command:        strings.Join(append([]string{p.FFmpegPath}, args...), " "),
		AppliedOptions: []string{
			"format=" + audioFormat,
			"bitrate=" + audioBitrate,
		},
	}

	p.Logger.Info("Audio extracted successfully",
		zap.String("output", outputPath),
		zap.Float64("processingTime", result.ProcessingTime))

	return result, nil
}

// OptimizeForSocialMedia optimizes a video for social media platforms
func (p *Processor) OptimizeForSocialMedia(ctx context.Context, inputPath string,
	platform string, customOptions map[string]string) (*ProcessingResult, error) {
	p.Logger.Info("Optimizing for social media",
		zap.String("input", inputPath),
		zap.String("platform", platform))

	startTime := time.Now()

	// Normalize platform name
	platform = strings.ToLower(platform)

	// Get video info
	info, err := p.GetVideoInfo(ctx, inputPath)
	if err != nil {
		return nil, fmt.Errorf("error getting video info: %v", err)
	}

	// Default options by platform
	var width, height int
	var maxDuration float64
	var maxFileSize int64
	var videoBitrate, audioBitrate string
	var aspectRatio float64
	var applyColorCorrection bool
	var saturation, contrast, brightness float64
	var colorMode string = "none"

	switch platform {
	case "instagram":
		// Instagram defaults for Reels/Stories
		width = 1080
		height = 1920
		aspectRatio = 9.0 / 16.0
		maxDuration = 90.0              // 90 seconds for Reels
		maxFileSize = 100 * 1024 * 1024 // 100 MB
		videoBitrate = "3500k"
		audioBitrate = "128k"
		applyColorCorrection = false // Changed to false by default
		saturation = 1.0
		contrast = 1.0
		brightness = 1.0
	case "tiktok":
		// TikTok defaults
		width = 1080
		height = 1920
		aspectRatio = 9.0 / 16.0
		maxDuration = 180.0             // 3 minutes
		maxFileSize = 287 * 1024 * 1024 // 287 MB
		videoBitrate = "3000k"
		audioBitrate = "128k"
		applyColorCorrection = false
		saturation = 1.0
		contrast = 1.0
		brightness = 1.0
	case "facebook":
		// Facebook defaults
		width = 1920
		height = 1080
		aspectRatio = 16.0 / 9.0
		maxDuration = 4 * 60 * 60        // 4 hours
		maxFileSize = 4000 * 1024 * 1024 // 4 GB
		videoBitrate = "4000k"
		audioBitrate = "128k"
		applyColorCorrection = false
	case "twitter", "x":
		// Twitter defaults
		width = 1280
		height = 720
		aspectRatio = 16.0 / 9.0
		maxDuration = 140.0             // 2:20
		maxFileSize = 512 * 1024 * 1024 // 512 MB
		videoBitrate = "2500k"
		audioBitrate = "128k"
		applyColorCorrection = false
	case "linkedin":
		// LinkedIn defaults
		width = 1920
		height = 1080
		aspectRatio = 16.0 / 9.0
		maxDuration = 10 * 60           // 10 minutes
		maxFileSize = 200 * 1024 * 1024 // 200 MB
		videoBitrate = "5000k"
		audioBitrate = "192k"
		applyColorCorrection = false
	case "youtube":
		// YouTube defaults
		width = 1920
		height = 1080
		aspectRatio = 16.0 / 9.0
		maxDuration = 12 * 60 * 60         // 12 hours
		maxFileSize = 128000 * 1024 * 1024 // 128 GB
		videoBitrate = "8000k"
		audioBitrate = "192k"
		applyColorCorrection = false
	default:
		// Generic defaults
		width = 1280
		height = 720
		aspectRatio = 16.0 / 9.0
		maxDuration = 300.0             // 5 minutes
		maxFileSize = 100 * 1024 * 1024 // 100 MB
		videoBitrate = "3000k"
		audioBitrate = "128k"
		applyColorCorrection = false
	}

	// Override with custom options if provided
	if customOptions != nil {
		if w, exists := customOptions["width"]; exists {
			if val, err := strconv.Atoi(w); err == nil && val > 0 {
				width = val
			}
		}
		if h, exists := customOptions["height"]; exists {
			if val, err := strconv.Atoi(h); err == nil && val > 0 {
				height = val
			}
		}
		if d, exists := customOptions["maxDuration"]; exists {
			if val, err := strconv.ParseFloat(d, 64); err == nil && val > 0 {
				maxDuration = val
			}
		}
		if s, exists := customOptions["maxFileSize"]; exists {
			if val, err := strconv.ParseInt(s, 10, 64); err == nil && val > 0 {
				maxFileSize = val * 1024 * 1024 // Convert MB to bytes
			}
		}
		if vb, exists := customOptions["videoBitrate"]; exists {
			videoBitrate = vb
		}
		if ab, exists := customOptions["audioBitrate"]; exists {
			audioBitrate = ab
		}
		if mode, exists := customOptions["colorCorrectionMode"]; exists {
			colorMode = mode
		}
		// Allow overriding individual color parameters
		if sat, exists := customOptions["saturation"]; exists {
			if val, err := strconv.ParseFloat(sat, 64); err == nil {
				saturation = val
			}
		}
		if con, exists := customOptions["contrast"]; exists {
			if val, err := strconv.ParseFloat(con, 64); err == nil {
				contrast = val
			}
		}
		if bri, exists := customOptions["brightness"]; exists {
			if val, err := strconv.ParseFloat(bri, 64); err == nil {
				brightness = val
			}
		}
	}

	// Analyze video for color correction requirements
	needsColorCorrection := false
	if colorMode == "auto" {
		var err error
		needsColorCorrection, err = p.AnalyzeVideoColors(ctx, inputPath)
		if err != nil {
			p.Logger.Warn("Failed to analyze video colors", zap.Error(err))
		}
		applyColorCorrection = needsColorCorrection
	} else if colorMode == "subtle" {
		applyColorCorrection = true
		saturation = 1.02
		contrast = 1.01
		brightness = 1.0
	} else if colorMode == "instagram" {
		applyColorCorrection = true
		saturation = 1.1
		contrast = 1.05
		brightness = 1.0
	} else if colorMode == "none" {
		applyColorCorrection = false
	}

	// Create unique output filename
	outputID := uuid.New().String()[:8]
	baseName := fmt.Sprintf("%s_optimized_%s", platform, outputID)
	outputPath := filepath.Join(p.OutputDir, "videos", baseName+".mp4") // Always use MP4 for social media

	// Create output directory if needed
	if err := os.MkdirAll(filepath.Dir(outputPath), 0755); err != nil {
		return nil, fmt.Errorf("failed to create output directory: %v", err)
	}

	// Determine necessary optimizations and build filter chain
	filters := []string{}
	appliedOptimizations := []string{}

	// Check duration
	needsTrimming := false
	if info.Duration > maxDuration {
		needsTrimming = true
		appliedOptimizations = append(appliedOptimizations, fmt.Sprintf("trim_duration_%.1fs", maxDuration))
	}

	// Check aspect ratio and resize
	currentAspectRatio := float64(info.Width) / float64(info.Height)
	needsResizing := math.Abs(currentAspectRatio-aspectRatio) > 0.1 || info.Width != width || info.Height != height

	if needsResizing {
		if platform == "instagram" || platform == "tiktok" {
			// Special handling for vertical platforms
			if currentAspectRatio > 1.0 {
				// Convert horizontal to vertical
				// First, scale to fit the target height
				heightScale := fmt.Sprintf("scale=-1:%d", height)

				// Then crop to the target width (center crop)
				cropFilter := fmt.Sprintf("crop=%d:%d", width, height)

				filters = append(filters, heightScale, cropFilter)
			} else {
				// Already vertical or square, just scale and pad if needed
				scaleFilter := fmt.Sprintf("scale=%d:%d:force_original_aspect_ratio=decrease", width, height)
				padFilter := fmt.Sprintf("pad=%d:%d:(ow-iw)/2:(oh-ih)/2:black", width, height)
				filters = append(filters, scaleFilter, padFilter)
			}
		} else {
			// Standard resize with padding
			scaleFilter := fmt.Sprintf("scale=%d:%d:force_original_aspect_ratio=decrease", width, height)
			padFilter := fmt.Sprintf("pad=%d:%d:(ow-iw)/2:(oh-ih)/2:black", width, height)
			filters = append(filters, scaleFilter, padFilter)
		}
		appliedOptimizations = append(appliedOptimizations, fmt.Sprintf("resize_%dx%d", width, height))
	}
	fmt.Println("max file size", maxFileSize)
	// Add subtle sharpening for all platforms
	filters = append(filters, "unsharp=5:5:0.5:5:5:0.0")

	// Add color correction if needed
	if applyColorCorrection {
		if saturation != 1.0 || contrast != 1.0 || brightness != 1.0 {
			colorFilter := fmt.Sprintf("eq=saturation=%.2f:contrast=%.2f:brightness=%.2f",
				saturation, contrast, brightness)
			filters = append(filters, colorFilter)
			appliedOptimizations = append(appliedOptimizations, "color_correction")
		}
	}

	// Build FFmpeg command
	args := []string{
		"-y",
		"-i", inputPath,
	}

	// Add duration limit if needed
	if needsTrimming {
		args = append(args, "-t", fmt.Sprintf("%.2f", maxDuration))
	}

	// Add filter chain if there are filters
	if len(filters) > 0 {
		args = append(args, "-vf", strings.Join(filters, ","))
	}

	// Add encoding options with color space preservation
	args = append(args,
		"-c:v", "libx264",
		"-preset", "medium",
		"-profile:v", "high",
		"-level", "4.2",
		"-crf", "22",
		"-b:v", videoBitrate,
		"-maxrate", videoBitrate,
		"-bufsize", "8M",
		"-c:a", "aac",
		"-b:a", audioBitrate,
		"-ar", "44100",
		"-movflags", "+faststart",
		// Color space preservation
		"-pix_fmt", "yuv420p",
		"-colorspace", "bt709",
		"-color_primaries", "bt709",
		"-color_trc", "bt709",
	)

	// Add platform-specific encoding options
	switch platform {
	case "instagram":
		args = append(args,
			"-g", "30", // GOP size
			"-bf", "2", // B-frames
		)
	case "tiktok":
		args = append(args,
			"-g", "60",
			"-bf", "0",
		)
	}

	args = append(args, outputPath)

	// Run FFmpeg
	cmd := exec.CommandContext(ctx, p.FFmpegPath, args...)
	output, err := cmd.CombinedOutput()

	if err != nil {
		return nil, fmt.Errorf("social media optimization error: %v, output: %s", err, string(output))
	}

	// Generate thumbnail
	thumbnailPath, err := p.GenerateThumbnail(ctx, outputPath, 1.0, width/2)
	if err != nil {
		p.Logger.Warn("Failed to generate thumbnail", zap.Error(err))
	}

	// Get info about the output file
	outputInfo, err := p.GetVideoInfo(ctx, outputPath)
	if err != nil {
		p.Logger.Warn("Failed to get optimized video info", zap.Error(err))
		outputInfo = info // Use input info as fallback
	}

	// Create result
	result := &ProcessingResult{
		OutputPath:     outputPath,
		OutputURL:      pathToURL(outputPath),
		ThumbnailPath:  thumbnailPath,
		ThumbnailURL:   pathToURL(thumbnailPath),
		Width:          outputInfo.Width,
		Height:         outputInfo.Height,
		Duration:       outputInfo.Duration,
		FileSize:       outputInfo.FileSize,
		Format:         outputInfo.Format,
		ProcessingTime: time.Since(startTime).Seconds(),
		Command:        strings.Join(append([]string{p.FFmpegPath}, args...), " "),
		AppliedFilters: filters,
		AppliedOptions: appliedOptimizations,
	}

	p.Logger.Info("Video optimized for social media",
		zap.String("platform", platform),
		zap.String("output", outputPath),
		zap.Float64("processingTime", result.ProcessingTime))

	return result, nil
}

// AnalyzeVideoColors checks if a video needs color correction
func (p *Processor) AnalyzeVideoColors(ctx context.Context, videoPath string) (bool, error) {
	// Extract a frame for analysis
	tempFrame := filepath.Join(p.TempDir, fmt.Sprintf("frame_%s.jpg", uuid.New().String()[:8]))

	cmd := exec.CommandContext(ctx, p.FFmpegPath,
		"-i", videoPath,
		"-vf", "select='eq(n,30)'", // Get frame 30
		"-vframes", "1",
		tempFrame)

	if err := cmd.Run(); err != nil {
		return false, err
	}
	defer os.Remove(tempFrame)

	// Use ffprobe to get color information
	probeCmd := exec.CommandContext(ctx, p.FFprobePath,
		"-v", "quiet",
		"-print_format", "json",
		"-show_streams",
		videoPath)

	output, err := probeCmd.Output()
	if err != nil {
		return false, err
	}

	// Parse the output and check color properties
	var result struct {
		Streams []struct {
			ColorRange     string `json:"color_range"`
			ColorSpace     string `json:"color_space"`
			ColorTransfer  string `json:"color_transfer"`
			ColorPrimaries string `json:"color_primaries"`
		} `json:"streams"`
	}

	if err := json.Unmarshal(output, &result); err != nil {
		return false, err
	}

	// Analyze color properties
	for _, stream := range result.Streams {
		// If color range is limited or color space is not standard, we might need correction
		if stream.ColorRange == "tv" || stream.ColorSpace != "bt709" {
			return true, nil
		}
	}

	return false, nil
}

// Helper functions

// formatTimestamp formats a seconds value as HH:MM:SS.mmm for FFmpeg
func formatTimestamp(seconds float64) string {
	hours := int(seconds) / 3600
	minutes := (int(seconds) % 3600) / 60
	secs := seconds - float64(hours*3600) - float64(minutes*60)
	return fmt.Sprintf("%02d:%02d:%06.3f", hours, minutes, secs)
}

// escapePath escapes a file path for use in FFmpeg filters
func escapePath(path string) string {
	// Replace backslashes with forward slashes
	path = strings.ReplaceAll(path, "\\", "/")

	// Escape special characters
	path = strings.ReplaceAll(path, ":", "\\:")
	path = strings.ReplaceAll(path, "'", "\\'")

	return path
}

// pathToURL converts a file path to a URL
func pathToURL(path string) string {
	// In a real implementation, this would map to an accessible URL
	// For now, we just use a file:// URL
	return "file://" + path
}

// CropVideo crops a video to specified dimensions
func (p *Processor) CropVideo(ctx context.Context, inputPath string, x int, y int, width int, height int,
	outputFormat string) (*ProcessingResult, error) {
	p.Logger.Info("Cropping video",
		zap.String("input", inputPath),
		zap.Int("x", x),
		zap.Int("y", y),
		zap.Int("width", width),
		zap.Int("height", height))

	startTime := time.Now()

	// Create unique output filename
	outputID := uuid.New().String()[:8]

	if outputFormat == "" {
		outputFormat = "mp4"
	}

	baseName := fmt.Sprintf("crop_%dx%d_%s", width, height, outputID)
	outputPath := filepath.Join(p.OutputDir, "videos", fmt.Sprintf("%s.%s", baseName, outputFormat))

	// Create output directory if needed
	if err := os.MkdirAll(filepath.Dir(outputPath), 0755); err != nil {
		return nil, fmt.Errorf("failed to create output directory: %v", err)
	}

	// Build crop filter
	cropFilter := fmt.Sprintf("crop=%d:%d:%d:%d", width, height, x, y)

	// Build FFmpeg command
	args := []string{
		"-y",
		"-i", inputPath,
		"-vf", cropFilter,
		"-c:v", "libx264",
		"-preset", "medium",
		"-crf", "23",
		"-c:a", "aac",
		"-strict", "experimental",
		outputPath,
	}

	// Run FFmpeg
	cmd := exec.CommandContext(ctx, p.FFmpegPath, args...)
	output, err := cmd.CombinedOutput()

	if err != nil {
		return nil, fmt.Errorf("crop error: %v, output: %s", err, string(output))
	}

	// Get info about the output file
	info, err := p.GetVideoInfo(ctx, outputPath)
	if err != nil {
		p.Logger.Warn("Failed to get cropped video info", zap.Error(err))
	}

	// Generate thumbnail
	thumbnailPath, err := p.GenerateThumbnail(ctx, outputPath, 0, width/2)
	if err != nil {
		p.Logger.Warn("Failed to generate thumbnail", zap.Error(err))
	}

	// Create result
	result := &ProcessingResult{
		OutputPath:     outputPath,
		OutputURL:      pathToURL(outputPath),
		ThumbnailPath:  thumbnailPath,
		ThumbnailURL:   pathToURL(thumbnailPath),
		Width:          info.Width,
		Height:         info.Height,
		Duration:       info.Duration,
		FileSize:       info.FileSize,
		Format:         info.Format,
		ProcessingTime: time.Since(startTime).Seconds(),
		Command:        strings.Join(append([]string{p.FFmpegPath}, args...), " "),
		AppliedFilters: []string{cropFilter},
	}

	p.Logger.Info("Video cropped successfully",
		zap.String("output", outputPath),
		zap.Float64("processingTime", result.ProcessingTime))

	return result, nil
}

// TrimVideo trims a video to specified start and end times
func (p *Processor) TrimVideo(ctx context.Context, inputPath string, startTime float64, endTime float64,
	outputFormat string) (*ProcessingResult, error) {
	p.Logger.Info("Trimming video",
		zap.String("input", inputPath),
		zap.Float64("startTime", startTime),
		zap.Float64("endTime", endTime))

	procStartTime := time.Now()

	// Create unique output filename
	outputID := uuid.New().String()[:8]

	if outputFormat == "" {
		outputFormat = "mp4"
	}

	baseName := fmt.Sprintf("trim_%s_%s_%s",
		formatTimestamp(startTime),
		formatTimestamp(endTime),
		outputID)
	outputPath := filepath.Join(p.OutputDir, "videos", fmt.Sprintf("%s.%s", baseName, outputFormat))

	// Create output directory if needed
	if err := os.MkdirAll(filepath.Dir(outputPath), 0755); err != nil {
		return nil, fmt.Errorf("failed to create output directory: %v", err)
	}

	// Format timestamps
	startTimeStr := formatTimestamp(startTime)
	durationStr := formatTimestamp(endTime - startTime)

	// Build FFmpeg command
	args := []string{
		"-y",
		"-ss", startTimeStr,
		"-i", inputPath,
		"-t", durationStr,
		"-c:v", "libx264",
		"-preset", "medium",
		"-crf", "23",
		"-c:a", "aac",
		"-strict", "experimental",
		outputPath,
	}

	// Run FFmpeg
	cmd := exec.CommandContext(ctx, p.FFmpegPath, args...)
	output, err := cmd.CombinedOutput()

	if err != nil {
		return nil, fmt.Errorf("trim error: %v, output: %s", err, string(output))
	}

	// Get info about the output file
	info, err := p.GetVideoInfo(ctx, outputPath)
	if err != nil {
		p.Logger.Warn("Failed to get trimmed video info", zap.Error(err))
	}

	// Generate thumbnail
	thumbnailPath, err := p.GenerateThumbnail(ctx, outputPath, 1.0, 0)
	if err != nil {
		p.Logger.Warn("Failed to generate thumbnail", zap.Error(err))
	}

	// Create result
	result := &ProcessingResult{
		OutputPath:     outputPath,
		OutputURL:      pathToURL(outputPath),
		ThumbnailPath:  thumbnailPath,
		ThumbnailURL:   pathToURL(thumbnailPath),
		Width:          info.Width,
		Height:         info.Height,
		Duration:       info.Duration,
		FileSize:       info.FileSize,
		Format:         info.Format,
		ProcessingTime: time.Since(procStartTime).Seconds(),
		Command:        strings.Join(append([]string{p.FFmpegPath}, args...), " "),
		AppliedOptions: []string{
			"start=" + startTimeStr,
			"duration=" + durationStr,
		},
	}

	p.Logger.Info("Video trimmed successfully",
		zap.String("output", outputPath),
		zap.Float64("processingTime", result.ProcessingTime))

	return result, nil
}

func (p *Processor) GeneratePreview(ctx context.Context, videoPath string, width int) (*ProcessingResult, error) {
	previewPath := filepath.Join(p.OutputDir, "previews", fmt.Sprintf("preview_%s.mp4", uuid.New().String()[:8]))
	startTime := time.Now()
	// Create a low-res preview
	args := []string{
		"-y",
		"-i", videoPath,
		"-vf", fmt.Sprintf("scale=%d:-1", width/2),
		"-c:v", "libx264",
		"-preset", "ultrafast",
		"-crf", "28",
		"-an",     // No audio for preview
		"-t", "5", // First 5 seconds only
		previewPath,
	}

	cmd := exec.CommandContext(ctx, p.FFmpegPath, args...)

	output, err := cmd.CombinedOutput()

	if err != nil {
		return nil, fmt.Errorf("trim error: %v, output: %s", err, string(output))
	}
	// Get info about the output file
	info, err := p.GetVideoInfo(ctx, previewPath)
	if err != nil {
		p.Logger.Warn("Failed to get cropped video info", zap.Error(err))
	}

	// Generate thumbnail
	thumbnailPath, err := p.GenerateThumbnail(ctx, previewPath, 0, width/2)
	if err != nil {
		p.Logger.Warn("Failed to generate thumbnail", zap.Error(err))
	}

	// Create result
	result := &ProcessingResult{
		OutputPath:     previewPath,
		OutputURL:      pathToURL(previewPath),
		ThumbnailPath:  thumbnailPath,
		ThumbnailURL:   pathToURL(thumbnailPath),
		Width:          info.Width,
		Height:         info.Height,
		Duration:       info.Duration,
		FileSize:       info.FileSize,
		Format:         info.Format,
		ProcessingTime: time.Since(startTime).Seconds(),
		Command:        strings.Join(append([]string{p.FFmpegPath}, args...), " "),
	}

	p.Logger.Info("Video cropped successfully",
		zap.String("output", previewPath),
		zap.Float64("processingTime", result.ProcessingTime))

	return result, nil
}

// AddSubtitleToVideo adds a subtitle file to a video
func (p *Processor) AddSubtitleToVideo(ctx context.Context, videoPath string, subtitlePath string,
	style *SubtitleStyle, outputFormat string) (*ProcessingResult, error) {
	p.Logger.Info("Adding subtitles to video",
		zap.String("video", videoPath),
		zap.String("subtitle", subtitlePath))

	startTime := time.Now()

	// Create unique output filename
	outputID := uuid.New().String()[:8]

	if outputFormat == "" {
		outputFormat = "mp4"
	}

	baseName := fmt.Sprintf("subtitled_%s", outputID)
	outputPath := filepath.Join(p.OutputDir, "videos", fmt.Sprintf("%s.%s", baseName, outputFormat))

	// Create output directory if needed
	if err := os.MkdirAll(filepath.Dir(outputPath), 0755); err != nil {
		return nil, fmt.Errorf("failed to create output directory: %v", err)
	}

	// Build subtitle filter
	var subtitleFilter string

	// Get subtitle file extension
	subtitleExt := strings.ToLower(filepath.Ext(subtitlePath))

	// Determine filter based on subtitle format
	if subtitleExt == ".srt" {
		// For SRT files, use the subtitles filter
		fontName := "Arial"
		fontSize := 24
		primaryColor := "white"
		outlineColor := "black"
		outlineWidth := 2

		// Apply custom styling if provided
		if style != nil {
			if style.FontName != "" {
				fontName = style.FontName
			}
			if style.FontSize > 0 {
				fontSize = style.FontSize
			}
			if style.PrimaryColor != "" {
				primaryColor = style.PrimaryColor
			}
			if style.OutlineColor != "" {
				outlineColor = style.OutlineColor
			}
			if style.Outline > 0 {
				outlineWidth = int(style.Outline)
			}
		}

		subtitleFilter = fmt.Sprintf("subtitles=%s:force_style='FontName=%s,FontSize=%d,PrimaryColour=%s,OutlineColour=%s,BorderStyle=4,Outline=%d'",
			escapePath(subtitlePath), fontName, fontSize, primaryColor, outlineColor, outlineWidth)
	} else {
		// For other formats, use direct mapping
		subtitleFilter = fmt.Sprintf("subtitle=%s", escapePath(subtitlePath))
	}

	// Build FFmpeg command
	args := []string{
		"-y",
		"-i", videoPath,
		"-vf", subtitleFilter,
		"-c:v", "libx264",
		"-preset", "medium",
		"-crf", "23",
		"-c:a", "copy",
		outputPath,
	}

	// Run FFmpeg
	// Run FFmpeg
	cmd := exec.CommandContext(ctx, p.FFmpegPath, args...)
	output, err := cmd.CombinedOutput()

	if err != nil {
		return nil, fmt.Errorf("subtitle addition error: %v, output: %s", err, string(output))
	}

	// Get info about the output file
	info, err := p.GetVideoInfo(ctx, outputPath)
	if err != nil {
		p.Logger.Warn("Failed to get subtitled video info", zap.Error(err))
	}

	// Generate thumbnail
	thumbnailPath, err := p.GenerateThumbnail(ctx, outputPath, 1.0, 0)
	if err != nil {
		p.Logger.Warn("Failed to generate thumbnail", zap.Error(err))
	}

	// Create result
	result := &ProcessingResult{
		OutputPath:     outputPath,
		OutputURL:      pathToURL(outputPath),
		ThumbnailPath:  thumbnailPath,
		ThumbnailURL:   pathToURL(thumbnailPath),
		Width:          info.Width,
		Height:         info.Height,
		Duration:       info.Duration,
		FileSize:       info.FileSize,
		Format:         info.Format,
		ProcessingTime: time.Since(startTime).Seconds(),
		Command:        strings.Join(append([]string{p.FFmpegPath}, args...), " "),
		AppliedFilters: []string{subtitleFilter},
	}

	p.Logger.Info("Subtitles added successfully",
		zap.String("output", outputPath),
		zap.Float64("processingTime", result.ProcessingTime))

	return result, nil
}

// CleanupTempFiles removes temporary files after processing
func (p *Processor) CleanupTempFiles(filePaths ...string) {
	p.tempMutex.Lock()
	defer p.tempMutex.Unlock()

	for _, path := range filePaths {
		if path == "" {
			continue
		}

		// Skip if file doesn't exist
		if _, err := os.Stat(path); os.IsNotExist(err) {
			delete(p.tempFiles, path)
			continue
		}

		err := os.Remove(path)
		if err != nil {
			p.Logger.Warn("Failed to remove temporary file",
				zap.String("path", path),
				zap.Error(err))
		} else {
			p.Logger.Debug("Removed temporary file", zap.String("path", path))
			delete(p.tempFiles, path)
		}
	}
}

// CleanupOldTempFiles removes all temporary files older than maxAge
func (p *Processor) CleanupOldTempFiles(maxAge time.Duration) {
	// Directories to clean
	dirsToClean := []string{
		filepath.Join(p.TempDir, "downloads"),
		// Add other temp directories as needed
	}

	now := time.Now()

	for _, dir := range dirsToClean {
		entries, err := os.ReadDir(dir)
		if err != nil {
			p.Logger.Warn("Failed to read directory for cleanup",
				zap.String("dir", dir),
				zap.Error(err))
			continue
		}

		for _, entry := range entries {
			if entry.IsDir() {
				continue // Skip subdirectories
			}

			filePath := filepath.Join(dir, entry.Name())
			info, err := entry.Info()
			if err != nil {
				continue
			}

			// Check if file is older than maxAge
			if now.Sub(info.ModTime()) > maxAge {
				err := os.Remove(filePath)
				if err != nil {
					p.Logger.Warn("Failed to remove old temp file",
						zap.String("path", filePath),
						zap.Error(err))
				} else {
					p.Logger.Debug("Removed old temp file", zap.String("path", filePath))
				}
			}
		}
	}
}

// Stop gracefully shuts down the processor
func (p *Processor) Stop() {
	close(p.stopCleanup)
}

// tempFileCleanupRoutine periodically cleans up old temporary files
func (p *Processor) tempFileCleanupRoutine() {
	ticker := time.NewTicker(p.cleanupInterval)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			p.cleanupOldTempFiles()
		case <-p.stopCleanup:
			return
		}
	}
}

// TrackTempFile adds a file to the tracking list for later cleanup
func (p *Processor) TrackTempFile(filePath string) {
	p.tempMutex.Lock()
	defer p.tempMutex.Unlock()

	p.tempFiles[filePath] = time.Now()
	p.Logger.Debug("Added file to temp tracking", zap.String("path", filePath))
}

// cleanupOldTempFiles removes temporary files older than the specified age
func (p *Processor) cleanupOldTempFiles() {
	p.tempMutex.Lock()
	defer p.tempMutex.Unlock()

	now := time.Now()
	var filesToRemove []string

	// Find files older than the threshold
	for path, createdAt := range p.tempFiles {
		if now.Sub(createdAt) > p.cleanupAge {
			filesToRemove = append(filesToRemove, path)
		}
	}

	// Remove the files
	for _, path := range filesToRemove {
		err := os.Remove(path)
		if err != nil {
			if !os.IsNotExist(err) {
				p.Logger.Warn("Failed to remove temporary file",
					zap.String("path", path),
					zap.Error(err))
			}
		} else {
			p.Logger.Debug("Removed old temporary file", zap.String("path", path))
		}
		delete(p.tempFiles, path)
	}

	p.Logger.Info("Temporary file cleanup completed",
		zap.Int("removed", len(filesToRemove)),
		zap.Int("remaining", len(p.tempFiles)))
}

// DownloadMediaWithCleanup downloads media and tracks the downloaded file for cleanup
func (p *Processor) DownloadMediaWithCleanup(ctx context.Context, mediaURL string, maxRetries int) (string, error) {
	localPath, err := p.DownloadMedia(ctx, mediaURL, maxRetries)
	if err != nil {
		return "", err
	}

	// Track this file for cleanup
	p.TrackTempFile(localPath)

	return localPath, nil
}

// ProcessAndUpload processes a media file and uploads the result to cloud storage
func (p *Processor) ProcessAndUpload(ctx context.Context, req ProcessingRequest) (*ProcessingResult, error) {
	if p.storageProvider == nil {
		return nil, fmt.Errorf("storage provider not initialized")
	}

	// Create unique output filename if not provided
	outputID := uuid.New().String()[:8]
	outputFormat := req.OutputFormat
	if outputFormat == "" {
		outputFormat = "mp4" // Default format
	}

	baseName := fmt.Sprintf("%s_%s", filepath.Base(req.InputPath), outputID)
	outputPath := filepath.Join(p.OutputDir, "videos", fmt.Sprintf("%s.%s", baseName, outputFormat))

	// Ensure output directory exists
	if err := os.MkdirAll(filepath.Dir(outputPath), 0755); err != nil {
		return nil, fmt.Errorf("failed to create output directory: %w", err)
	}

	// Process the file
	result, err := req.ProcessingCallback(ctx, req.InputPath, outputFormat)
	if err != nil {
		return nil, err
	}

	// Track the output file for cleanup
	p.TrackTempFile(result.OutputPath)

	// Track thumbnail for cleanup if it exists
	if result.ThumbnailPath != "" {
		p.TrackTempFile(result.ThumbnailPath)
	}

	// Determine storage path
	storageBasePath := req.ObjectPath
	if storageBasePath == "" {
		// Generate a structured path based on date and file type
		now := time.Now()
		storageBasePath = fmt.Sprintf(
			"media/%d/%02d/%02d/%s",
			now.Year(),
			now.Month(),
			now.Day(),
			outputID,
		)
	}

	// Upload main output file
	contentType := req.ContentType
	if contentType == "" {
		contentType = guessContentTypeFromPath(result.OutputPath)
	}

	p.Logger.Info("Uploading processed file to storage",
		zap.String("local_path", result.OutputPath),
		zap.String("storage_path", storageBasePath))

	outputStoragePath := fmt.Sprintf("%s.%s", storageBasePath, outputFormat)
	publicURL, err := p.storageProvider.Upload(ctx, result.OutputPath, outputStoragePath, contentType)
	if err != nil {
		return nil, fmt.Errorf("failed to upload processed file: %w", err)
	}
	defer p.CleanupTempFiles(result.OutputPath)

	// Replace local path with public URL in result
	result.OutputURL = publicURL

	// Upload thumbnail if available
	if result.ThumbnailPath != "" {
		thumbnailStoragePath := fmt.Sprintf("%s_thumbnail.jpg", storageBasePath)
		thumbnailURL, err := p.storageProvider.Upload(ctx, result.ThumbnailPath, thumbnailStoragePath, "image/jpeg")
		defer p.CleanupTempFiles(result.ThumbnailPath)
		if err != nil {
			p.Logger.Warn("Failed to upload thumbnail", zap.Error(err))
		} else {
			result.ThumbnailURL = thumbnailURL
		}
	}

	p.Logger.Info("Media processing and upload completed",
		zap.String("output_url", result.OutputURL),
		zap.String("thumbnail_url", result.ThumbnailURL))

	return result, nil
}

// streamUpload uploads a file to storage in chunks with progress reporting
func (p *Processor) StreamUpload(ctx context.Context, filePath string, destinationPath string, contentType string) (string, error) {
	file, err := os.Open(filePath)
	if err != nil {
		return "", fmt.Errorf("failed to open file for upload: %w", err)
	}
	defer file.Close()

	fileInfo, err := file.Stat()
	if err != nil {
		return "", fmt.Errorf("failed to get file info: %w", err)
	}

	// For small files (< 50MB), use regular upload
	if fileInfo.Size() < 50*1024*1024 {
		return p.storageProvider.Upload(ctx, filePath, destinationPath, contentType)
	}

	// For larger files, use chunked upload with progress reporting
	return p.storageProvider.UploadChunked(ctx, filePath, destinationPath, contentType, 10*1024*1024)
}

// ExportToGIF exports a video or video segment to GIF format
func (p *Processor) ExportToGIF(ctx context.Context, inputPath string, startTime, duration float64,
	width int, fps int, quality string) (*ProcessingResult, error) {

	p.Logger.Info("Exporting video to GIF",
		zap.String("input", inputPath),
		zap.Float64("startTime", startTime),
		zap.Float64("duration", duration),
		zap.Int("width", width),
		zap.Int("fps", fps),
		zap.String("quality", quality),
	)

	procStartTime := time.Now()

	// Defaults
	if width <= 0 {
		width = 480
	}
	if fps <= 0 || fps > 30 {
		fps = 15
	}
	if duration <= 0 {
		duration = 5.0
	}

	// Quality presets -> palette/dither/max_colors
	paletteStats := "stats_mode=full"
	ditherMode := "bayer:bayer_scale=3"
	maxColors := 256
	switch strings.ToLower(quality) {
	case "high":
		paletteStats = "stats_mode=full"
		ditherMode = "bayer:bayer_scale=5"
		maxColors = 256
	case "medium":
		paletteStats = "stats_mode=full"
		ditherMode = "bayer:bayer_scale=3"
		maxColors = 128
	case "low":
		paletteStats = "stats_mode=diff"
		ditherMode = "sierra2_4a"
		maxColors = 64
	default:
		// keep defaults
	}

	// Prepare output and temp paths
	outputID := uuid.New().String()[:8]
	baseName := fmt.Sprintf("gif_export_%s", outputID)
	outputPath := filepath.Join(p.OutputDir, "gifs", baseName+".gif")

	if err := os.MkdirAll(filepath.Dir(outputPath), 0o755); err != nil {
		return nil, fmt.Errorf("failed to create output directory: %v", err)
	}
	if err := os.MkdirAll(p.TempDir, 0o755); err != nil {
		return nil, fmt.Errorf("failed to create temp dir: %v", err)
	}

	paletteFile := filepath.Join(p.TempDir, fmt.Sprintf("palette_%s.png", outputID))
	// best-effort cleanup
	defer func() { _ = os.Remove(paletteFile) }()

	// Build palette filter (FFmpeg 6.x supports stats_mode and max_colors)
	paletteFilter := fmt.Sprintf("fps=%d,scale=%d:-1:flags=lanczos,palettegen=%s:max_colors=%d",
		fps, width, paletteStats, maxColors)

	// Step 1: Generate palette
	paletteArgs := []string{"-y"}
	if startTime > 0 {
		// fast seek (approximate). For frame-accurate, move -ss AFTER -i.
		paletteArgs = append(paletteArgs, "-ss", formatTimestamp(startTime))
	}
	paletteArgs = append(paletteArgs,
		"-i", inputPath,
		"-t", fmt.Sprintf("%.2f", duration),
		"-vf", paletteFilter,
		// "-map", "0:v", // optional for clarity; palettegen will use video input
		paletteFile,
	)

	p.Logger.Debug("Running palette generation command", zap.Strings("args", paletteArgs))
	paletteCmd := exec.CommandContext(ctx, p.FFmpegPath, paletteArgs...)
	paletteOutput, err := paletteCmd.CombinedOutput()
	if err != nil {
		return nil, fmt.Errorf("palette generation error: %v, output: %s", err, string(paletteOutput))
	}

	// Validate palette file exists and is non-empty
	if fi, err := os.Stat(paletteFile); err != nil {
		return nil, fmt.Errorf("palette generation produced no file: %v", err)
	} else if fi.Size() == 0 {
		return nil, fmt.Errorf("palette file is empty")
	}

	// Step 2: Generate GIF using palette
	// Note: do NOT use -map here. Let filter_complex produce single GIF stream.
	gifFilter := fmt.Sprintf("fps=%d,scale=%d:-1:flags=lanczos[x];[x][1:v]paletteuse=dither=%s",
		fps, width, ditherMode)

	gifArgs := []string{"-y"}
	if startTime > 0 {
		// fast seek before input for speed (approximate). For frame-accurate, put -ss after -i.
		gifArgs = append(gifArgs, "-ss", formatTimestamp(startTime))
	}
	gifArgs = append(gifArgs,
		"-i", inputPath, // input 0: video
		"-i", paletteFile, // input 1: palette
		"-t", fmt.Sprintf("%.2f", duration),
		"-filter_complex", gifFilter,
		"-fps_mode", "passthrough", // avoid deprecated -vsync 0 warning
		"-loop", "0", // infinite loop
		outputPath,
	)

	p.Logger.Debug("Running GIF generation command", zap.Strings("args", gifArgs))
	gifCmd := exec.CommandContext(ctx, p.FFmpegPath, gifArgs...)
	gifOutput, err := gifCmd.CombinedOutput()
	if err != nil {
		// include ffmpeg output to help debugging
		return nil, fmt.Errorf("GIF generation error: %v, output: %s", err, string(gifOutput))
	}

	// Stat the output safely
	var fileSize int64
	if fi, err := os.Stat(outputPath); err == nil {
		fileSize = fi.Size()
	} else {
		p.Logger.Warn("Failed to stat GIF output", zap.Error(err))
		fileSize = 0
	}

	// Build combined command string for logging/debugging
	combinedCmd := fmt.Sprintf("%s %s && %s %s",
		p.FFmpegPath, strings.Join(paletteArgs, " "),
		p.FFmpegPath, strings.Join(gifArgs, " "),
	)

	result := &ProcessingResult{
		OutputPath:     outputPath,
		OutputURL:      pathToURL(outputPath),
		Width:          width,
		Duration:       duration,
		FileSize:       fileSize,
		Format:         "gif",
		ProcessingTime: time.Since(procStartTime).Seconds(),
		Command:        combinedCmd,
		AppliedFilters: []string{paletteFilter, gifFilter},
		AppliedOptions: []string{
			fmt.Sprintf("fps=%d", fps),
			fmt.Sprintf("width=%d", width),
			fmt.Sprintf("duration=%.1fs", duration),
			"quality=" + quality,
			fmt.Sprintf("max_colors=%d", maxColors),
			"dither=" + ditherMode,
		},
	}

	p.Logger.Info("GIF export completed successfully",
		zap.String("output", outputPath),
		zap.Int64("fileSize", fileSize),
		zap.Float64("processingTime", result.ProcessingTime),
	)

	return result, nil
}

// guessContentTypeFromPath guesses the content type from a file path
func guessContentTypeFromPath(path string) string {
	ext := strings.ToLower(filepath.Ext(path))

	switch ext {
	case ".jpg", ".jpeg":
		return "image/jpeg"
	case ".png":
		return "image/png"
	case ".gif":
		return "image/gif"
	case ".mp4":
		return "video/mp4"
	case ".mov":
		return "video/quicktime"
	case ".avi":
		return "video/x-msvideo"
	case ".webm":
		return "video/webm"
	case ".mp3":
		return "audio/mpeg"
	case ".wav":
		return "audio/wav"
	case ".ogg":
		return "audio/ogg"
	case ".flac":
		return "audio/flac"
	case ".aac":
		return "audio/aac"
	case ".m4a":
		return "audio/mp4"
	default:
		// Default to binary stream
		return "application/octet-stream"
	}
}
