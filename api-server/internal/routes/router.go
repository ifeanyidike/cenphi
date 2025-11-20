// internal/routes/router.go
package routes

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/ifeanyidike/cenphi/internal/controllers"
	"github.com/ifeanyidike/cenphi/internal/middleware"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

func RegisterRoutes(
	r chi.Router,
	authMiddleware middleware.AuthMiddleware,
	healthController controllers.HealthController,
	userController controllers.UserController,
	swaggerController controllers.SwaggerController,
	workspaceController controllers.WorkspaceController,
	teamMemberController controllers.TeamMemberController,
	onboardingController controllers.OnboardingController,
	testimonialController controllers.TestimonialController,
	testimonialTranscriptController *controllers.TestimonialTranscriptController,
	socialController controllers.SocialController,
	aiTestController controllers.AITestController,

	testimonialRequestController controllers.TestimonialRequestController,
	testimonialCollectionController controllers.TestimonialCollectionController,
	sseTestimonialMonitor controllers.SSETestimonialMonitor,
	googleDriveController controllers.GoogleDriveController,
	aiProcessorController controllers.AIProcessorController,
	presetController controllers.PresetController,
	chatWithDataController controllers.ChatWithDataController,
	analyticsController controllers.AnalyticsController,
	vectorStoreController controllers.VectorStoreController,
	studioController controllers.StudioController,
	testController controllers.TestController,
	publicShareController controllers.PublicShareController,
	aiPostController controllers.AIPostController,
	widgetController controllers.WidgetController,
	contentFolderController *controllers.ContentFolderController,
	approvalController *controllers.ApprovalController,
	showcaseController *controllers.ShowcaseController,
	rateLimiter middleware.RateLimiter,
) {

	RegisterWidget(&r)
	RegisterShareWidgetRoutes(r, widgetController) // Must be at root level, not under /api

	// Group all API routes under /api
	r.Route("/api", func(r chi.Router) {
		RegisterMetrics(&r)
		// RegisterAITestRoutes(r, aiTestController, rateLimiter)
		RegisterHealthRoutes(r, healthController)
		RegisterUserRoutes(r, userController, authMiddleware)
		RegisterSwaggerRoute(r, swaggerController)
		RegisterWorkspaceRoutes(r, workspaceController, authMiddleware)
		RegisterContentFolderRoutes(r, *contentFolderController, authMiddleware)
		RegisterTeamMemberRoutes(r, teamMemberController, authMiddleware)
		RegisterOnboardingRoutes(r, onboardingController, authMiddleware)
		RegisterTestimonialRoutes(r, testimonialController, *testimonialTranscriptController, authMiddleware)
		RegisterSocialRoutes(r, socialController, authMiddleware)
		RegisterTestimonialRequestRoutes(r, testimonialRequestController, authMiddleware)
		RegisterTestimonialCollectionRoutes(r, testimonialCollectionController, authMiddleware)
		RegisterSSETestimonialMonitorRoutes(r, sseTestimonialMonitor, authMiddleware)
		RegisterGoogleDriveRoutes(r, googleDriveController, authMiddleware)
		RegisterAIProcessorRoutes(r, aiProcessorController, rateLimiter, authMiddleware)
		RegisterPresetRoutes(r, presetController, authMiddleware)
		RegisterChatWithDataRoutes(r, chatWithDataController, authMiddleware)
		RegisterAnalyticsRoutes(r, analyticsController, authMiddleware)
		RegisterVectorStoreRoutes(r, vectorStoreController, authMiddleware)
		RegisterStudioRoutes(r, studioController, authMiddleware)
		RegisterTestRoutes(r, testController)
		RegisterPublicShareRoutes(r, publicShareController, authMiddleware)
		RegisterAIPostRoutes(r, aiPostController, authMiddleware)
		RegisterApprovalRoutes(r, *approvalController, authMiddleware)
		RegisterShowcaseRoutes(r, *showcaseController, authMiddleware)

	})

	// RegisterWebsocket(&r, *websocketController)
}

// func RegisterWebsocket(r *chi.Router, wsController controllers.WebsocketController) {
// 	(*r).Route("/ws", func(r chi.Router) {
// 		r.Get("/interview/{campaignID}", wsController.HandleInterview)
// 	})
// }

