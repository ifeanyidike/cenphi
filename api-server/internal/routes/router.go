// internal/routes/router.go
package routes

import (
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
	socialController controllers.SocialController,
	aiTestController controllers.AITestController,

	testimonialRequestController controllers.TestimonialRequestController,
	testimonialCollectionController controllers.TestimonialCollectionController,
	sseTestimonialMonitor controllers.SSETestimonialMonitor,
	googleDriveController controllers.GoogleDriveController,
	aiProcessorController controllers.AIProcessorController,
	presetController controllers.PresetController,
	testController controllers.TestController,
	rateLimiter middleware.RateLimiter,
) {

	RegisterWidget(&r)

	// Group all API routes under /api
	r.Route("/api", func(r chi.Router) {
		RegisterMetrics(&r)
		// RegisterAITestRoutes(r, aiTestController, rateLimiter)
		RegisterHealthRoutes(r, healthController)
		RegisterUserRoutes(r, userController, authMiddleware)
		RegisterSwaggerRoute(r, swaggerController)
		RegisterWorkspaceRoutes(r, workspaceController, authMiddleware)
		RegisterTeamMemberRoutes(r, teamMemberController, authMiddleware)
		RegisterOnboardingRoutes(r, onboardingController, authMiddleware)
		RegisterTestimonialRoutes(r, testimonialController, authMiddleware)
		RegisterSocialRoutes(r, socialController, authMiddleware)
		RegisterTestimonialRequestRoutes(r, testimonialRequestController, authMiddleware)
		RegisterTestimonialCollectionRoutes(r, testimonialCollectionController, authMiddleware)
		RegisterSSETestimonialMonitorRoutes(r, sseTestimonialMonitor, authMiddleware)
		RegisterGoogleDriveRoutes(r, googleDriveController, authMiddleware)
		RegisterAIProcessorRoutes(r, aiProcessorController, rateLimiter, authMiddleware)
		RegisterPresetRoutes(r, presetController, authMiddleware)
		RegisterTestRoutes(r, testController)

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
}

func RegisterHealthRoutes(r chi.Router, healthController controllers.HealthController) {
	r.Get("/health", healthController.HealthCheck)
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

func RegisterTestimonialRoutes(r chi.Router, controller controllers.TestimonialController, authMiddleware middleware.AuthMiddleware) {
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

			// Upload endpoint
			//r.Post("/upload", controller.HandleTestimonialUpload)
		})
	})
}

// func RegisterAITestRoutes(r chi.Router, controller controllers.AITestController, rateLimiter middleware.RateLimiter) {
// 	// controller := controllers.NewAITestController(aiClient, logger)

// 	r.Group(func(r chi.Router) {
// 		r.Use(rateLimiter.AIGenerationMiddleware())

// 		r.Post("/brand-context", controller.ExtractBrandContext) // brand_context
// 		r.Post("/transcribe", controller.TranscribeAudio)        // transcription
// 		r.Post("/translate", controller.TranslateText)           // translation
// 		r.Post("/sentiment", controller.AnalyzeSentiment)        // sentiment
// 		r.Post("/highlights", controller.ExtractHighlights)      // highlight
// 		r.Post("/fillers", controller.DetectFillers)             // filler
// 		r.Post("/polish", controller.PolishText)                 // polish
// 		r.Post("/generate-content", controller.GenerateContent)  // generation
// 		// r.Post("/analyze-emotion", controller.AnalyzeEmotion)    // emotion
// 	})

// 	// GPU-intensive AI operations (10/hour per user)
// 	r.Group(func(r chi.Router) {
// 		r.Use(rateLimiter.AIGPUMiddleware())

// 		r.Post("/optimize-platform", controller.OptimizeForPlatform) // optimizer
// 		r.Post("/enhance-media", controller.EnhanceMedia)            // enhancement
// 		r.Post("/generate-narration", controller.GenerateNarration)  // narration
// 		r.Post("/smart-clips", controller.GenerateSmartClips)        // clipping
// 		r.Post("/analyze-emotions", controller.AnalyzeEmotion)       // emotions
// 		r.Post("/select-thumbnail", controller.SelectThumbnail)      // emotions
// 		r.Post("/story-video", controller.GenerateStoryVideo)        // emotions
// 	})

// 	// Job management routes - use regular API rate limiting
// 	r.Route("/jobs", func(r chi.Router) {
// 		r.Use(rateLimiter.APIMiddleware()) // 100/minute

// 		r.Get("/{jobID}/status", controller.GetJobStatus)
// 		r.Get("/status", controller.GetBulkJobStatus)
// 		r.Get("/cancel/{jobID}", controller.CancelJob)

// 		r.Get("/stream", controller.StreamJobStatus)
// 		r.Options("/stream", controller.HandleStreamingOptions) // CORS support
// 	})
// }

func RegisterSocialRoutes(r chi.Router, controller controllers.SocialController, authMiddleware middleware.AuthMiddleware) {
	// Public OAuth callback endpoint (no auth required)
	r.Get("/social/oauth/callback", controller.HandleOAuthCallback)

	// Protected social media routes
	r.Route("/social/workspaces/{workspaceID}/social", func(r chi.Router) {
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
	r.Route("/social/workspaces/{workspaceID}/ai", func(r chi.Router) {
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

	r.Route("/collection/workspaces/{workspaceID}/testimonials", func(r chi.Router) {
		// Main collection endpoints - support both text and video
		r.Post("/widget", tcc.CollectFromWidget) // JSON for text, multipart for video
		r.Post("/form", tcc.CollectFromForm)     // JSON for text, multipart for video

		r.Group(func(r chi.Router) {
			// r.Use(authMiddleware.VerifyToken)
			r.Post("/upload/video", tcc.UploadVideo) // Direct video upload
			r.Post("/upload/csv", tcc.UploadCSV)
			r.Post("/upload/excel", tcc.UploadXLS)
			r.Post("/import/google-drive", tcc.ImportFromGoogleDrive)
			r.Post("/request", tcc.SendTestimonialRequest)
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
		r.Post("/ai/polish", controller.PolishText)                          // polish
		r.Post("/ai/generate-content", controller.GenerateContent)           // generation
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
