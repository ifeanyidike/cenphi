// // internal/services/websocket_hub.go
package services

// import (
// 	"context"
// 	"encoding/base64"
// 	"encoding/json"
// 	"fmt"
// 	"log"
// 	"sync"
// 	"time"

// 	"github.com/google/uuid"
// 	"github.com/gorilla/websocket"
// 	"github.com/ifeanyidike/cenphi/internal/ai"
// 	"github.com/ifeanyidike/cenphi/internal/models"
// 	"github.com/ifeanyidike/cenphi/pb"
// 	"go.uber.org/zap"
// )

// // Constants for WebSocket configuration
// const (
// 	writeWait        = 10 * time.Second    // Time allowed to write a message to the peer
// 	pongWait         = 60 * time.Second    // Time allowed to read the next pong message from the peer
// 	pingPeriod       = (pongWait * 9) / 10 // Send pings to peer with this period
// 	maxMessageSize   = 512 * 1024          // 512KB
// 	sessionTimeout   = 30 * time.Minute    // Session cleanup timeout
// 	clientBufferSize = 256                 // WSClient send channel buffer size
// )

// // Message types
// type MessageType string

// const (
// 	MsgTypeTranscript        MessageType = "transcript"
// 	MsgTypeNextQuestion      MessageType = "next_question"
// 	MsgTypeInterviewComplete MessageType = "interview_complete"
// 	MsgTypeSessionStatus     MessageType = "session_status"
// 	MsgTypeError             MessageType = "error"
// 	MsgTypeHeartbeat         MessageType = "heartbeat"
// )

// // Session states
// type SessionState string

// const (
// 	SessionStateWaiting    SessionState = "waiting"
// 	SessionStateActive     SessionState = "active"
// 	SessionStateProcessing SessionState = "processing"
// 	SessionStateCompleted  SessionState = "completed"
// 	SessionStateError      SessionState = "error"
// )

// // WSHub maintains active connections and broadcasts messages to them
// type WSHub struct {
// 	// WSClient management
// 	clients    map[*WSClient]bool
// 	register   chan *WSClient
// 	unregister chan *WSClient
// 	broadcast  chan []byte

// 	// Session management
// 	sessions map[string]*Session
// 	mu       sync.RWMutex

// 	// Dependencies
// 	logger              *zap.Logger
// 	aiClient            ai.Intelligence
// 	testimonialService  TestimonialService
// 	campaignService     CampaignService
// 	brandContextService BrandContextService

// 	// Control
// 	done chan struct{}
// }

// // WSClient represents a WebSocket client connection
// type WSClient struct {
// 	// Connection details
// 	conn      *websocket.Conn
// 	sessionID string
// 	send      chan []byte
// 	hub       *WSHub

// 	// WSClient state
// 	mu      sync.RWMutex
// 	closed  bool
// 	closing bool

// 	// Handlers
// 	onMessage func([]byte)
// }

// // Session represents an interview session with comprehensive state management
// type Session struct {
// 	// Basic session info
// 	ID         string       `json:"id"`
// 	CampaignID string       `json:"campaign_id"`
// 	State      SessionState `json:"state"`
// 	CreatedAt  time.Time    `json:"created_at"`
// 	UpdatedAt  time.Time    `json:"updated_at"`

// 	// Campaign and context data
// 	Campaign     *models.Campaign     `json:"campaign,omitempty"`
// 	BrandContext *models.BrandContext `json:"brand_context,omitempty"`

// 	// Interview flow
// 	Questions            []QuestionContext `json:"questions"`
// 	CurrentQuestionIndex int               `json:"current_question_index"`
// 	MaxQuestions         int               `json:"max_questions"`
// 	Responses            []string          `json:"responses"`

// 	// Media and transcription
// 	MediaType         string                 `json:"media_type,omitempty"`
// 	MediaChunks       []MediaChunk           `json:"media_chunks,omitempty"`
// 	CurrentTranscript string                 `json:"current_transcript,omitempty"`
// 	AudioBuffer       [][]byte               `json:"-"`
// 	AuthorInfo        map[string]interface{} `json:"author_info,omitempty"`

// 	// AI integration
// 	transcriptionStream pb.IntelligenceService_StreamTranscriptionClient `json:"-"`
// 	ProcessingStatus    string                                           `json:"processing_status"`

// 	// WSClient management
// 	clients      map[*WSClient]bool
// 	clientsMutex sync.RWMutex

// 	// Session management
// 	mu               sync.RWMutex `json:"-"`
// 	lastActivityTime time.Time    `json:"-"`
// 	cleanupTimer     *time.Timer  `json:"-"`
// 	hub              *WSHub       `json:"-"`
// }

// // QuestionContext holds context about a question
// type QuestionContext struct {
// 	ID         string     `json:"id"`
// 	Text       string     `json:"text"`
// 	Category   string     `json:"category"`
// 	AskedAt    time.Time  `json:"asked_at"`
// 	AnsweredAt *time.Time `json:"answered_at,omitempty"`
// 	Response   string     `json:"response,omitempty"`
// 	Transcript string     `json:"transcript,omitempty"`
// 	Duration   float64    `json:"duration,omitempty"`
// }

// // MediaChunk represents a chunk of media data
// type MediaChunk struct {
// 	ID        string    `json:"id"`
// 	Data      []byte    `json:"data"`
// 	Timestamp time.Time `json:"timestamp"`
// 	IsLast    bool      `json:"is_last"`
// 	MimeType  string    `json:"mime_type"`
// }

// // WSMessage represents a WebSocket message
// type WSMessage struct {
// 	Type      MessageType            `json:"type"`
// 	SessionID string                 `json:"session_id"`
// 	Data      map[string]interface{} `json:"data"`
// 	Timestamp int64                  `json:"timestamp"`
// 	Error     string                 `json:"error,omitempty"`
// }