func RegisterMetrics(r *chi.Router) {
	(*r).Handle("/metrics", promhttp.Handler())
}

func RegisterWidget(r *chi.Router) {
	(*r).Get("/widget.js", func(w http.ResponseWriter, r *http.Request) {
		fmt.Println("rendering widget.js")
		http.ServeFile(w, r, "public/widget.js")
	})
	(*r).Get("/widgets.js", func(w http.ResponseWriter, r *http.Request) {
		fmt.Println("rendering widget.umd.cjs")
		http.ServeFile(w, r, "public/widget.umd.cjs")
	})
	// Serve share widget JavaScript file at root level (public - no auth required)
	(*r).Get("/share-widget.js", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/javascript")
		w.Header().Set("Cache-Control", "public, max-age=3600")
		w.Header().Set("Access-Control-Allow-Origin", "*")
		http.ServeFile(w, r, "public/share-widget.js")
	})
}

func RegisterHealthRoutes(r chi.Router, healthController controllers.HealthController) {
	r.Get("/health", healthController.HealthCheck)
	r.Get("/health/grpc", healthController.GRPCHealthCheck)
}

func RegisterSwaggerRoute(r chi.Router, controller controllers.SwaggerController) {
	r.Get("/swagger/*", controller.SwaggerHandler)
}

func RegisterUserRoutes(r chi.Router, controller controllers.UserController, authMiddleware middleware.AuthMiddleware) {
	r.Route("/users", func(r chi.Router) {
		r.Post("/register", controller.RegisterUser)

		r.Group(func(r chi.Router) {
			r.Use(authMiddleware.VerifyToken)
			r.Get("/workspace", controller.GetWorkspace)
			r.Get("/user", controller.GetUserByUID)
			r.Get("/{id}", controller.GetUser)
			r.Put("/{uid}", controller.UpdateUser)
		})
	})
}

func RegisterWorkspaceRoutes(r chi.Router, controller controllers.WorkspaceController, authMiddleware middleware.AuthMiddleware) {
	r.Route("/workspaces", func(r chi.Router) {
		r.Use(authMiddleware.VerifyToken)

		r.Post("/", controller.CreateWorkspace)
		r.Get("/", controller.GetWorkspace)
		r.Get("/{id}", controller.GetWorkspace)
		r.Put("/{id}", controller.UpdateWorkspace)
		r.Delete("/{id}", controller.DeleteWorkspace)

		// r.Route("/{workspaceID}/testimonials", func(r chi.Router) {
		// 	r.Get("/", controller.GetTestimonialsByWorkspaceID)
		// 	// r.Get("/{testimonialID}", controller.GetTestimonial)
		// })
	})
}

func RegisterContentFolderRoutes(r chi.Router, controller controllers.ContentFolderController, authMiddleware middleware.AuthMiddleware) {
	r.Route("/workspaces/{workspaceID}/folders", func(r chi.Router) {
		r.Use(authMiddleware.VerifyToken)

		// Folder CRUD operations
		r.Post("/", controller.CreateFolder)
		r.Get("/", controller.ListFolders)
		r.Get("/{folderID}", controller.GetFolder)
		r.Put("/{folderID}", controller.UpdateFolder)
		r.Delete("/{folderID}", controller.DeleteFolder)

		// Folder item operations
		r.Post("/{folderID}/items", controller.AddItemsToFolder)
		r.Get("/{folderID}/items", controller.GetFolderItems)
		r.Delete("/{folderID}/items/{artifactID}", controller.RemoveItemFromFolder)

		// Folder with items
		r.Get("/{folderID}/details", controller.GetFolderWithItems)

		// Download operations
		r.Get("/{folderID}/download", controller.DownloadFolderAsZip)
	})

	// Clip collection download (separate route as it's artifact-based)
	r.Route("/workspaces/{workspaceID}/artifacts/{artifactID}/clips", func(r chi.Router) {
		r.Use(authMiddleware.VerifyToken)
		r.Get("/download", controller.DownloadClipCollectionAsZip)
	})
}

