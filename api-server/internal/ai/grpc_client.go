// internal/ai/grpc_client.go - Replace the incomplete Close() method

package ai

import (
	"context"
	"crypto/tls"
	"fmt"
	"strings"
	"sync"

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
	OptimizeMediaForPlatform(ctx context.Context, req *pb.OptimizeRequest) (*pb.OptimizeResponse, error)
	AnalyzeViralPotential(ctx context.Context, req *pb.ViralAnalysisRequest) (*pb.ViralAnalysisResponse, error)
}

type GRPCClient struct {
	enhancementClient  pb.MediaEnhancementServiceClient
	narrationClient    pb.NarrationServiceClient
	clippingClient     pb.SmartClippingServiceClient
	optimizerClient    pb.PlatformOptimizerServiceClient
	noiseRemovalClient pb.NoiseReducerServiceClient
	storyModeClient    pb.StoryModeServiceClient
	viralClient        pb.ViralAnalysisServiceClient

	// Add connection reference for proper cleanup
	conn   *grpc.ClientConn
	closed bool
	mu     sync.RWMutex
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
		conn:               conn,
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
