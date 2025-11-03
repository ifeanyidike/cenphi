// internal/ai/grpc_client.go - Replace the incomplete Close() method

package ai

import (
	"context"
	"crypto/tls"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"

	"github.com/ifeanyidike/cenphi/internal/config"
	"github.com/ifeanyidike/cenphi/pb"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials"
	"google.golang.org/grpc/credentials/insecure"
)

type MediaIntelligence interface {
	Close() error
	SingleMediaIntelligenceRequests
}

type SingleMediaIntelligenceRequests interface {
	EnhanceMedia(ctx context.Context, req *pb.EnhanceRequest) (*pb.EnhanceResponse, error)
	GenerateNarration(ctx context.Context, req *pb.NarrationRequest) (*pb.NarrationResponse, error)
	GenerateClips(ctx context.Context, req *pb.ClippingRequest) (*pb.ClippingResponse, error)
	NoiseRemoval(ctx context.Context, req *pb.NoiseReductionRequest) (*pb.NoiseReductionResponse, error)
	GenerateStoryVideo(ctx context.Context, req *pb.StoryModeRequest) (*pb.StoryModeResponse, error)
	DetectHooks(ctx context.Context, req *pb.HookDetectionRequest) (*pb.HookDetectionResponse, error)
	OptimizeMediaForPlatform(ctx context.Context, req *pb.OptimizeRequest) (*pb.OptimizeResponse, error)
	AnalyzeViralPotential(ctx context.Context, req *pb.ViralAnalysisRequest) (*pb.ViralAnalysisResponse, error)

	// IMPROVEMENT #1: Content-Aware Scene Analysis & Adaptive Enhancement
	AdaptiveEnhanceMedia(ctx context.Context, req *pb.AdaptiveEnhanceRequest) (*pb.AdaptiveEnhanceResponse, error)

	// IMPROVEMENT #2: Smart Platform Recommendation
	RecommendPlatforms(ctx context.Context, req *pb.PlatformRecommendRequest) (*pb.PlatformRecommendResponse, error)

	// Step-by-step Platform Optimization RPCs
	CropResize(ctx context.Context, req *pb.CropResizeRequest) (*pb.CropResizeResponse, error)
	BurnCaptions(ctx context.Context, req *pb.BurnCaptionsRequest) (*pb.BurnCaptionsResponse, error)
	ApplyTextOverlay(ctx context.Context, req *pb.TextOverlayRequest) (*pb.TextOverlayResponse, error)
	ApplyBranding(ctx context.Context, req *pb.ApplyBrandingRequest) (*pb.ApplyBrandingResponse, error)
	MixMusic(ctx context.Context, req *pb.MixMusicRequest) (*pb.MixMusicResponse, error)
	NormalizeAudio(ctx context.Context, req *pb.NormalizeAudioRequest) (*pb.NormalizeAudioResponse, error)
	EnhanceVideo(ctx context.Context, req *pb.EnhanceVideoRequest) (*pb.EnhanceVideoResponse, error)

	// Step-by-step Story Video RPCs (3-step workflow)
	CollectClips(ctx context.Context, req *pb.CollectClipsRequest) (*pb.CollectClipsResponse, error)
	AIOrdering(ctx context.Context, req *pb.AIOrderingRequest) (*pb.AIOrderingResponse, error)
	AssembleDraft(ctx context.Context, req *pb.AssembleDraftRequest) (*pb.AssembleDraftResponse, error)
	CollectAndAssembleClips(ctx context.Context, req *pb.CollectAndAssembleClipsRequest) (*pb.AssembleDraftResponse, error)
	ApplyBrollOverlays(ctx context.Context, req *pb.BrollOverlayRequest) (*pb.BrollOverlayResponse, error)
	SearchStockFootage(ctx context.Context, req *pb.StockFootageSearchRequest) (*pb.StockFootageSearchResponse, error)

	// Legacy Story Video RPCs (still supported)
	NormalizeVideoResolution(ctx context.Context, req *pb.NormalizeVideoRequest) (*pb.NormalizeVideoResponse, error)
	AssembleStoryVideo(ctx context.Context, req *pb.AssembleStoryRequest) (*pb.AssembleStoryResponse, error)
	AddIntroOutro(ctx context.Context, req *pb.IntroOutroRequest) (*pb.IntroOutroResponse, error)

	// Session Management RPCs
	SaveProgress(ctx context.Context, req *pb.SaveProgressRequest) (*pb.SaveProgressResponse, error)
	CleanupSession(ctx context.Context, req *pb.CleanupSessionRequest) (*pb.CleanupSessionResponse, error)
}