// // NewHub creates a new WebSocket hub
// func NewWSHub(
// 	logger *zap.Logger,
// 	aiClient ai.Intelligence,
// 	testimonialService TestimonialService,
// 	campaignService CampaignService,
// 	brandContextService BrandContextService,
// ) *WSHub {
// 	return &WSHub{
// 		clients:             make(map[*WSClient]bool),
// 		register:            make(chan *WSClient),
// 		unregister:          make(chan *WSClient),
// 		broadcast:           make(chan []byte),
// 		sessions:            make(map[string]*Session),
// 		logger:              logger,
// 		aiClient:            aiClient,
// 		testimonialService:  testimonialService,
// 		campaignService:     campaignService,
// 		brandContextService: brandContextService,
// 		done:                make(chan struct{}),
// 	}
// }

// // Run starts the hub's main loop
// func (h *WSHub) Run() {
// 	defer func() {
// 		h.logger.Info("WebSocket hub shutting down")
// 		h.cleanupAllSessions()
// 	}()

// 	h.logger.Info("WebSocket hub starting")

// 	for {
// 		select {
// 		case client := <-h.register:
// 			h.registerClient(client)

// 		case client := <-h.unregister:
// 			h.unregisterClient(client)

// 		case message := <-h.broadcast:
// 			h.broadcastMessage(message)

// 		case <-h.done:
// 			h.logger.Info("WSHub received shutdown signal")
// 			return
// 		}
// 	}
// }

// // Stop gracefully stops the hub
// func (h *WSHub) Stop() {
// 	close(h.done)
// }

// // registerClient registers a new client
// func (h *WSHub) registerClient(client *WSClient) {
// 	h.mu.Lock()
// 	h.clients[client] = true

// 	// Add client to session if it exists
// 	if session, exists := h.sessions[client.sessionID]; exists {
// 		session.AddClient(client)
// 	}
// 	h.mu.Unlock()

// 	h.logger.Info("WSClient registered",
// 		zap.String("sessionID", client.sessionID),
// 		zap.Int("totalClients", len(h.clients)))

// 	// Send session status to newly connected client
// 	if session, exists := h.GetSession(client.sessionID); exists {
// 		h.sendSessionStatus(client, session)
// 	}
// }

// // unregisterClient unregisters a client
// func (h *WSHub) unregisterClient(client *WSClient) {
// 	h.mu.Lock()
// 	if _, ok := h.clients[client]; ok {
// 		delete(h.clients, client)
// 		close(client.send)

// 		// Remove client from session
// 		if session, exists := h.sessions[client.sessionID]; exists {
// 			session.RemoveClient(client)

// 			// If session has no more clients, consider cleanup
// 			if session.Count() == 0 {
// 				h.scheduleSessionCleanup(session)
// 			}
// 		}
// 	}
// 	h.mu.Unlock()

// 	h.logger.Info("WSClient unregistered", zap.String("sessionID", client.sessionID))
// }

// // broadcastMessage broadcasts a message to all clients
// func (h *WSHub) broadcastMessage(message []byte) {
// 	h.mu.RLock()
// 	clients := make([]*WSClient, 0, len(h.clients))
// 	for client := range h.clients {
// 		clients = append(clients, client)
// 	}
// 	h.mu.RUnlock()

// 	for _, client := range clients {
// 		select {
// 		case client.send <- message:
// 		default:
// 			// WSClient's send channel is full, remove it
// 			go h.unregisterClient(client)
// 		}
// 	}
// }

// // CreateSession creates a new interview session
// func (h *WSHub) CreateSession(campaignID string) (*Session, error) {
// 	h.mu.Lock()
// 	defer h.mu.Unlock()

// 	sessionID := uuid.New().String()

// 	// Load campaign and brand context
// 	campaignUUID, err := uuid.Parse(campaignID)
// 	if err != nil {
// 		return nil, fmt.Errorf("invalid campaign ID: %w", err)
// 	}

// 	campaign, err := h.campaignService.GetCampaignByID(context.Background(), campaignUUID)
// 	if err != nil {
// 		return nil, fmt.Errorf("failed to load campaign: %w", err)
// 	}

// 	var brandContext *models.BrandContext
// 	if campaign.BrandContextID != nil {
// 		brandContext, err = h.brandContextService.GetBrandContextByID(context.Background(), *campaign.BrandContextID)
// 		if err != nil {
// 			h.logger.Warn("Failed to load brand context", zap.Error(err))
// 		}
// 	}

// 	session := &Session{
// 		ID:                   sessionID,
// 		CampaignID:           campaignID,
// 		Campaign:             campaign,
// 		BrandContext:         brandContext,
// 		State:                SessionStateWaiting,
// 		CreatedAt:            time.Now(),
// 		UpdatedAt:            time.Now(),
// 		CurrentQuestionIndex: 0,
// 		Questions:            h.convertCampaignQuestions(campaign.Questions),
// 		Responses:            make([]string, 0),
// 		MediaChunks:          make([]MediaChunk, 0),
// 		ProcessingStatus:     "ready",
// 		AudioBuffer:          make([][]byte, 0),
// 		clients:              make(map[*WSClient]bool),
// 		lastActivityTime:     time.Now(),
// 		hub:                  h,
// 	}

// 	session.MaxQuestions = len(session.Questions)
// 	if session.MaxQuestions == 0 {
// 		session.MaxQuestions = 5 // Default fallback
// 	}

// 	h.sessions[sessionID] = session

// 	// Initialize AI transcription stream
// 	go h.initializeTranscriptionStream(session)

// 	// Setup session cleanup timer
// 	session.setupCleanupTimer()

// 	h.logger.Info("Session created",
// 		zap.String("sessionID", sessionID),
// 		zap.String("campaignID", campaignID),
// 		zap.Int("questionCount", len(session.Questions)),
// 		zap.Bool("hasBrandContext", brandContext != nil))

// 	return session, nil
// }

// // GetSession retrieves a session by ID
// func (h *WSHub) GetSession(sessionID string) (*Session, bool) {
// 	h.mu.RLock()
// 	defer h.mu.RUnlock()

// 	session, ok := h.sessions[sessionID]
// 	return session, ok
// }

// // RegisterSession registers a session
// func (h *WSHub) RegisterSession(sessionID string, session *Session) {
// 	h.mu.Lock()
// 	defer h.mu.Unlock()
// 	h.sessions[sessionID] = session
// }

// // UnregisterSession unregisters a session
// func (h *WSHub) UnregisterSession(sessionID string) {
// 	h.cleanupSession(sessionID)
// }