func RegisterTeamMemberRoutes(r chi.Router, controller controllers.TeamMemberController, authMiddleware middleware.AuthMiddleware) {
	r.Route("/team-member", func(r chi.Router) {
		r.Group(func(r chi.Router) {
			r.Use(authMiddleware.VerifyToken)
			r.Get("/{id}", controller.GetTeamMember)
			r.Get("/user/{id}", controller.GetTeamMemberByUserID)
			r.Get("/firebase_uid/{id}", controller.GetTeamMemberByFirebaseUID)
			r.Post("/", controller.CreateTeamMember)
			r.Delete("/{id}", controller.DeleteTeamMember)
			r.Get("/", controller.GetTeamMembers)
		})
	})
}

func RegisterOnboardingRoutes(r chi.Router, controller controllers.OnboardingController, authMiddleware middleware.AuthMiddleware) {
	r.Route("/onboarding", func(r chi.Router) {
		r.Group(func(r chi.Router) {
			r.Use(authMiddleware.VerifyToken)
			r.Post("/setup", controller.Onboard)
		})
	})
}

func RegisterTestimonialRoutes(r chi.Router, controller controllers.TestimonialController, transcriptController controllers.TestimonialTranscriptController, authMiddleware middleware.AuthMiddleware) {
	r.Route("/testimonials", func(r chi.Router) {
		r.Group(func(r chi.Router) {
			r.Use(authMiddleware.VerifyToken)

			// Basic CRUD
			r.Get("/{id}", controller.GetTestimonial)
			r.Get("/", controller.GetTestimonials)
			r.Put("/{id}", controller.UpdateTestimonial)
			r.Delete("/{id}", controller.DeleteTestimonial)

			// Search and analytics
			r.Post("/search", controller.SearchTestimonials)

			// Vector store operations
			r.Post("/{id}/upload-to-vector", controller.UploadToVector)

			// AI features - read cached
			r.Get("/{id}/platform-recommendations", controller.GetPlatformRecommendation)

			// AI features - manual generation (POST to trigger computation)
			r.Post("/{id}/generate-platform-recommendations", controller.GeneratePlatformRecommendation)

			// Lazy-loaded transcript data (not fetched in list/detail queries to save bandwidth)
			r.Get("/{id}/transcript-segments", transcriptController.GetTranscriptSegments) // Full segments array
			r.Get("/{id}/duration", transcriptController.GetVideoDuration)                 // Calculated duration only

			// Lazy-loaded highlights data (on-demand fetch from testimonial_highlights table)
			r.Get("/{id}/highlights", controller.GetHighlights) // Query param: ?mode=standalone|story_video

			// Upload endpoint
			//r.Post("/upload", controller.HandleTestimonialUpload)
		})
	})
}

func RegisterSocialRoutes(r chi.Router, controller controllers.SocialController, authMiddleware middleware.AuthMiddleware) {
	// Public OAuth callback endpoint (no auth required)
	r.Get("/social/oauth/callback", controller.HandleOAuthCallback)

	// Protected social media routes
	r.Route("/workspaces/{workspaceID}/social", func(r chi.Router) {
		r.Use(authMiddleware.VerifyToken)

		// OAuth authorization endpoints
		r.Get("/auth/{platform}", controller.GetAuthURL)

		// Account management
		r.Get("/accounts", controller.GetAccounts)

		// Platform-specific post creation
		r.Post("/{platform}/posts", controller.CreatePost)

		// General posts endpoint for workspace
		r.Get("/posts", controller.GetPosts)
	})

	// AI-powered social features
	r.Route("/workspaces/{workspaceID}/social/ai", func(r chi.Router) {
		r.Use(authMiddleware.VerifyToken)

		// AI best time suggestion
		r.Post("/best-time", controller.GetBestPostingTime)
	})

	// Protected social post routes (no workspace in path for flexibility)
	r.Route("/social", func(r chi.Router) {
		// r.Use(authMiddleware.VerifyToken) //commented out for test

		// Account management
		r.Post("/accounts/{accountID}/disconnect", controller.DisconnectAccount)

		// Post management
		r.Route("/posts/{postID}", func(r chi.Router) {
			r.Get("/", controller.GetPost)
			r.Put("/", controller.UpdatePost)
			r.Delete("/", controller.DeletePost)

			// Publishing
			r.Post("/publish", controller.PublishPost)
			r.Post("/schedule", controller.SchedulePost)

			// Analytics
			r.Get("/analytics", controller.GetPostAnalytics)
			r.Post("/sync-metrics", controller.SyncPostMetrics)
		})
	})
}