type GRPCClient struct {
	enhancementClient  pb.MediaEnhancementServiceClient
	narrationClient    pb.NarrationServiceClient
	clippingClient     pb.SmartClippingServiceClient
	optimizerClient    pb.PlatformOptimizerServiceClient
	noiseRemovalClient pb.NoiseReducerServiceClient
	storyModeClient    pb.StoryModeServiceClient
	viralClient        pb.ViralAnalysisServiceClient
	sessionMgmtClient  pb.SessionManagementServiceClient

	// Connection and config
	conn    *grpc.ClientConn
	address string // Store address for HTTP cancel endpoint
	useTLS  bool   // Store TLS flag for HTTP cancel endpoint
	closed  bool
	mu      sync.RWMutex
}

func NewGRPCClients(cfg config.MediaIntelligenceConfig) (MediaIntelligence, error) {
	var opts []grpc.DialOption

	// Determine if we should use TLS based on environment or address
	if cfg.UseTLS || strings.Contains(cfg.Address, ".run.app") {
		// Cloud Run requires TLS
		opts = append(opts, grpc.WithTransportCredentials(credentials.NewTLS(&tls.Config{})))
		fmt.Printf("GRPC connecting with TLS to: %s\n", cfg.Address)
	} else {
		// Local development - no TLS
		opts = append(opts, grpc.WithTransportCredentials(insecure.NewCredentials()))
		fmt.Printf("GRPC connecting without TLS to: %s\n", cfg.Address)
	}

	// Connect to gRPC server
	conn, err := grpc.NewClient(cfg.Address, opts...)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to gRPC server: %w", err)
	}

	return &GRPCClient{
		enhancementClient:  pb.NewMediaEnhancementServiceClient(conn),
		narrationClient:    pb.NewNarrationServiceClient(conn),
		clippingClient:     pb.NewSmartClippingServiceClient(conn),
		optimizerClient:    pb.NewPlatformOptimizerServiceClient(conn),
		noiseRemovalClient: pb.NewNoiseReducerServiceClient(conn),
		storyModeClient:    pb.NewStoryModeServiceClient(conn),
		viralClient:        pb.NewViralAnalysisServiceClient(conn),
		sessionMgmtClient:  pb.NewSessionManagementServiceClient(conn),
		conn:               conn,
		address:            cfg.Address,
		useTLS:             cfg.UseTLS || strings.Contains(cfg.Address, ".run.app"),
		closed:             false,
	}, nil
}

// FIXED: Complete Close() method implementation
func (g *GRPCClient) Close() error {
	g.mu.Lock()
	defer g.mu.Unlock()

	if g.closed {
		return nil // Already closed
	}

	if g.conn != nil {
		err := g.conn.Close()
		if err != nil {
			return fmt.Errorf("failed to close gRPC connection: %w", err)
		}
	}

	g.closed = true
	return nil
}

// Add context validation for all gRPC methods

func (g *GRPCClient) EnhanceMedia(ctx context.Context, req *pb.EnhanceRequest) (*pb.EnhanceResponse, error) {
	g.mu.RLock()
	defer g.mu.RUnlock()

	if g.closed {
		return nil, fmt.Errorf("gRPC client is closed")
	}

	return g.enhancementClient.EnhanceMedia(ctx, req)
}

func (g *GRPCClient) AdaptiveEnhanceMedia(ctx context.Context, req *pb.AdaptiveEnhanceRequest) (*pb.AdaptiveEnhanceResponse, error) {
	g.mu.RLock()
	defer g.mu.RUnlock()

	if g.closed {
		return nil, fmt.Errorf("gRPC client is closed")
	}

	return g.enhancementClient.AdaptiveEnhanceMedia(ctx, req)
}