// // BroadcastToSession broadcasts a message to all clients in a specific session
// func (h *WSHub) BroadcastToSession(sessionID string, message WSMessage) {
// 	h.mu.RLock()
// 	session, ok := h.sessions[sessionID]
// 	h.mu.RUnlock()

// 	if !ok {
// 		h.logger.Warn("Attempted to broadcast to non-existent session", zap.String("sessionID", sessionID))
// 		return
// 	}

// 	data, err := json.Marshal(message)
// 	if err != nil {
// 		h.logger.Error("Failed to marshal message", zap.Error(err))
// 		return
// 	}

// 	session.BroadcastMessage(data)
// }

// // NewClient creates a new WebSocket client
// func (h *WSHub) NewClient(conn *websocket.Conn, sessionID string, onMessage func([]byte)) *WSClient {
// 	client := &WSClient{
// 		conn:      conn,
// 		sessionID: sessionID,
// 		send:      make(chan []byte, clientBufferSize),
// 		hub:       h,
// 		onMessage: onMessage,
// 		closed:    false,
// 		closing:   false,
// 	}

// 	return client
// }

// // sendSessionStatus sends session status to a specific client
// func (h *WSHub) sendSessionStatus(client *WSClient, session *Session) {
// 	sessionData, err := session.ToJSON()
// 	if err != nil {
// 		h.logger.Error("Failed to serialize session", zap.Error(err))
// 		return
// 	}

// 	var sessionMap map[string]interface{}
// 	if err := json.Unmarshal(sessionData, &sessionMap); err != nil {
// 		h.logger.Error("Failed to unmarshal session data", zap.Error(err))
// 		return
// 	}

// 	msg := WSMessage{
// 		Type:      MsgTypeSessionStatus,
// 		SessionID: session.ID,
// 		Data:      sessionMap,
// 		Timestamp: time.Now().UnixNano() / int64(time.Millisecond),
// 	}

// 	data, err := json.Marshal(msg)
// 	if err != nil {
// 		h.logger.Error("Failed to marshal session status", zap.Error(err))
// 		return
// 	}

// 	select {
// 	case client.send <- data:
// 	default:
// 		h.logger.Warn("Failed to send session status - client channel full", zap.String("sessionID", client.sessionID))
// 	}
// }

// // scheduleSessionCleanup schedules cleanup for empty sessions
// func (h *WSHub) scheduleSessionCleanup(session *Session) {
// 	// If session is already completed or has an active cleanup timer, don't schedule another
// 	if session.State == SessionStateCompleted || session.cleanupTimer != nil {
// 		return
// 	}

// 	// Schedule cleanup after a short delay to allow reconnections
// 	time.AfterFunc(5*time.Minute, func() {
// 		if session.Count() == 0 {
// 			h.cleanupSession(session.ID)
// 		}
// 	})
// }

// // cleanupSession removes and cleans up a session
// func (h *WSHub) cleanupSession(sessionID string) {
// 	h.mu.Lock()
// 	session, exists := h.sessions[sessionID]
// 	if exists {
// 		delete(h.sessions, sessionID)
// 	}
// 	h.mu.Unlock()

// 	if exists {
// 		session.Cleanup()
// 		h.logger.Info("Session cleaned up", zap.String("sessionID", sessionID))
// 	}
// }

// // cleanupAllSessions cleans up all sessions during shutdown
// func (h *WSHub) cleanupAllSessions() {
// 	h.mu.Lock()
// 	sessions := make([]*Session, 0, len(h.sessions))
// 	for _, session := range h.sessions {
// 		sessions = append(sessions, session)
// 	}
// 	// Clear the sessions map
// 	h.sessions = make(map[string]*Session)
// 	h.mu.Unlock()

// 	// Cleanup sessions outside the lock
// 	for _, session := range sessions {
// 		session.Cleanup()
// 	}

// 	h.logger.Info("All sessions cleaned up", zap.Int("count", len(sessions)))
// }

// // initializeTranscriptionStream sets up AI transcription for a session
// func (h *WSHub) initializeTranscriptionStream(session *Session) {
// 	ctx := context.Background()

// 	stream, err := h.aiClient.StreamTranscription(ctx)
// 	if err != nil {
// 		h.logger.Error("Failed to initialize transcription stream",
// 			zap.String("sessionID", session.ID),
// 			zap.Error(err))
// 		return
// 	}

// 	session.mu.Lock()
// 	session.transcriptionStream = stream
// 	session.mu.Unlock()

// 	// Start listening for transcription results
// 	go h.listenToTranscriptionResults(session, stream)

// 	h.logger.Info("Transcription stream initialized", zap.String("sessionID", session.ID))
// }

// // listenToTranscriptionResults processes AI transcription results
// func (h *WSHub) listenToTranscriptionResults(session *Session, stream pb.IntelligenceService_StreamTranscriptionClient) {
// 	defer func() {
// 		if stream != nil {
// 			stream.CloseSend()
// 		}
// 	}()

// 	for {
// 		result, err := stream.Recv()
// 		if err != nil {
// 			h.logger.Error("Error receiving transcription result",
// 				zap.String("sessionID", session.ID),
// 				zap.Error(err))
// 			break
// 		}

// 		h.handleTranscriptionResult(session, result)
// 	}
// }

// // handleTranscriptionResult processes a transcription result
// func (h *WSHub) handleTranscriptionResult(session *Session, result *pb.TranscriptionResult) {
// 	session.mu.Lock()
// 	session.CurrentTranscript = result.Text
// 	session.lastActivityTime = time.Now()
// 	session.mu.Unlock()

// 	// Send transcript update to client
// 	msg := WSMessage{
// 		Type:      MsgTypeTranscript,
// 		SessionID: session.ID,
// 		Data: map[string]interface{}{
// 			"text":       result.Text,
// 			"confidence": result.Confidence,
// 			"isPartial":  result.IsPartial,
// 			"timestamp":  result.Timestamp,
// 		},
// 		Timestamp: time.Now().UnixNano() / int64(time.Millisecond),
// 	}

// 	h.BroadcastToSession(session.ID, msg)