func RegisterTestimonialRequestRoutes(r chi.Router, controller controllers.TestimonialRequestController, authMiddleware middleware.AuthMiddleware) {
	r.Route("/mailing", func(r chi.Router) {
		// Public webhook endpoint

		// Protected endpoints
		r.Group(func(r chi.Router) {
			// r.Use(authMiddleware.VerifyToken)

			// Email sending
			r.Post("/testimonial-request", controller.SendSingleEmail)
			r.Post("/bulk-testimonial-request", controller.SendBulkEmails)
			// r.Post("/testimonial-reminder", controller.SendTestimonialReminder)

			// Status and info
			r.Get("/get-logs/{requestID}", controller.GetEmailLogs)
			r.Get("/track-response", controller.TrackResponse)
			r.Get("/track-clicks", controller.TrackClick)

			// Email templates for workspaces
			r.Get("/workspaces/{workspaceID}/templates", controller.GetWorkspaceEmailTemplates)
			r.Get("/workspaces/{workspaceID}/templates/{templateName}", controller.GetWorkspaceEmailTemplate)
			r.Post("/workspaces/{workspaceID}/templates", controller.CreateOrUpdateWorkspaceEmailTemplate)
		})
	})
}

func RegisterSSETestimonialMonitorRoutes(r chi.Router, tcc controllers.SSETestimonialMonitor, authMiddleware middleware.AuthMiddleware) {
	r.Route("/processing/testimonials", func(r chi.Router) {
		// SSE stream for real-time job completion updates
		r.Get("/stream", tcc.StreamTestimonialProcessing)
		r.Options("/stream", tcc.HandleStreamingOptions)
		r.Get("/status", tcc.GetTestimonialProcessingStatus)
	})
}