func (g *GRPCClient) GenerateNarration(ctx context.Context, req *pb.NarrationRequest) (*pb.NarrationResponse, error) {
	g.mu.RLock()
	defer g.mu.RUnlock()

	if g.closed {
		return nil, fmt.Errorf("gRPC client is closed")
	}

	return g.narrationClient.GenerateNarration(ctx, req)
}

func (g *GRPCClient) GenerateClips(ctx context.Context, req *pb.ClippingRequest) (*pb.ClippingResponse, error) {
	g.mu.RLock()
	defer g.mu.RUnlock()

	if g.closed {
		return nil, fmt.Errorf("gRPC client is closed")
	}

	return g.clippingClient.GenerateClips(ctx, req)
}

func (g *GRPCClient) NoiseRemoval(ctx context.Context, req *pb.NoiseReductionRequest) (*pb.NoiseReductionResponse, error) {
	g.mu.RLock()
	defer g.mu.RUnlock()

	if g.closed {
		return nil, fmt.Errorf("gRPC client is closed")
	}

	return g.noiseRemovalClient.ReduceNoise(ctx, req)
}

func (g *GRPCClient) GenerateStoryVideo(ctx context.Context, req *pb.StoryModeRequest) (*pb.StoryModeResponse, error) {
	g.mu.RLock()
	defer g.mu.RUnlock()

	if g.closed {
		return nil, fmt.Errorf("gRPC client is closed")
	}

	return g.storyModeClient.GenerateStoryVideo(ctx, req)
}

func (g *GRPCClient) DetectHooks(ctx context.Context, req *pb.HookDetectionRequest) (*pb.HookDetectionResponse, error) {
	g.mu.RLock()
	defer g.mu.RUnlock()

	if g.closed {
		return nil, fmt.Errorf("gRPC client is closed")
	}

	return g.storyModeClient.DetectHooks(ctx, req)
}

// 3-step Story Video workflow methods
func (g *GRPCClient) CollectClips(ctx context.Context, req *pb.CollectClipsRequest) (*pb.CollectClipsResponse, error) {
	g.mu.RLock()
	defer g.mu.RUnlock()

	if g.closed {
		return nil, fmt.Errorf("gRPC client is closed")
	}

	return g.storyModeClient.CollectClips(ctx, req)
}

func (g *GRPCClient) AIOrdering(ctx context.Context, req *pb.AIOrderingRequest) (*pb.AIOrderingResponse, error) {
	g.mu.RLock()
	defer g.mu.RUnlock()

	if g.closed {
		return nil, fmt.Errorf("gRPC client is closed")
	}

	return g.storyModeClient.AIOrdering(ctx, req)
}

func (g *GRPCClient) AssembleDraft(ctx context.Context, req *pb.AssembleDraftRequest) (*pb.AssembleDraftResponse, error) {
	g.mu.RLock()
	defer g.mu.RUnlock()

	if g.closed {
		return nil, fmt.Errorf("gRPC client is closed")
	}

	return g.storyModeClient.AssembleDraft(ctx, req)
}

func (g *GRPCClient) CollectAndAssembleClips(ctx context.Context, req *pb.CollectAndAssembleClipsRequest) (*pb.AssembleDraftResponse, error) {
	g.mu.RLock()
	defer g.mu.RUnlock()

	if g.closed {
		return nil, fmt.Errorf("gRPC client is closed")
	}

	return g.storyModeClient.CollectAndAssembleClips(ctx, req)
}

func (g *GRPCClient) ApplyBrollOverlays(ctx context.Context, req *pb.BrollOverlayRequest) (*pb.BrollOverlayResponse, error) {
	g.mu.RLock()
	defer g.mu.RUnlock()

	if g.closed {
		return nil, fmt.Errorf("gRPC client is closed")
	}

	return g.storyModeClient.ApplyBrollOverlays(ctx, req)
}

func (g *GRPCClient) SearchStockFootage(ctx context.Context, req *pb.StockFootageSearchRequest) (*pb.StockFootageSearchResponse, error) {
	g.mu.RLock()
	defer g.mu.RUnlock()

	if g.closed {
		return nil, fmt.Errorf("gRPC client is closed")
	}

	return g.storyModeClient.SearchStockFootage(ctx, req)
}