// 	// Handle completion if not partial and confidence is high
// 	if !result.IsPartial && result.Confidence > 0.8 {
// 		go h.handleQuestionResponse(session, result.Text)
// 	}
// }

// // handleQuestionResponse processes a completed response
// func (h *WSHub) handleQuestionResponse(session *Session, transcript string) {
// 	session.mu.Lock()
// 	session.Responses = append(session.Responses, transcript)
// 	currentIndex := session.CurrentQuestionIndex
// 	session.ProcessingStatus = "processing"
// 	session.mu.Unlock()

// 	h.logger.Info("Processing question response",
// 		zap.String("sessionID", session.ID),
// 		zap.Int("questionIndex", currentIndex),
// 		zap.String("transcript", transcript))

// 	// Generate next question using AI if not at the end
// 	if currentIndex < len(session.Questions)-1 {
// 		go h.generateNextQuestion(session, transcript, currentIndex+1)
// 	} else {
// 		// Interview complete
// 		go h.handleInterviewComplete(session)
// 	}
// }

// // generateNextQuestion uses AI to generate the next question
// func (h *WSHub) generateNextQuestion(session *Session, transcript string, nextIndex int) {
// 	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
// 	defer cancel()

// 	// Prepare request for AI question generation
// 	req := &ai.QuestionGenerationRequest{
// 		PartialTranscript: transcript,
// 		BrandContext:      session.BrandContext,
// 		PreviousQuestions: h.getPreviousQuestions(session, nextIndex),
// 		InterviewStage:    h.getInterviewStage(nextIndex, len(session.Questions)),
// 	}

// 	response, err := h.aiClient.GenerateQuestions(ctx, req)
// 	if err != nil {
// 		h.logger.Error("Failed to generate next question",
// 			zap.String("sessionID", session.ID),
// 			zap.Error(err))
// 		// Fall back to default question
// 		h.useDefaultNextQuestion(session, nextIndex)
// 		return
// 	}

// 	if response.ErrorMessage != "" {
// 		h.logger.Error("AI service returned error for question generation",
// 			zap.String("sessionID", session.ID),
// 			zap.String("error", response.ErrorMessage))
// 		h.useDefaultNextQuestion(session, nextIndex)
// 		return
// 	}

// 	// Use AI-generated question if available
// 	var nextQuestionText string
// 	if len(response.SuggestedQuestions) > 0 {
// 		nextQuestionText = response.SuggestedQuestions[0]
// 	} else if response.RecommendedQuestion != "" {
// 		nextQuestionText = response.RecommendedQuestion
// 	} else {
// 		h.useDefaultNextQuestion(session, nextIndex)
// 		return
// 	}

// 	// Update session with next question
// 	session.mu.Lock()
// 	session.CurrentQuestionIndex = nextIndex
// 	if nextIndex < len(session.Questions) {
// 		session.Questions[nextIndex].Text = nextQuestionText
// 	}
// 	session.ProcessingStatus = "ready"
// 	session.mu.Unlock()

// 	// Send next question to client
// 	msg := WSMessage{
// 		Type:      MsgTypeNextQuestion,
// 		SessionID: session.ID,
// 		Data: map[string]interface{}{
// 			"question":      nextQuestionText,
// 			"progress":      float64(nextIndex) / float64(len(session.Questions)),
// 			"questionIndex": nextIndex,
// 			"confidence":    response.ConfidenceScore,
// 		},
// 		Timestamp: time.Now().UnixNano() / int64(time.Millisecond),
// 	}

// 	h.BroadcastToSession(session.ID, msg)

// 	h.logger.Info("Next question generated and sent",
// 		zap.String("sessionID", session.ID),
// 		zap.Int("questionIndex", nextIndex),
// 		zap.String("question", nextQuestionText))
// }

// // useDefaultNextQuestion falls back to default question
// func (h *WSHub) useDefaultNextQuestion(session *Session, nextIndex int) {
// 	session.mu.Lock()
// 	session.CurrentQuestionIndex = nextIndex
// 	session.ProcessingStatus = "ready"

// 	var questionText string
// 	if nextIndex < len(session.Questions) {
// 		questionText = session.Questions[nextIndex].Text
// 	} else {
// 		questionText = "Is there anything else you'd like to share?"
// 	}
// 	session.mu.Unlock()

// 	msg := WSMessage{
// 		Type:      MsgTypeNextQuestion,
// 		SessionID: session.ID,
// 		Data: map[string]interface{}{
// 			"question":      questionText,
// 			"progress":      float64(nextIndex) / float64(len(session.Questions)),
// 			"questionIndex": nextIndex,
// 		},
// 		Timestamp: time.Now().UnixNano() / int64(time.Millisecond),
// 	}

// 	h.BroadcastToSession(session.ID, msg)
// }

// // handleInterviewComplete processes interview completion
// func (h *WSHub) handleInterviewComplete(session *Session) {
// 	ctx := context.Background()

// 	h.logger.Info("Interview completed", zap.String("sessionID", session.ID))

// 	// Create testimonial in database
// 	testimonial := &models.Testimonial{
// 		ID:               uuid.New(),
// 		WorkspaceID:      session.Campaign.WorkspaceID,
// 		CampaignID:       &session.Campaign.ID,
// 		Type:             session.getMediaType(),
// 		Format:           h.getFormatFromMediaType(session.MediaType),
// 		Status:           "processing",
// 		Transcript:       &session.CurrentTranscript,
// 		Language:         "en",
// 		CollectionMethod: stringPtr("widget"),
// 		CollectionDate:   &session.CreatedAt,
// 		ProcessingStatus: "pending",
// 		Metadata: models.JSONMap{
// 			"session_id":      session.ID,
// 			"campaign_id":     session.CampaignID,
// 			"questions_count": len(session.Questions),
// 			"responses_count": len(session.Responses),
// 		},
// 		CreatedAt: time.Now(),
// 		UpdatedAt: time.Now(),
// 	}

// 	// Extract author info from session
// 	if session.AuthorInfo != nil {
// 		if name, ok := session.AuthorInfo["name"].(string); ok {
// 			testimonial.AuthorName = &name
// 		}
// 		if email, ok := session.AuthorInfo["email"].(string); ok {
// 			testimonial.AuthorEmail = &email
// 		}
// 		if company, ok := session.AuthorInfo["company"].(string); ok {
// 			testimonial.AuthorCompany = &company
// 		}
// 		if title, ok := session.AuthorInfo["title"].(string); ok {
// 			testimonial.AuthorTitle = &title
// 		}
// 	}

