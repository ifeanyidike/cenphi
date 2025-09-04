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
	socialController *controllers.SocialController,
	aiTestController controllers.AITestController,

	testimonialRequestController controllers.TestimonialRequestController,
	testimonialCollectionController controllers.TestimonialCollectionController,
	sseTestimonialMonitor controllers.SSETestimonialMonitor,
	googleDriveController controllers.GoogleDriveController,
	aiProcessorController controllers.AIProcessorController,
	testController controllers.TestController,
	rateLimiter middleware.RateLimiter,
) {

	RegisterWidget(&r)

	// Group all API routes under /api
	r.Route("/api", func(r chi.Router) {
		RegisterMetrics(&r)
		RegisterAITestRoutes(r, aiTestController, rateLimiter)
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

		r.Route("/{workspaceID}/testimonials", func(r chi.Router) {
			r.Get("/", controller.GetTestimonialsByWorkspaceID)
			r.Get("/{testimonialID}", controller.GetTestimonial)
		})
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
	r.Route("/onboard", func(r chi.Router) {
		r.Group(func(r chi.Router) {
			r.Use(authMiddleware.VerifyToken)
			r.Post("/", controller.OnboardOwner)
			r.Post("/partial", controller.OnboardOwner)
		})
	})
}

func RegisterTestimonialRoutes(r chi.Router, controller controllers.TestimonialController, authMiddleware middleware.AuthMiddleware) {
	r.Route("/testimonials", func(r chi.Router) {
		r.Group(func(r chi.Router) {
			// r.Use(authMiddleware.VerifyToken) // commented out for test

			// Basic CRUD
			r.Get("/{id}", controller.GetTestimonial)
			r.Get("/workspace/{workspaceID}", controller.GetTestimonials)
			r.Put("/{id}", controller.UpdateTestimonial)
			r.Delete("/{id}", controller.DeleteTestimonial)

			// Search and analytics
			r.Post("/search", controller.SearchTestimonials)
			r.Get("/workspace/{workspaceID}/stats", controller.GetTestimonialStats)

			// Upload endpoint
			//r.Post("/upload", controller.HandleTestimonialUpload)
		})
	})
}

func RegisterAITestRoutes(r chi.Router, controller controllers.AITestController, rateLimiter middleware.RateLimiter) {
	// controller := controllers.NewAITestController(aiClient, logger)

	r.Group(func(r chi.Router) {
		r.Use(rateLimiter.AIGenerationMiddleware())

		r.Post("/brand-context", controller.ExtractBrandContext) // brand_context
		r.Post("/transcribe", controller.TranscribeAudio)        // transcription
		r.Post("/translate", controller.TranslateText)           // translation
		r.Post("/sentiment", controller.AnalyzeSentiment)        // sentiment
		r.Post("/highlights", controller.ExtractHighlights)      // highlight
		r.Post("/fillers", controller.DetectFillers)             // filler
		r.Post("/polish", controller.PolishText)                 // polish
		r.Post("/generate-content", controller.GenerateContent)  // generation
		// r.Post("/analyze-emotion", controller.AnalyzeEmotion)    // emotion
	})

	// GPU-intensive AI operations (10/hour per user)
	r.Group(func(r chi.Router) {
		r.Use(rateLimiter.AIGPUMiddleware())

		r.Post("/optimize-platform", controller.OptimizeForPlatform) // optimizer
		r.Post("/enhance-media", controller.EnhanceMedia)            // enhancement
		r.Post("/generate-narration", controller.GenerateNarration)  // narration
		r.Post("/smart-clips", controller.GenerateSmartClips)        // clipping
		r.Post("/analyze-emotions", controller.AnalyzeEmotion)       // emotions
		r.Post("/select-thumbnail", controller.SelectThumbnail)      // emotions
		r.Post("/story-video", controller.GenerateStoryVideo)        // emotions
	})

	// Job management routes - use regular API rate limiting
	r.Route("/jobs", func(r chi.Router) {
		r.Use(rateLimiter.APIMiddleware()) // 100/minute

		r.Get("/{jobID}/status", controller.GetJobStatus)
		r.Get("/status", controller.GetBulkJobStatus)
		r.Get("/cancel/{jobID}", controller.CancelJob)

		r.Get("/stream", controller.StreamJobStatus)
		r.Options("/stream", controller.HandleStreamingOptions) // CORS support
	})
}

func RegisterSocialRoutes(r chi.Router, controller *controllers.SocialController, authMiddleware middleware.AuthMiddleware) {
	// Public OAuth callback endpoint (no auth required)
	r.Get("/social/oauth/callback", controller.HandleOAuthCallback)

	// Protected social media routes
	r.Route("/workspaces/{workspaceID}/social", func(r chi.Router) {
		// r.Use(authMiddleware.VerifyToken) //commented out for test

		// OAuth authorization endpoints
		r.Get("/auth/{platform}", controller.GetAuthURL)

		// Account management
		r.Get("/accounts", controller.GetAccounts)

		// Platform-specific post creation
		r.Post("/{platform}/posts", controller.CreatePost)

		// General posts endpoint for workspace
		r.Get("/posts", controller.GetPosts)
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

	r.Route("/workspaces/{workspaceID}/testimonials", func(r chi.Router) {
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

		// OAuth management
		r.Route("/workspaces/{workspaceID}/drive", func(r chi.Router) {
			r.Use(authMiddleware.VerifyToken)
			r.Get("/auth", controller.GetAuthURL)
			r.Get("/status", controller.CheckConnectionStatus)
			r.Get("/files", controller.ListFiles)
			r.Get("/testimonial-files", controller.ListTestimonialFiles)
		})
	})
}

func RegisterAIProcessorRoutes(r chi.Router, controller controllers.AIProcessorController, rateLimiter middleware.RateLimiter, authMiddleware middleware.AuthMiddleware) {
	// controller := controllers.NewAITestController(aiClient, logger)

	r.Group(func(r chi.Router) {
		// r.Use(authMiddleware.VerifyToken) commented to allow for tests for now.
		r.Use(rateLimiter.AIGenerationMiddleware())

		r.Post("/processor/transcribe", controller.TranscribeAudio)       // transcription
		r.Post("/processor/translate", controller.TranslateText)          // translation
		r.Post("/processor/sentiment", controller.AnalyzeSentiment)       // sentiment
		r.Post("/processor/highlights", controller.ExtractHighlights)     // highlight
		r.Post("/processor/polish", controller.PolishText)                // polish
		r.Post("/processor/generate-content", controller.GenerateContent) // generation
	})

	// GPU-intensive AI operations (10/hour per user)
	r.Group(func(r chi.Router) {
		r.Use(rateLimiter.AIGPUMiddleware())

		r.Post("/processor/optimize-platform", controller.OptimizeForPlatform) // optimizer
		r.Post("/processor/enhance-media", controller.EnhanceMedia)            // enhancement
		r.Post("/processor/generate-narration", controller.GenerateNarration)  // narration
		r.Post("/processor/smart-clips", controller.GenerateSmartClips)        // clipping
		r.Post("/processor/story-video", controller.GenerateStoryVideo)        // emotions
	})

	// Job management routes - use regular API rate limiting
	r.Route("/processor/jobs", func(r chi.Router) {
		r.Use(rateLimiter.APIMiddleware()) // 100/minute

		r.Get("/{jobID}/status", controller.GetJobStatus)
		r.Get("/status", controller.GetBulkJobStatus)
		r.Get("/cancel/{jobID}", controller.CancelJob)

		r.Get("/stream", controller.StreamJobStatus)
		r.Options("/stream", controller.HandleStreamingOptions) // CORS support
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