func (g *GRPCClient) OptimizeMediaForPlatform(ctx context.Context, req *pb.OptimizeRequest) (*pb.OptimizeResponse, error) {
	g.mu.RLock()
	defer g.mu.RUnlock()

	if g.closed {
		return nil, fmt.Errorf("gRPC client is closed")
	}

	return g.optimizerClient.OptimizeMedia(ctx, req)
}

func (g *GRPCClient) AnalyzeViralPotential(ctx context.Context, req *pb.ViralAnalysisRequest) (*pb.ViralAnalysisResponse, error) {
	g.mu.RLock()
	defer g.mu.RUnlock()

	if g.closed {
		return nil, fmt.Errorf("gRPC client is closed")
	}

	return g.viralClient.AnalyzeViralPotential(ctx, req)
}

// IMPROVEMENT #2: Smart Platform Recommendation
func (g *GRPCClient) RecommendPlatforms(ctx context.Context, req *pb.PlatformRecommendRequest) (*pb.PlatformRecommendResponse, error) {
	g.mu.RLock()
	defer g.mu.RUnlock()

	if g.closed {
		return nil, fmt.Errorf("gRPC client is closed")
	}

	return g.optimizerClient.RecommendPlatforms(ctx, req)
}

// Step-by-step Platform Optimization RPC Methods

func (g *GRPCClient) CropResize(ctx context.Context, req *pb.CropResizeRequest) (*pb.CropResizeResponse, error) {
	g.mu.RLock()
	defer g.mu.RUnlock()

	if g.closed {
		return nil, fmt.Errorf("gRPC client is closed")
	}

	return g.optimizerClient.CropResize(ctx, req)
}

func (g *GRPCClient) BurnCaptions(ctx context.Context, req *pb.BurnCaptionsRequest) (*pb.BurnCaptionsResponse, error) {
	g.mu.RLock()
	defer g.mu.RUnlock()

	if g.closed {
		return nil, fmt.Errorf("gRPC client is closed")
	}

	return g.optimizerClient.BurnCaptions(ctx, req)
}

func (g *GRPCClient) ApplyBranding(ctx context.Context, req *pb.ApplyBrandingRequest) (*pb.ApplyBrandingResponse, error) {
	g.mu.RLock()
	defer g.mu.RUnlock()

	if g.closed {
		return nil, fmt.Errorf("gRPC client is closed")
	}

	return g.optimizerClient.ApplyBranding(ctx, req)
}

func (g *GRPCClient) MixMusic(ctx context.Context, req *pb.MixMusicRequest) (*pb.MixMusicResponse, error) {
	g.mu.RLock()
	defer g.mu.RUnlock()

	if g.closed {
		return nil, fmt.Errorf("gRPC client is closed")
	}

	return g.optimizerClient.MixMusic(ctx, req)
}

func (g *GRPCClient) NormalizeAudio(ctx context.Context, req *pb.NormalizeAudioRequest) (*pb.NormalizeAudioResponse, error) {
	g.mu.RLock()
	defer g.mu.RUnlock()

	if g.closed {
		return nil, fmt.Errorf("gRPC client is closed")
	}

	return g.optimizerClient.NormalizeAudio(ctx, req)
}

func (g *GRPCClient) EnhanceVideo(ctx context.Context, req *pb.EnhanceVideoRequest) (*pb.EnhanceVideoResponse, error) {
	g.mu.RLock()
	defer g.mu.RUnlock()

	if g.closed {
		return nil, fmt.Errorf("gRPC client is closed")
	}

	return g.optimizerClient.EnhanceVideo(ctx, req)
}

func (g *GRPCClient) ApplyTextOverlay(ctx context.Context, req *pb.TextOverlayRequest) (*pb.TextOverlayResponse, error) {
	g.mu.RLock()
	defer g.mu.RUnlock()

	if g.closed {
		return nil, fmt.Errorf("gRPC client is closed")
	}

	return g.optimizerClient.ApplyTextOverlay(ctx, req)
}

// Step-by-step Story Video RPC Methods