// 	// Save testimonial
// 	err := h.testimonialService.CreateTestimonial(ctx, testimonial)
// 	if err != nil {
// 		h.logger.Error("Failed to create testimonial",
// 			zap.String("sessionID", session.ID),
// 			zap.Error(err))
// 		return
// 	}

// 	// Update campaign collected count
// 	h.campaignService.UpdateCollectedCount(ctx, session.Campaign.ID)

// 	// Queue AI processing jobs
// 	go h.queueAIProcessingJobs(testimonial, session)

// 	// Send completion message
// 	msg := WSMessage{
// 		Type:      MsgTypeInterviewComplete,
// 		SessionID: session.ID,
// 		Data: map[string]interface{}{
// 			"message":       "Thank you! Your testimonial has been submitted for processing.",
// 			"testimonialId": testimonial.ID.String(),
// 			"status":        "complete",
// 			"nextSteps":     "Your testimonial will be processed and enhanced by our AI system.",
// 		},
// 		Timestamp: time.Now().UnixNano() / int64(time.Millisecond),
// 	}

// 	h.BroadcastToSession(session.ID, msg)

// 	// Cleanup session after delay
// 	time.AfterFunc(30*time.Second, func() {
// 		h.cleanupSession(session.ID)
// 	})
// }

// // ProcessAudioChunk processes incoming audio data
// func (h *WSHub) ProcessAudioChunk(sessionID string, audioData []byte) error {
// 	h.mu.RLock()
// 	session, exists := h.sessions[sessionID]
// 	h.mu.RUnlock()

// 	if !exists {
// 		return fmt.Errorf("session not found: %s", sessionID)
// 	}

// 	session.mu.Lock()
// 	stream := session.transcriptionStream
// 	session.AudioBuffer = append(session.AudioBuffer, audioData)
// 	session.lastActivityTime = time.Now()
// 	session.mu.Unlock()

// 	if stream == nil {
// 		return fmt.Errorf("transcription stream not initialized for session: %s", sessionID)
// 	}

// 	// Decode base64 audio data if needed
// 	decodedData, err := base64.StdEncoding.DecodeString(string(audioData))
// 	if err != nil {
// 		// If decoding fails, assume it's already raw audio data
// 		decodedData = audioData
// 	}

// 	// Send audio chunk to AI service
// 	chunk := &pb.AudioChunk{
// 		Data:       decodedData,
// 		SampleRate: 16000,
// 		IsFinal:    false,
// 	}

// 	return stream.Send(chunk)
// }

// // FinalizeAudioStream finalizes the audio stream
// func (h *WSHub) FinalizeAudioStream(sessionID string) error {
// 	h.mu.RLock()
// 	session, exists := h.sessions[sessionID]
// 	h.mu.RUnlock()

// 	if !exists {
// 		return fmt.Errorf("session not found: %s", sessionID)
// 	}

// 	session.mu.Lock()
// 	stream := session.transcriptionStream
// 	session.mu.Unlock()

// 	if stream == nil {
// 		return fmt.Errorf("transcription stream not initialized for session: %s", sessionID)
// 	}

// 	// Send final chunk
// 	finalChunk := &pb.AudioChunk{
// 		Data:       []byte{},
// 		SampleRate: 16000,
// 		IsFinal:    true,
// 	}

// 	return stream.Send(finalChunk)
// }

// // convertCampaignQuestions converts campaign questions to QuestionContext
// func (h *WSHub) convertCampaignQuestions(campaignQuestions models.JSONArray) []QuestionContext {
// 	questions := make([]QuestionContext, 0, len(campaignQuestions))

// 	for i, q := range campaignQuestions {
// 		if qMap, ok := q.(map[string]interface{}); ok {
// 			question := QuestionContext{
// 				ID:       fmt.Sprintf("q%d", i+1),
// 				Text:     getString(qMap, "text"),
// 				Category: getString(qMap, "category"),
// 			}
// 			questions = append(questions, question)
// 		}
// 	}

// 	// Fallback to default questions if none found
// 	if len(questions) == 0 {
// 		return []QuestionContext{
// 			{ID: "q1", Text: "What challenge were you facing before using our solution?", Category: "problem_identification"},
// 			{ID: "q2", Text: "What made you choose our solution over alternatives?", Category: "solution_selection"},
// 			{ID: "q3", Text: "What results have you seen since implementing our solution?", Category: "results_outcomes"},
// 			{ID: "q4", Text: "Would you recommend our solution to others? Why?", Category: "recommendation"},
// 			{ID: "q5", Text: "Is there anything else you'd like to share about your experience?", Category: "additional_feedback"},
// 		}
// 	}

// 	return questions
// }

// // getPreviousQuestions gets previous questions for AI context
// func (h *WSHub) getPreviousQuestions(session *Session, upToIndex int) []string {
// 	questions := make([]string, 0, upToIndex)
// 	for i := 0; i < upToIndex && i < len(session.Questions); i++ {
// 		questions = append(questions, session.Questions[i].Text)
// 	}
// 	return questions
// }

// // getInterviewStage determines the current interview stage
// func (h *WSHub) getInterviewStage(currentIndex, totalQuestions int) string {
// 	progress := float64(currentIndex) / float64(totalQuestions)

// 	switch {
// 	case progress < 0.3:
// 		return "opening"
// 	case progress < 0.7:
// 		return "middle"
// 	default:
// 		return "closing"
// 	}
// }

// // queueAIProcessingJobs queues AI processing jobs for testimonial
// func (h *WSHub) queueAIProcessingJobs(testimonial *models.Testimonial, session *Session) {
// 	ctx := context.Background()