func RegisterTestimonialCollectionRoutes(r chi.Router, tcc controllers.TestimonialCollectionController, authMiddleware middleware.AuthMiddleware) {
	// Public webhook endpoint for Vapi.ai (no authentication required)
	r.Post("/webhooks/vapi", tcc.VapiWebhook)

	// Test endpoint to validate webhook structure (for development only)
	r.Post("/webhooks/vapi/test", func(w http.ResponseWriter, r *http.Request) {
		var webhookData map[string]interface{}
		if err := json.NewDecoder(r.Body).Decode(&webhookData); err != nil {
			http.Error(w, "Invalid JSON", http.StatusBadRequest)
			return
		}

		response := map[string]interface{}{
			"success":       true,
			"message":       "Webhook structure validated",
			"received_data": webhookData,
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(response)
	})

	r.Route("/collection/workspaces/{workspaceID}/testimonials", func(r chi.Router) {
		// Main collection endpoints - support both text and video
		r.Post("/widget", tcc.CollectFromWidget) // JSON for text, multipart for video
		r.Post("/form", tcc.CollectFromForm)     // JSON for text, multipart for video

		r.Group(func(r chi.Router) {
			// r.Use(authMiddleware.VerifyToken)
			r.Post("/upload/video", tcc.UploadVideo)            // Direct video upload (legacy)
			r.Post("/upload/video/queue", tcc.QueueVideoUpload) // Queued video upload (new)
			r.Post("/upload-url", tcc.GetUploadURL)             // Get presigned URL for large file upload
			r.Post("/upload-confirm", tcc.ConfirmUpload)        // Confirm large file upload completion
			r.Post("/upload/csv", tcc.UploadCSV)
			r.Post("/upload/excel", tcc.UploadXLS)
			r.Post("/import/google-drive", tcc.ImportFromGoogleDrive)
			r.Post("/request", tcc.SendTestimonialRequest)
			r.Post("/voice/schedule", tcc.ScheduleVoiceTestimonial) // Voice testimonial scheduling
			r.Post("/voice/instant", tcc.InstantVoiceTestimonial)   // Instant voice testimonial call
		})

	})
}

func RegisterGoogleDriveRoutes(r chi.Router, controller controllers.GoogleDriveController, authMiddleware middleware.AuthMiddleware) {
	// Google OAuth routes
	r.Route("/google", func(r chi.Router) {
		// Public OAuth callback (no auth required)
		r.Get("/oauth/callback", controller.HandleOAuthCallback)

		// Protected routes
		r.Group(func(r chi.Router) {
			r.Use(authMiddleware.VerifyToken)

			// OAuth management
			r.Route("/workspaces/{workspaceID}/drive", func(r chi.Router) {
				r.Get("/auth", controller.GetAuthURL)
				r.Get("/accounts", controller.GetAccounts)
				r.Get("/files", controller.ListFiles)
				r.Get("/testimonial-files", controller.ListTestimonialFiles)
			})
		})
	})

	// Additional routes for frontend compatibility
	r.Route("/google-drive", func(r chi.Router) {
		r.Use(authMiddleware.VerifyToken)
		r.Get("/files", controller.ListFiles)
		r.Post("/import", controller.ImportFile)
	})
}

func RegisterAIProcessorRoutes(r chi.Router, controller controllers.AIProcessorController, rateLimiter middleware.RateLimiter, authMiddleware middleware.AuthMiddleware) {
	// controller := controllers.NewAITestController(aiClient, logger)

	r.Group(func(r chi.Router) {
		r.Use(authMiddleware.VerifyToken)
		r.Post("/ai/save-artifact", controller.SaveArtifact)
		r.Delete("/ai/artifacts/{id}", controller.DeleteArtifact)
		r.Delete("/ai/artifacts/{artifactId}/clips/{clipId}", controller.DeleteClip)
	})

	r.Group(func(r chi.Router) {
		r.Use(authMiddleware.VerifyToken) // commented to allow for tests for now.
		r.Use(rateLimiter.AIGenerationMiddleware())

		r.Post("/ai/transcribe", controller.TranscribeAudio)                 // transcription
		r.Post("/ai/translate", controller.TranslateText)                    // translation
		r.Post("/ai/sentiment", controller.AnalyzeSentiment)                 // sentiment
		r.Post("/ai/highlights", controller.ExtractHighlights)               // highlight
		r.Post("/ai/highlights/by-type", controller.ExtractHighlightsByType) // highlight by type
		r.Post("/ai/highlights/save-order", controller.SaveHighlightOrder)   // save highlight order
		r.Post("/ai/story-video-highlights", controller.GetOrGenerateStoryVideoHighlights) // story video highlights (batch)
		r.Post("/ai/polish", controller.PolishText)                          // polish
		r.Post("/ai/regenerate-content", controller.RegenerateContent)       // regenerate content (no save)
		r.Post("/ai/generate-content", controller.GenerateContent)           // generation
		r.Post("/ai/order-moments", controller.HandleOrderMoments)
		r.Post("/ai/suggest-broll", controller.HandleSuggestBroll) // AI-powered B-roll suggestion
	})

	// GPU-intensive AI operations (10/hour per user)
	r.Group(func(r chi.Router) {
		r.Use(authMiddleware.VerifyToken)
		r.Use(rateLimiter.AIGPUMiddleware())

		r.Post("/ai/optimize-platform", controller.OptimizeForPlatform) // optimizer
		r.Post("/ai/enhance-media", controller.EnhanceMedia)            // enhancement
		r.Post("/ai/generate-narration", controller.GenerateNarration)  // narration
		r.Post("/ai/smart-clips", controller.GenerateSmartClips)        // clipping
		r.Post("/ai/story-video", controller.GenerateStoryVideo)        // emotions
		r.Post("/ai/remove-noise", controller.RemoveNoise)              // emotions
	})

	// Job management routes - use regular API rate limiting
	r.Route("/ai/jobs", func(r chi.Router) {
		// r.Use(authMiddleware.VerifyToken)
		r.Use(rateLimiter.APIMiddleware()) // 100/minute
		r.Use(controller.PreventDuplicateProcessing)

		r.Get("/{jobID}/status", controller.GetJobStatus)
		r.Get("/status", controller.GetBulkJobStatus)
		r.Get("/cancel/{jobID}", controller.CancelJob)

		r.Get("/stream", controller.StreamJobStatus)
		r.Options("/stream", controller.HandleStreamingOptions) // CORS support
	})

	r.Route("/service-lineage", func(r chi.Router) {
		r.Use(authMiddleware.VerifyToken)

		// Get service lineage for any source
		r.Get("/{sourceType}/{sourceID}", controller.GetServiceLineage)

		// Check if specific service is already applied
		r.Get("/{sourceType}/{sourceID}/check/{serviceName}", controller.CheckServiceApplied)

		// Get service tree visualization
		r.Get("/{sourceType}/{sourceID}/tree", controller.GetServiceTree)

		// Get available services for a source
		r.Get("/{sourceType}/{sourceID}/available", controller.GetAvailableServices)

		r.Get("/optimized/{sourceType}/{sourceID}", controller.GetOptimizedServiceLineage)
		r.Delete("/{sourceType}/{sourceID}/cache", controller.InvalidateServiceLineageCache)
	})

	// AI Artifacts routes - fetch artifacts by workspace
	r.Route("/ai/workspaces/{workspaceID}", func(r chi.Router) {
		r.Use(authMiddleware.VerifyToken)

		// Get all artifacts for workspace with optional filtering
		r.Get("/artifacts", controller.GetArtifactsByWorkspace)

		// Get content generation artifacts (multi-testimonial)
		r.Get("/content-generation", controller.GetContentGenerationArtifacts)

		// Get story video artifacts
		r.Get("/story-videos", controller.GetStoryVideoArtifacts)
	})
}

func RegisterTestRoutes(r chi.Router, controller controllers.TestController) {
	r.Route("/test", func(r chi.Router) {
		// OAuth testing endpoints (no auth required)
		r.Get("/oauth/status", controller.TestOAuthStatus)
		r.Post("/oauth/callback", controller.TestHandleOAuthCallback)

		// Google Drive OAuth testing
		r.Get("/workspaces/{workspaceID}/google-drive/auth", controller.TestGetGoogleDriveAuthURL)

		// Social OAuth testing
		r.Get("/workspaces/{workspaceID}/social/auth/{platform}", controller.TestGetSocialAuthURL)
	})
}

func RegisterPresetRoutes(r chi.Router, controller controllers.PresetController, authMiddleware middleware.AuthMiddleware) {
	r.Route("/presets", func(r chi.Router) {
		r.Group(func(r chi.Router) {
			r.Use(authMiddleware.VerifyToken)

			r.Post("/", controller.CreatePreset)
			r.Get("/{id}", controller.GetPresetByID)
			r.Get("/workspace/{workspace_id}", controller.ListPresets)
			r.Get("/workspace/{workspace_id}/service/{service_id}", controller.ListServicePresets)
			r.Delete("/{id}", controller.DeletePreset)
			r.Put("/{id}", controller.UpdatePreset)
			r.Post("/set-default", controller.SetDefaultPreset)
			r.Get("/default/{workspace_id}", controller.GetDefaultPreset)
		})
	})
}

func RegisterVectorStoreRoutes(r chi.Router, controller controllers.VectorStoreController, authMiddleware middleware.AuthMiddleware) {
	r.Route("/vector-store", func(r chi.Router) {
		r.Group(func(r chi.Router) {
			r.Use(authMiddleware.VerifyToken)

			// File management for workspace vector stores
			r.Get("/{workspace_id}/files", controller.ListFiles)
			r.Post("/{workspace_id}/files", controller.UploadFile)
			r.Delete("/{workspace_id}/files/{file_id}", controller.DeleteFile)
			r.Post("/{workspace_id}/test-upload", controller.TestUpload)
		})
	})
}

func RegisterChatWithDataRoutes(r chi.Router, controller controllers.ChatWithDataController, authMiddleware middleware.AuthMiddleware) {
	r.Route("/ai", func(r chi.Router) {
		// Apply authentication middleware
		r.Use(authMiddleware.VerifyToken)

		// Chat endpoints
		r.Post("/chat-with-data", controller.StreamChatResponse)
		r.Get("/testimonial-stats/{workspaceId}", controller.GetTestimonialStats)

		// Conversation session management
		r.Get("/chat-with-data/sessions/{workspaceId}", controller.GetConversationHistory)
		r.Get("/chat-with-data/sessions/detail/{sessionId}", controller.GetConversationSession)
		r.Delete("/chat-with-data/sessions/{sessionId}", controller.DeactivateConversationSession)
		r.Get("/chat-with-data/follow-ups/{sessionId}", controller.GenerateFollowUpSuggestions)
	})
}

func RegisterAnalyticsRoutes(r chi.Router, controller controllers.AnalyticsController, authMiddleware middleware.AuthMiddleware) {
	r.Route("/ai/analytics", func(r chi.Router) {
		r.Use(authMiddleware.VerifyToken)

		// Analytics endpoints
		r.Get("/sentiment-timeline", controller.GetSentimentTimeline)
		r.Post("/compare-periods", controller.ComparePeriods)
		r.Get("/word-cloud", controller.GetWordCloud)
		r.Get("/feature-heatmap", controller.GetFeatureHeatmap)

		// Segment analysis endpoints
		r.Get("/segments/{workspaceId}", controller.ListSegments)
		r.Get("/segments/{segmentId}/analysis", controller.GetSegmentAnalysis)
		r.Post("/segments", controller.CreateSegment)
		r.Post("/segments/compare", controller.CompareSegments)

		// Export endpoint
		r.Get("/export", controller.ExportAnalytics)
	})
}

func RegisterStudioRoutes(r chi.Router, controller controllers.StudioController, authMiddleware middleware.AuthMiddleware) {
	r.Route("/studio", func(r chi.Router) {
		// SSE streaming endpoint (no auth middleware to avoid connection issues with EventSource API)
		// Must be OUTSIDE the authenticated group since EventSource can't send custom headers
		r.Get("/sessions/{sessionID}/stream", controller.StreamStudioEvents)

		// All other routes require authentication
		r.Group(func(r chi.Router) {
			r.Use(authMiddleware.VerifyToken)

			// Session creation endpoint
			r.Post("/sessions", controller.CreateSession)

			// Get active sessions endpoint (for session recovery)
			r.Get("/sessions", controller.GetActiveSessions)

			// Get completed sessions endpoint (for history)
			r.Get("/sessions/completed", controller.GetCompletedSessions)

			// Session status check endpoint
			r.Get("/sessions/{sessionID}/status", controller.GetSessionStatus)

			// Session control endpoints
			r.Post("/sessions/{sessionID}/pause", controller.PauseSession)
			r.Post("/sessions/{sessionID}/resume", controller.ResumeSession)

			// Stage control endpoints
			r.Post("/sessions/{sessionID}/stages/{stageID}/skip", controller.SkipStage)
			r.Post("/sessions/{sessionID}/stages/{stageID}/retry", controller.RetryStage)
			r.Post("/sessions/{sessionID}/stages/{stageID}/accept", controller.AcceptStage)
			r.Post("/sessions/{sessionID}/stages/{stageID}/save", controller.SaveStageResult)
			r.Post("/sessions/{sessionID}/stages/{stageID}/select-clips", controller.SelectClips)
			r.Post("/sessions/{sessionID}/stages/{stageID}/reorder-clips", controller.ReorderClips)

			// Artifact endpoints
			r.Get("/sessions/{sessionID}/artifacts", controller.GetSessionArtifacts)
			r.Post("/artifacts/{artifactID}/refresh-url", controller.RefreshPreviewURL)

			// Session lifecycle endpoints
			r.Post("/sessions/{sessionID}/cancel", controller.CancelSession)
			r.Post("/sessions/{sessionID}/finalize", controller.FinalizeSession)
			r.Post("/sessions/{sessionID}/save", controller.SaveSession)

			// Stage configuration endpoints
			r.Post("/sessions/{sessionID}/stages/{stageID}/config", controller.UpdateStageConfig)
			r.Post("/sessions/{sessionID}/stages/{stageID}/regenerate-text", controller.RegenerateTextOptimization)
		})
	})
}

func RegisterPublicShareRoutes(r chi.Router, controller controllers.PublicShareController, authMiddleware middleware.AuthMiddleware) {
	// Protected routes - authenticated workspace/user
	r.Route("/shares", func(r chi.Router) {
		r.Use(authMiddleware.VerifyToken)

		// Share management
		r.Post("/", controller.CreateShare)
		r.Get("/{id}", controller.GetShare)
		r.Put("/{id}", controller.UpdateShare)
		r.Delete("/{id}", controller.DeleteShare)

		// Metrics and analytics
		r.Get("/{id}/metrics", controller.GetMetrics)
		r.Get("/{id}/events", controller.GetEvents)
	})

	// Workspace shares
	r.Route("/workspaces/{workspaceId}/shares", func(r chi.Router) {
		r.Use(authMiddleware.VerifyToken)
		r.Get("/", controller.GetWorkspaceShares)
	})

	// Testimonial shares
	r.Route("/testimonials/{testimonialId}/shares", func(r chi.Router) {
		r.Use(authMiddleware.VerifyToken)
		r.Get("/", controller.GetTestimonialShares)
	})

	// Artifact shares
	r.Route("/artifacts/{artifactId}/shares", func(r chi.Router) {
		r.Use(authMiddleware.VerifyToken)
		r.Get("/", controller.GetArtifactShares)
	})

	// Export routes - authenticated
	r.Route("/export", func(r chi.Router) {
		r.Use(authMiddleware.VerifyToken)

		// GIF export
		r.Post("/gif", controller.ExportToGIF)
	})

	// Public viewing endpoints - no authentication
	r.Route("/share/{id}", func(r chi.Router) {
		// View shared content (public page)
		r.Get("/view", controller.GetShareWithContent)

		// Track events
		r.Post("/track", controller.TrackEvent)
	})
}

func RegisterAIPostRoutes(r chi.Router, controller controllers.AIPostController, authMiddleware middleware.AuthMiddleware) {
	r.Route("/testimonials/{id}/ai", func(r chi.Router) {
		r.Use(authMiddleware.VerifyToken)

		// Generate social media post suggestions
		r.Post("/generate-posts", controller.GeneratePostsForTestimonial)

		// Generate for specific platform
		r.Post("/generate-posts/{platform}", controller.GeneratePostForPlatform)

		// Generate variations for A/B testing
		r.Post("/generate-variations/{platform}", controller.GeneratePostVariations)

		// Stream LinkedIn post generation (real-time)
		r.Post("/stream-linkedin-post", controller.StreamLinkedInPost)
	})
}

func RegisterShareWidgetRoutes(r chi.Router, controller controllers.WidgetController) {
	// Widget config endpoint (public - no auth required)
	r.Get("/widget/config/{shareId}", controller.GetWidgetConfig)

	// IMPORTANT: Carousel route MUST come before {shareId} route to avoid path conflicts
	// Carousel embed code endpoint (public - no auth required)
	r.Get("/widget/embed/carousel", controller.GetCarouselEmbed)

	// Widget embed code endpoint (public - no auth required)
	r.Get("/widget/embed/{shareId}", controller.GetWidgetEmbed)
}

func RegisterApprovalRoutes(r chi.Router, controller controllers.ApprovalController, authMiddleware middleware.AuthMiddleware) {
	// Approval routes - workspace scoped
	r.Route("/workspaces/{workspaceID}/artifacts", func(r chi.Router) {
		r.Use(authMiddleware.VerifyToken)

		// Single artifact approval
		r.Post("/{artifactID}/approve", controller.ApproveArtifact)

		// Bulk approval
		r.Post("/bulk-approve", controller.BulkApproveArtifacts)

		// Get artifacts by status
		r.Get("/by-status", controller.GetArtifactsByStatus)
	})
}

func RegisterShowcaseRoutes(r chi.Router, controller controllers.ShowcaseController, authMiddleware middleware.AuthMiddleware) {
	// Protected showcase management routes
	r.Route("/workspaces/{workspaceID}/showcase-settings", func(r chi.Router) {
		r.Use(authMiddleware.VerifyToken)

		// Update showcase settings
		r.Put("/", controller.UpdateShowcaseSettings)
	})

	// Slug availability check (authenticated)
	r.Route("/showcase/check-slug", func(r chi.Router) {
		r.Use(authMiddleware.VerifyToken)
		r.Get("/", controller.CheckSlugAvailability)
	})

	// Public showcase page (no authentication required)
	r.Get("/public/showcase/{slug}", controller.GetPublicShowcase)
}