func (g *GRPCClient) NormalizeVideoResolution(ctx context.Context, req *pb.NormalizeVideoRequest) (*pb.NormalizeVideoResponse, error) {
	g.mu.RLock()
	defer g.mu.RUnlock()

	if g.closed {
		return nil, fmt.Errorf("gRPC client is closed")
	}

	return g.storyModeClient.NormalizeVideoResolution(ctx, req)
}

func (g *GRPCClient) AssembleStoryVideo(ctx context.Context, req *pb.AssembleStoryRequest) (*pb.AssembleStoryResponse, error) {
	g.mu.RLock()
	defer g.mu.RUnlock()

	if g.closed {
		return nil, fmt.Errorf("gRPC client is closed")
	}

	return g.storyModeClient.AssembleStoryVideo(ctx, req)
}

func (g *GRPCClient) AddIntroOutro(ctx context.Context, req *pb.IntroOutroRequest) (*pb.IntroOutroResponse, error) {
	g.mu.RLock()
	defer g.mu.RUnlock()

	if g.closed {
		return nil, fmt.Errorf("gRPC client is closed")
	}

	return g.storyModeClient.AddIntroOutro(ctx, req)
}

// Session Management RPC Methods

func (g *GRPCClient) SaveProgress(ctx context.Context, req *pb.SaveProgressRequest) (*pb.SaveProgressResponse, error) {
	g.mu.RLock()
	defer g.mu.RUnlock()

	if g.closed {
		return nil, fmt.Errorf("gRPC client is closed")
	}

	return g.sessionMgmtClient.SaveProgress(ctx, req)
}

func (g *GRPCClient) CleanupSession(ctx context.Context, req *pb.CleanupSessionRequest) (*pb.CleanupSessionResponse, error) {
	g.mu.RLock()
	defer g.mu.RUnlock()

	if g.closed {
		return nil, fmt.Errorf("gRPC client is closed")
	}

	return g.sessionMgmtClient.CleanupSession(ctx, req)
}

// CancelJob cancels a running job by calling the AI service's REST cancel endpoint
func (g *GRPCClient) CancelJob(ctx context.Context, jobID string) error {
	g.mu.RLock()
	defer g.mu.RUnlock()

	if g.closed {
		return fmt.Errorf("gRPC client is closed")
	}

	// Check if we're in Cloud Run mode (should use gRPC context cancellation)
	// In local dev, use REST API endpoint
	isCloudRun := os.Getenv("CLOUD_RUN") == "true" || strings.Contains(g.address, "run.app")

	if isCloudRun {
		// Cloud Run: Job cancellation happens via gRPC context cancellation
		// The context is already cancelled by the orchestrator, so just log
		log.Printf("☁️  Cloud Run: Job %s cancellation handled via gRPC context", jobID)
		return nil
	}

	// Local dev: Use REST API endpoint for cancellation
	// gRPC runs on port 50052, REST API runs on port 8080
	// gRPC address format: "hostname:50052" or "hostname:443" for TLS
	// HTTP URL format: "http://hostname:8080" or "https://hostname" for TLS
	var baseURL string
	if g.useTLS {
		// For TLS (Cloud Run), use https and remove port if it's 443
		host := strings.TrimSuffix(g.address, ":443")
		baseURL = fmt.Sprintf("https://%s", host)
	} else {
		// For local development, replace gRPC port (50052) with REST port (8080)
		host := strings.TrimSuffix(g.address, ":50052")
		baseURL = fmt.Sprintf("http://%s:8080", host)
	}

	// Build cancel endpoint URL
	cancelURL := fmt.Sprintf("%s/ai/jobs/%s/cancel", baseURL, jobID)

	// Create HTTP client
	httpClient := &http.Client{
		Timeout: 10 * time.Second,
	}

	// Create POST request
	req, err := http.NewRequestWithContext(ctx, "POST", cancelURL, nil)
	if err != nil {
		return fmt.Errorf("failed to create cancel request: %w", err)
	}

	// Set headers
	req.Header.Set("Content-Type", "application/json")

	// Execute request
	resp, err := httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("failed to send cancel request: %w", err)
	}
	defer resp.Body.Close()

	// Check response status
	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("cancel request failed with status %d: %s", resp.StatusCode, string(body))
	}

	return nil
}