// 	jobs := []*models.AIJob{
// 		{
// 			ID:       uuid.New(),
// 			JobType:  "sentiment_analysis",
// 			Status:   "pending",
// 			Priority: 1,
// 			Payload: models.JSONMap{
// 				"testimonial_id":       testimonial.ID.String(),
// 				"session_id":           session.ID,
// 				"include_emotions":     true,
// 				"include_authenticity": true,
// 			},
// 			MaxRetries:  3,
// 			ScheduledAt: time.Now(),
// 			CreatedAt:   time.Now(),
// 			UpdatedAt:   time.Now(),
// 		},
// 		{
// 			ID:       uuid.New(),
// 			JobType:  "highlight_extraction",
// 			Status:   "pending",
// 			Priority: 2,
// 			Payload: models.JSONMap{
// 				"testimonial_id":       testimonial.ID.String(),
// 				"max_highlights":       5,
// 				"min_importance_score": 0.7,
// 			},
// 			MaxRetries:  3,
// 			ScheduledAt: time.Now().Add(5 * time.Second),
// 			CreatedAt:   time.Now(),
// 			UpdatedAt:   time.Now(),
// 		},
// 		{
// 			ID:       uuid.New(),
// 			JobType:  "testimonial_scoring",
// 			Status:   "pending",
// 			Priority: 3,
// 			Payload: models.JSONMap{
// 				"testimonial_id":   testimonial.ID.String(),
// 				"scoring_criteria": []string{"authenticity", "business_value", "emotional_impact"},
// 			},
// 			MaxRetries:  3,
// 			ScheduledAt: time.Now().Add(10 * time.Second),
// 			CreatedAt:   time.Now(),
// 			UpdatedAt:   time.Now(),
// 		},
// 	}

// 	// Queue enhancement job if brand context is available
// 	if session.BrandContext != nil {
// 		jobs = append(jobs, &models.AIJob{
// 			ID:       uuid.New(),
// 			JobType:  "text_polish",
// 			Status:   "pending",
// 			Priority: 4,
// 			Payload: models.JSONMap{
// 				"testimonial_id":        testimonial.ID.String(),
// 				"brand_context_id":      session.BrandContext.ID.String(),
// 				"target_style":          "enhanced",
// 				"preserve_authenticity": true,
// 			},
// 			MaxRetries:  3,
// 			ScheduledAt: time.Now().Add(15 * time.Second),
// 			CreatedAt:   time.Now(),
// 			UpdatedAt:   time.Now(),
// 		})
// 	}

// 	// Queue all jobs
// 	for _, job := range jobs {
// 		err := h.testimonialService.QueueAIJob(ctx, job)
// 		if err != nil {
// 			h.logger.Error("Failed to queue AI job",
// 				zap.String("jobType", job.JobType),
// 				zap.String("testimonialID", testimonial.ID.String()),
// 				zap.Error(err))
// 		}
// 	}

// 	h.logger.Info("AI processing jobs queued",
// 		zap.String("testimonialID", testimonial.ID.String()),
// 		zap.Int("jobCount", len(jobs)))
// }

// // getFormatFromMediaType returns format from media type
// func (h *WSHub) getFormatFromMediaType(mediaType string) string {
// 	switch mediaType {
// 	case "video":
// 		return "mp4"
// 	case "audio":
// 		return "wav"
// 	default:
// 		return "mp4"
// 	}
// }

// // Start begins the client's read and write pumps
// func (c *WSClient) Start() {
// 	log.Printf("Starting WebSocket client for session: %s", c.sessionID)

// 	// Register client with hub
// 	c.hub.register <- c

// 	// Start read and write pumps in separate goroutines
// 	go c.writePump()
// 	go c.readPump()
// }

// // readPump pumps messages from the websocket connection to the onMessage handler
// func (c *WSClient) readPump() {
// 	defer func() {
// 		log.Printf("Read pump finished for session: %s", c.sessionID)
// 		c.Close()
// 	}()

// 	c.conn.SetReadLimit(maxMessageSize)
// 	c.conn.SetReadDeadline(time.Now().Add(pongWait))
// 	c.conn.SetPongHandler(func(string) error {
// 		c.conn.SetReadDeadline(time.Now().Add(pongWait))
// 		return nil
// 	})

// 	for {
// 		// Check if client is closing
// 		c.mu.RLock()
// 		if c.closing || c.closed {
// 			c.mu.RUnlock()
// 			return
// 		}
// 		c.mu.RUnlock()

// 		_, message, err := c.conn.ReadMessage()
// 		if err != nil {
// 			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
// 				log.Printf("Unexpected WebSocket close error: %v", err)
// 			} else {
// 				log.Printf("WebSocket read error (normal close): %v", err)
// 			}
// 			break
// 		}

// 		// Call onMessage handler if set
// 		if c.onMessage != nil {
// 			c.onMessage(message)
// 		}
// 	}
// }

// // writePump pumps messages from the send channel to the WebSocket connection
// func (c *WSClient) writePump() {
// 	ticker := time.NewTicker(pingPeriod)
// 	defer func() {
// 		ticker.Stop()
// 		log.Printf("Write pump finished for session: %s", c.sessionID)
// 		c.Close()
// 	}()

// 	for {
// 		select {
// 		case message, ok := <-c.send:
// 			c.mu.RLock()
// 			if c.closed {
// 				c.mu.RUnlock()
// 				return
// 			}

// 			conn := c.conn
// 			c.mu.RUnlock()

// 			if err := conn.SetWriteDeadline(time.Now().Add(writeWait)); err != nil {
// 				log.Printf("Error setting write deadline: %v", err)
// 				return
// 			}

// 			if !ok {
// 				// Channel was closed
// 				conn.WriteMessage(websocket.CloseMessage, []byte{})
// 				return
// 			}

// 			w, err := conn.NextWriter(websocket.TextMessage)
// 			if err != nil {
// 				log.Printf("Error getting next writer: %v", err)
// 				return
// 			}

// 			if _, err := w.Write(message); err != nil {
// 				log.Printf("Error writing message: %v", err)
// 				w.Close()
// 				return
// 			}

// 			if err := w.Close(); err != nil {
// 				log.Printf("Error closing writer: %v", err)
// 				return
// 			}

// 		case <-ticker.C:
// 			c.mu.RLock()
// 			if c.closed {
// 				c.mu.RUnlock()
// 				return
// 			}

// 			conn := c.conn
// 			c.mu.RUnlock()

// 			if err := conn.SetWriteDeadline(time.Now().Add(writeWait)); err != nil {
// 				log.Printf("Error setting ping write deadline: %v", err)
// 				return
// 			}

// 			if err := conn.WriteMessage(websocket.PingMessage, nil); err != nil {
// 				log.Printf("Error sending ping: %v", err)
// 				return
// 			}
// 		}
// 	}
// }

// // SendMessage sends a message to the client
// func (c *WSClient) SendMessage(message []byte) {
// 	c.mu.RLock()
// 	defer c.mu.RUnlock()

// 	if c.closed || c.closing {
// 		return
// 	}

// 	select {
// 	case c.send <- message:
// 		// Message sent successfully
// 	default:
// 		// Channel is full, client is probably unresponsive
// 		log.Printf("WSClient send channel full, closing client for session: %s", c.sessionID)
// 		go c.Close() // Close in a separate goroutine to avoid deadlock
// 	}
// }

// // Close closes the client connection
// func (c *WSClient) Close() {
// 	c.mu.Lock()
// 	defer c.mu.Unlock()

// 	// Check if already closed or closing
// 	if c.closed || c.closing {
// 		return
// 	}

// 	// Mark as closing to prevent other operations
// 	c.closing = true

// 	log.Printf("Closing WebSocket client for session: %s", c.sessionID)

// 	// Close the WebSocket connection
// 	if c.conn != nil {
// 		c.conn.Close()
// 	}

// 	// Close the send channel if it's not already closed
// 	if c.send != nil {
// 		close(c.send)
// 		c.send = nil
// 	}

// 	// Mark as fully closed
// 	c.closed = true

// 	// Unregister from hub (do this outside the lock to avoid potential deadlock)
// 	go func() {
// 		c.hub.unregister <- c
// 	}()
// }

// // IsClosed returns whether the client is closed
// func (c *WSClient) IsClosed() bool {
// 	c.mu.RLock()
// 	defer c.mu.RUnlock()
// 	return c.closed
// }

// // AddClient adds a client to the session
// func (s *Session) AddClient(client *WSClient) {
// 	s.clientsMutex.Lock()
// 	defer s.clientsMutex.Unlock()

// 	s.clients[client] = true
// 	s.updateActivity()
// 	log.Printf("Added client to session %s, total clients: %d", s.ID, len(s.clients))

// 	// If this is the first client and session is waiting, activate it
// 	if len(s.clients) == 1 && s.State == SessionStateWaiting {
// 		s.mu.Lock()
// 		s.State = SessionStateActive
// 		s.updateActivity()
// 		s.mu.Unlock()

// 		// Start the interview by asking the first question
// 		go s.startInterview()
// 	}
// }

// // RemoveClient removes a client from the session
// func (s *Session) RemoveClient(client *WSClient) {
// 	s.clientsMutex.Lock()
// 	defer s.clientsMutex.Unlock()

// 	if _, exists := s.clients[client]; exists {
// 		delete(s.clients, client)
// 		log.Printf("Removed client from session %s, remaining clients: %d", s.ID, len(s.clients))
// 	}
// }

// // BroadcastMessage sends a message to all clients in the session
// func (s *Session) BroadcastMessage(message []byte) {
// 	s.clientsMutex.RLock()
// 	clientsToRemove := make([]*WSClient, 0)

// 	for client := range s.clients {
// 		// Check if client is closed before trying to send
// 		if client.IsClosed() {
// 			clientsToRemove = append(clientsToRemove, client)
// 			continue
// 		}

// 		client.SendMessage(message)
// 	}
// 	s.clientsMutex.RUnlock()

// 	// Remove closed clients outside of the read lock
// 	if len(clientsToRemove) > 0 {
// 		s.clientsMutex.Lock()
// 		for _, client := range clientsToRemove {
// 			delete(s.clients, client)
// 		}
// 		s.clientsMutex.Unlock()
// 		log.Printf("Cleaned up %d closed clients from session %s", len(clientsToRemove), s.ID)
// 	}
// }

// // GetCurrentQuestion returns the current question
// func (s *Session) GetCurrentQuestion() *QuestionContext {
// 	s.mu.RLock()
// 	defer s.mu.RUnlock()

// 	if s.CurrentQuestionIndex < len(s.Questions) {
// 		return &s.Questions[s.CurrentQuestionIndex]
// 	}
// 	return nil
// }

// // AdvanceToNextQuestion moves to the next question
// func (s *Session) AdvanceToNextQuestion() *QuestionContext {
// 	s.mu.Lock()
// 	defer s.mu.Unlock()

// 	// Mark current question as answered
// 	if s.CurrentQuestionIndex < len(s.Questions) {
// 		now := time.Now()
// 		s.Questions[s.CurrentQuestionIndex].AnsweredAt = &now
// 		s.Questions[s.CurrentQuestionIndex].Response = s.CurrentTranscript
// 	}

// 	s.CurrentQuestionIndex++
// 	s.CurrentTranscript = "" // Reset transcript for next question
// 	s.updateActivity()

// 	if s.CurrentQuestionIndex < len(s.Questions) {
// 		s.Questions[s.CurrentQuestionIndex].AskedAt = time.Now()
// 		return &s.Questions[s.CurrentQuestionIndex]
// 	}

// 	// No more questions - mark session as completed
// 	s.State = SessionStateCompleted
// 	return nil
// }

// // SetCurrentResponse sets the current response/transcript
// func (s *Session) SetCurrentResponse(response string) {
// 	s.mu.Lock()
// 	defer s.mu.Unlock()

// 	s.CurrentTranscript = response
// 	s.updateActivity()
// }

// // AddMediaChunk adds a media chunk to the session
// func (s *Session) AddMediaChunk(chunk MediaChunk) {
// 	s.mu.Lock()
// 	defer s.mu.Unlock()

// 	s.MediaChunks = append(s.MediaChunks, chunk)
// 	s.updateActivity()
// }

// // IsCompleted checks if the session is completed
// func (s *Session) IsCompleted() bool {
// 	s.mu.RLock()
// 	defer s.mu.RUnlock()

// 	return s.State == SessionStateCompleted || s.CurrentQuestionIndex >= len(s.Questions)
// }

// // GetProgress returns the session progress (0-1)
// func (s *Session) GetProgress() float64 {
// 	s.mu.RLock()
// 	defer s.mu.RUnlock()

// 	if len(s.Questions) == 0 {
// 		return 0
// 	}

// 	return float64(s.CurrentQuestionIndex) / float64(len(s.Questions))
// }

// // Count returns the number of connected clients
// func (s *Session) Count() int {
// 	s.clientsMutex.RLock()
// 	defer s.clientsMutex.RUnlock()

// 	return len(s.clients)
// }

// // ToJSON converts session to JSON for client communication
// func (s *Session) ToJSON() ([]byte, error) {
// 	s.mu.RLock()
// 	defer s.mu.RUnlock()

// 	// Create a safe copy for JSON serialization
// 	safeCopy := struct {
// 		ID                   string            `json:"id"`
// 		CampaignID           string            `json:"campaign_id"`
// 		State                SessionState      `json:"state"`
// 		CurrentQuestionIndex int               `json:"current_question_index"`
// 		MaxQuestions         int               `json:"max_questions"`
// 		Progress             float64           `json:"progress"`
// 		CurrentQuestion      *QuestionContext  `json:"current_question,omitempty"`
// 		CompletedQuestions   []QuestionContext `json:"completed_questions"`
// 	}{
// 		ID:                   s.ID,
// 		CampaignID:           s.CampaignID,
// 		State:                s.State,
// 		CurrentQuestionIndex: s.CurrentQuestionIndex,
// 		MaxQuestions:         s.MaxQuestions,
// 		Progress:             s.GetProgress(),
// 	}

// 	// Add current question if available
// 	if currentQ := s.GetCurrentQuestion(); currentQ != nil {
// 		safeCopy.CurrentQuestion = currentQ
// 	}

// 	// Add completed questions
// 	for i := 0; i < s.CurrentQuestionIndex && i < len(s.Questions); i++ {
// 		if s.Questions[i].AnsweredAt != nil {
// 			safeCopy.CompletedQuestions = append(safeCopy.CompletedQuestions, s.Questions[i])
// 		}
// 	}

// 	return json.Marshal(safeCopy)
// }

// // startInterview begins the interview process
// func (s *Session) startInterview() {
// 	if len(s.Questions) == 0 {
// 		s.hub.logger.Error("No questions available for session", zap.String("sessionID", s.ID))
// 		return
// 	}

// 	// Send first question
// 	firstQuestion := s.GetCurrentQuestion()
// 	if firstQuestion != nil {
// 		msg := WSMessage{
// 			Type:      MsgTypeNextQuestion,
// 			SessionID: s.ID,
// 			Data: map[string]interface{}{
// 				"question":      firstQuestion.Text,
// 				"progress":      s.GetProgress(),
// 				"questionIndex": s.CurrentQuestionIndex,
// 				"category":      firstQuestion.Category,
// 			},
// 			Timestamp: time.Now().UnixNano() / int64(time.Millisecond),
// 		}

// 		s.hub.BroadcastToSession(s.ID, msg)
// 		s.hub.logger.Info("Interview started", zap.String("sessionID", s.ID))
// 	}
// }

// // updateActivity updates the last activity timestamp (must be called with lock held)
// func (s *Session) updateActivity() {
// 	s.lastActivityTime = time.Now()
// 	s.UpdatedAt = s.lastActivityTime

// 	// Reset cleanup timer
// 	if s.cleanupTimer != nil {
// 		s.cleanupTimer.Stop()
// 	}
// 	s.setupCleanupTimer()
// }

// // setupCleanupTimer sets up the session cleanup timer
// func (s *Session) setupCleanupTimer() {
// 	s.cleanupTimer = time.AfterFunc(sessionTimeout, func() {
// 		log.Printf("Session %s inactive for %v, cleaning up", s.ID, sessionTimeout)

// 		// Session has been inactive, mark for cleanup
// 		s.mu.Lock()
// 		s.State = SessionStateCompleted
// 		s.mu.Unlock()

// 		// Close all client connections
// 		s.clientsMutex.Lock()
// 		clients := make([]*WSClient, 0, len(s.clients))
// 		for client := range s.clients {
// 			clients = append(clients, client)
// 		}
// 		// Clear the clients map
// 		s.clients = make(map[*WSClient]bool)
// 		s.clientsMutex.Unlock()

// 		// Close clients outside of the lock to avoid deadlock
// 		for _, client := range clients {
// 			go client.Close() // Close in separate goroutines
// 		}

// 		// Cleanup session from hub
// 		if s.hub != nil {
// 			s.hub.UnregisterSession(s.ID)
// 		}
// 	})
// }

// // Cleanup performs session cleanup
// func (s *Session) Cleanup() {
// 	s.mu.Lock()
// 	defer s.mu.Unlock()

// 	log.Printf("Cleaning up session %s", s.ID)

// 	if s.cleanupTimer != nil {
// 		s.cleanupTimer.Stop()
// 		s.cleanupTimer = nil
// 	}

// 	// Close transcription stream
// 	if s.transcriptionStream != nil {
// 		s.transcriptionStream.CloseSend()
// 		s.transcriptionStream = nil
// 	}

// 	// Clear media chunks to free memory
// 	s.MediaChunks = nil
// 	s.AudioBuffer = nil

// 	// Close all clients
// 	s.clientsMutex.Lock()
// 	clients := make([]*WSClient, 0, len(s.clients))
// 	for client := range s.clients {
// 		clients = append(clients, client)
// 	}
// 	s.clients = make(map[*WSClient]bool)
// 	s.clientsMutex.Unlock()

// 	// Close clients outside of the lock
// 	for _, client := range clients {
// 		go client.Close()
// 	}
// }

// // getMediaType returns the media type for the session
// func (s *Session) getMediaType() string {
// 	if s.MediaType != "" {
// 		return s.MediaType
// 	}
// 	return "video" // default
// }

// // Helper functions
// func getString(m map[string]interface{}, key string) string {
// 	if val, ok := m[key].(string); ok {
// 		return val
// 	}
// 	return ""
// }

// func stringPtr(s string) *string {
// 	return &s
// }
