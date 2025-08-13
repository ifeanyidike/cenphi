// // // internal/controllers/websocket.go
package controllers

// // import (
// // 	"context"
// // 	"encoding/base64"
// // 	"encoding/json"
// // 	"fmt"
// // 	"net/http"
// // 	"sync"
// // 	"time"

// // 	"github.com/go-chi/chi/v5"
// // 	"github.com/google/uuid"
// // 	socket "github.com/gorilla/websocket"
// // 	"github.com/ifeanyidike/cenphi/internal/ai"
// // 	"github.com/ifeanyidike/cenphi/internal/services"
// // 	"go.uber.org/zap"
// // )

// // type WebsocketController interface {
// // 	HandleInterview(w http.ResponseWriter, r *http.Request)
// // }

// // type webSocketController struct {
// // 	hub                *services.WSHub
// // 	testimonialService services.TestimonialService
// // 	aiService          ai.Intelligence
// // 	logger             *zap.Logger
// // 	upgrader           socket.Upgrader
// // 	activeStreams      map[string]*StreamSession
// // 	streamsMu          sync.RWMutex
// // }

// // type StreamSession struct {
// // 	SessionID         string
// // 	CampaignID        string
// // 	TranscriptionChan <-chan *ai.TranscriptionResult
// // 	Cancel            context.CancelFunc
// // 	LastActivity      time.Time
// // 	AccumulatedText   string
// // 	AudioBuffer       [][]byte
// // 	IsStreaming       bool
// // 	mu                sync.RWMutex
// // }

// // func NewWebSocketController(
// // 	hub *services.WSHub,
// // 	testimonialService services.TestimonialService,
// // 	aiService ai.Intelligence,
// // 	logger *zap.Logger,
// // ) WebsocketController {
// // 	wsc := &webSocketController{
// // 		hub:                hub,
// // 		testimonialService: testimonialService,
// // 		aiService:          aiService,
// // 		logger:             logger,
// // 		activeStreams:      make(map[string]*StreamSession),
// // 		upgrader: socket.Upgrader{
// // 			ReadBufferSize:  4096,
// // 			WriteBufferSize: 4096,
// // 			CheckOrigin: func(r *http.Request) bool {
// // 				// Production: Implement proper origin checking
// // 				return true
// // 			},
// // 		},
// // 	}

// // 	// Start cleanup routine for inactive streams
// // 	go wsc.cleanupInactiveStreams()

// // 	return wsc
// // }

// // // Message types for WebSocket communication
// // const (
// // 	MsgTypePing              = "ping"
// // 	MsgTypePong              = "pong"
// // 	MsgTypeWelcome           = "welcome"
// // 	MsgTypeClientInfo        = "client_info"
// // 	MsgTypeMediaChunk        = "media_chunk"
// // 	MsgTypeRecordingComplete = "recording_complete"
// // 	MsgTypeTextSubmission    = "text_submission"
// // 	MsgTypePauseDetected     = "pause_detected"
// // 	MsgTypeTranscript        = "transcript"
// // 	MsgTypeNextQuestion      = "next_question"
// // 	MsgTypeInterviewComplete = "interview_complete"
// // 	MsgTypeHint              = "hint"
// // 	MsgTypeError             = "error"
// // 	MsgTypeSessionUpdate     = "session_update"
// // 	MsgTypeFillerDetected    = "filler_detected"
// // )

// // type WSMessage struct {
// // 	Type      string                 `json:"type"`
// // 	SessionID string                 `json:"sessionId,omitempty"`
// // 	Data      map[string]interface{} `json:"data,omitempty"`
// // 	Timestamp int64                  `json:"timestamp"`
// // }

// // func (c *webSocketController) HandleInterview(w http.ResponseWriter, r *http.Request) {
// // 	campaignID := chi.URLParam(r, "campaignID")
// // 	if campaignID == "" {
// // 		http.Error(w, "Missing campaign ID", http.StatusBadRequest)
// // 		return
// // 	}

// // 	sessionID := r.URL.Query().Get("session")
// // 	if sessionID == "" {
// // 		sessionID = uuid.New().String()
// // 	}

// // 	// Upgrade to WebSocket
// // 	conn, err := c.upgrader.Upgrade(w, r, nil)
// // 	if err != nil {
// // 		c.logger.Error("Failed to upgrade WebSocket connection", zap.Error(err))
// // 		return
// // 	}
// // 	defer conn.Close()

// // 	c.logger.Info("WebSocket connection established",
// // 		zap.String("session_id", sessionID),
// // 		zap.String("campaign_id", campaignID))

// // 	// Get or create session
// // 	session, err := c.getOrCreateSession(sessionID, campaignID)
// // 	if err != nil {
// // 		c.sendErrorMessage(conn, "Failed to create session")
// // 		return
// // 	}

// // 	// Register session with hub
// // 	c.hub.RegisterSession(sessionID, session)
// // 	defer c.hub.UnregisterSession(sessionID)

// // 	// Add connection to session
// // 	session.AddConnection(conn)
// // 	defer session.RemoveConnection(conn)

// // 	// Send welcome message
// // 	c.sendWelcomeMessage(conn, session, campaignID)

// // 	// Start AI streaming if not already active
// // 	if err := c.startAIStreaming(sessionID, campaignID); err != nil {
// // 		c.logger.Error("Failed to start AI streaming", zap.Error(err))
// // 		c.sendErrorMessage(conn, "Failed to initialize AI services")
// // 	}

// // 	// Handle incoming messages
// // 	for {
// // 		messageType, message, err := conn.ReadMessage()
// // 		if err != nil {
// // 			if socket.IsUnexpectedCloseError(err, socket.CloseGoingAway, socket.CloseAbnormalClosure) {
// // 				c.logger.Error("WebSocket error", zap.Error(err))
// // 			}
// // 			break
// // 		}

// // 		if messageType == socket.TextMessage {
// // 			c.handleMessage(session, campaignID, message)
// // 		}
// // 	}
// // }

// // func (c *webSocketController) startAIStreaming(sessionID, campaignID string) error {
// // 	c.streamsMu.Lock()
// // 	defer c.streamsMu.Unlock()

// // 	// Check if streaming already active
// // 	if stream, exists := c.activeStreams[sessionID]; exists && stream.IsStreaming {
// // 		return nil
// // 	}

// // 	// Create context for the streaming session
// // 	ctx, cancel := context.WithCancel(context.Background())

// // 	// Create audio stream channel
// // 	audioStream := make(chan []byte, 100)

// // 	// Start AI transcription streaming
// // 	transcriptionChan, err := c.aiService.StreamTranscription(
// // 		ctx,
// // 		audioStream,
// // 		sessionID,
// // 		"webm", // Default format, can be dynamic
// // 		48000,  // Sample rate
// // 	)
// // 	if err != nil {
// // 		cancel()
// // 		return fmt.Errorf("failed to start transcription stream: %w", err)
// // 	}

// // 	// Create stream session
// // 	streamSession := &StreamSession{
// // 		SessionID:         sessionID,
// // 		CampaignID:        campaignID,
// // 		TranscriptionChan: transcriptionChan,
// // 		Cancel:            cancel,
// // 		LastActivity:      time.Now(),
// // 		IsStreaming:       true,
// // 		AudioBuffer:       make([][]byte, 0),
// // 	}

// // 	c.activeStreams[sessionID] = streamSession

// // 	// Start processing transcription results
// // 	go c.processTranscriptionResults(streamSession)

// // 	c.logger.Info("AI streaming started", zap.String("session_id", sessionID))
// // 	return nil
// // }

// // func (c *webSocketController) processTranscriptionResults(stream *StreamSession) {
// // 	defer func() {
// // 		stream.Cancel()
// // 		c.streamsMu.Lock()
// // 		delete(c.activeStreams, stream.SessionID)
// // 		c.streamsMu.Unlock()
// // 	}()

// // 	for result := range stream.TranscriptionChan {
// // 		stream.mu.Lock()
// // 		stream.LastActivity = time.Now()

// // 		// Update accumulated text
// // 		if result.IsFinal {
// // 			stream.AccumulatedText += " " + result.Text
// // 		}
// // 		stream.mu.Unlock()

// // 		// Send transcript to client
// // 		msg := WSMessage{
// // 			Type:      MsgTypeTranscript,
// // 			SessionID: stream.SessionID,
// // 			Data: map[string]interface{}{
// // 				"text":       result.Text,
// // 				"is_final":   result.IsFinal,
// // 				"confidence": result.Confidence,
// // 			},
// // 			Timestamp: time.Now().UnixNano() / int64(time.Millisecond),
// // 		}

// // 		c.broadcastToSession(stream.SessionID, msg)

// // 		// Process for fillers and pauses if final
// // 		if result.IsFinal {
// // 			c.processTranscriptForHints(stream, result.Text)
// // 		}
// // 	}
// // }

// // func (c *webSocketController) processTranscriptForHints(stream *StreamSession, text string) {
// // 	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
// // 	defer cancel()

// // 	// Detect fillers
// // 	go func() {
// // 		fillerReq := &ai.FillerDetectionRequest{
// // 			Text:      text,
// // 			SessionID: stream.SessionID,
// // 		}

// // 		fillerResp, err := c.aiService.DetectFillers(ctx, fillerReq)
// // 		if err != nil {
// // 			c.logger.Warn("Failed to detect fillers", zap.Error(err))
// // 			return
// // 		}

// // 		if len(fillerResp.FillerWords) > 0 {
// // 			msg := WSMessage{
// // 				Type:      MsgTypeFillerDetected,
// // 				SessionID: stream.SessionID,
// // 				Data: map[string]interface{}{
// // 					"fillers":    fillerResp.FillerWords,
// // 					"suggestion": "Try to avoid filler words like 'um', 'uh', and 'like'",
// // 				},
// // 				Timestamp: time.Now().UnixNano() / int64(time.Millisecond),
// // 			}
// // 			c.broadcastToSession(stream.SessionID, msg)
// // 		}
// // 	}()

// // 	// Check for question generation opportunity
// // 	stream.mu.RLock()
// // 	wordCount := len(stream.AccumulatedText)
// // 	stream.mu.RUnlock()

// // 	if wordCount > 50 { // Threshold for next question
// // 		go c.generateNextQuestion(stream)
// // 	}
// // }

// // func (c *webSocketController) generateNextQuestion(stream *StreamSession) {
// // 	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
// // 	defer cancel()

// // 	// Get brand context for the campaign
// // 	// This would need campaign -> workspace mapping
// // 	brandContext, err := c.getBrandContextForCampaign(ctx, stream.CampaignID)
// // 	if err != nil {
// // 		c.logger.Warn("Failed to get brand context", zap.Error(err))
// // 		brandContext = &ai.BrandContext{} // Use empty context
// // 	}

// // 	questionReq := &ai.QuestionGenerationRequest{
// // 		Context:           stream.AccumulatedText,
// // 		BrandContext:      brandContext,
// // 		QuestionType:      "follow_up",
// // 		PreviousQuestions: []string{}, // TODO: Track previous questions
// // 		MaxQuestions:      1,
// // 	}

// // 	questionResp, err := c.aiService.GenerateQuestions(ctx, questionReq)
// // 	if err != nil {
// // 		c.logger.Warn("Failed to generate next question", zap.Error(err))
// // 		return
// // 	}

// // 	if len(questionResp.Questions) > 0 {
// // 		msg := WSMessage{
// // 			Type:      MsgTypeNextQuestion,
// // 			SessionID: stream.SessionID,
// // 			Data: map[string]interface{}{
// // 				"question": questionResp.Questions[0].Text,
// // 				"context":  questionResp.Questions[0].Context,
// // 			},
// // 			Timestamp: time.Now().UnixNano() / int64(time.Millisecond),
// // 		}
// // 		c.broadcastToSession(stream.SessionID, msg)
// // 	}
// // }

// // func (c *webSocketController) handleMessage(session *websocket.Session, campaignID string, message []byte) {
// // 	var msg WSMessage
// // 	if err := json.Unmarshal(message, &msg); err != nil {
// // 		c.logger.Error("Failed to parse WebSocket message", zap.Error(err))
// // 		return
// // 	}

// // 	if msg.Timestamp == 0 {
// // 		msg.Timestamp = time.Now().UnixNano() / int64(time.Millisecond)
// // 	}

// // 	switch msg.Type {
// // 	case MsgTypePing:
// // 		c.handlePing(session, msg)
// // 	case MsgTypeClientInfo:
// // 		c.handleClientInfo(session, msg)
// // 	case MsgTypeMediaChunk:
// // 		c.handleMediaChunk(session, msg)
// // 	case MsgTypeRecordingComplete:
// // 		c.handleRecordingComplete(session, msg)
// // 	case MsgTypeTextSubmission:
// // 		c.handleTextSubmission(session, msg)
// // 	case MsgTypePauseDetected:
// // 		c.handlePauseDetected(session, msg)
// // 	case MsgTypeInterviewComplete:
// // 		c.handleInterviewComplete(session, msg)
// // 	default:
// // 		c.logger.Warn("Unknown message type", zap.String("type", msg.Type))
// // 	}
// // }

// // func (c *webSocketController) handleMediaChunk(session *websocket.Session, msg WSMessage) {
// // 	audioData, ok := msg.Data["audio_data"].(string)
// // 	if !ok {
// // 		c.logger.Error("Media chunk missing audio data")
// // 		return
// // 	}

// // 	// Decode base64 audio data
// // 	decodedAudio, err := base64.StdEncoding.DecodeString(audioData)
// // 	if err != nil {
// // 		c.logger.Error("Failed to decode audio data", zap.Error(err))
// // 		return
// // 	}

// // 	// Send to AI service for processing
// // 	c.streamsMu.RLock()
// // 	stream, exists := c.activeStreams[session.ID]
// // 	c.streamsMu.RUnlock()

// // 	if exists && stream.IsStreaming {
// // 		// Send audio chunk to transcription stream
// // 		select {
// // 		case audioStream := <-make(chan chan []byte, 1):
// // 			select {
// // 			case audioStream <- decodedAudio:
// // 			default:
// // 				c.logger.Warn("Audio stream buffer full, dropping chunk")
// // 			}
// // 		default:
// // 			// Stream not ready, buffer the audio
// // 			stream.mu.Lock()
// // 			stream.AudioBuffer = append(stream.AudioBuffer, decodedAudio)
// // 			stream.mu.Unlock()
// // 		}
// // 	}
// // }

// // func (c *webSocketController) handlePing(session *websocket.Session, msg WSMessage) {
// // 	response := WSMessage{
// // 		Type:      MsgTypePong,
// // 		SessionID: session.ID,
// // 		Data: map[string]interface{}{
// // 			"timestamp": msg.Timestamp,
// // 		},
// // 		Timestamp: time.Now().UnixNano() / int64(time.Millisecond),
// // 	}
// // 	c.broadcastToSession(session.ID, response)
// // }

// // func (c *webSocketController) handleClientInfo(session *websocket.Session, msg WSMessage) {
// // 	if authorInfo, ok := msg.Data["authorInfo"].(map[string]interface{}); ok {
// // 		session.Mu.Lock()
// // 		session.AuthorInfo = authorInfo
// // 		session.Mu.Unlock()
// // 	}

// // 	if mediaType, ok := msg.Data["mediaType"].(string); ok {
// // 		session.Mu.Lock()
// // 		session.MediaType = mediaType
// // 		session.Mu.Unlock()
// // 	}
// // }

// // func (c *webSocketController) handleRecordingComplete(session *websocket.Session, msg WSMessage) {
// // 	// Stop streaming for this session
// // 	c.streamsMu.Lock()
// // 	if stream, exists := c.activeStreams[session.ID]; exists {
// // 		stream.IsStreaming = false
// // 		stream.Cancel()
// // 		delete(c.activeStreams, session.ID)
// // 	}
// // 	c.streamsMu.Unlock()

// // 	// Process final testimonial
// // 	ctx := context.Background()
// // 	finalTranscript, _ := msg.Data["final_transcript"].(string)

// // 	testimonial, err := c.testimonialService.CompleteInterview(ctx, session.ID, finalTranscript)
// // 	if err != nil {
// // 		c.logger.Error("Failed to complete interview", zap.Error(err))
// // 		c.sendErrorMessage(nil, "Failed to save testimonial")
// // 		return
// // 	}

// // 	response := WSMessage{
// // 		Type:      MsgTypeInterviewComplete,
// // 		SessionID: session.ID,
// // 		Data: map[string]interface{}{
// // 			"testimonial_id": testimonial.ID.String(),
// // 			"message":        "Thank you! Your testimonial has been recorded.",
// // 		},
// // 		Timestamp: time.Now().UnixNano() / int64(time.Millisecond),
// // 	}

// // 	c.broadcastToSession(session.ID, response)
// // }

// // func (c *webSocketController) handleTextSubmission(session *websocket.Session, msg WSMessage) {
// // 	content, ok := msg.Data["content"].(string)
// // 	if !ok {
// // 		c.sendErrorMessage(nil, "Text submission missing content")
// // 		return
// // 	}

// // 	session.SetCurrentResponse(content)
// // 	nextQuestion := session.AdvanceToNextQuestion()

// // 	if nextQuestion != nil {
// // 		response := WSMessage{
// // 			Type:      MsgTypeNextQuestion,
// // 			SessionID: session.ID,
// // 			Data: map[string]interface{}{
// // 				"question": nextQuestion.Text,
// // 				"progress": session.GetProgress(),
// // 			},
// // 			Timestamp: time.Now().UnixNano() / int64(time.Millisecond),
// // 		}
// // 		c.broadcastToSession(session.ID, response)
// // 	} else {
// // 		c.handleInterviewComplete(session, msg)
// // 	}
// // }

// // func (c *webSocketController) handlePauseDetected(session *websocket.Session, msg WSMessage) {
// // 	duration, _ := msg.Data["duration"].(float64)

// // 	if duration > 2.0 { // 2 second pause threshold
// // 		hintMsg := WSMessage{
// // 			Type:      MsgTypeHint,
// // 			SessionID: session.ID,
// // 			Data: map[string]interface{}{
// // 				"hint": "Take your time! Feel free to elaborate on your experience.",
// // 				"type": "encouragement",
// // 			},
// // 			Timestamp: time.Now().UnixNano() / int64(time.Millisecond),
// // 		}
// // 		c.broadcastToSession(session.ID, hintMsg)
// // 	}
// // }

// // func (c *webSocketController) handleInterviewComplete(session *websocket.Session, msg WSMessage) {
// // 	session.Mu.Lock()
// // 	session.State = websocket.SessionStateCompleted
// // 	session.Mu.Unlock()

// // 	response := WSMessage{
// // 		Type:      MsgTypeInterviewComplete,
// // 		SessionID: session.ID,
// // 		Data: map[string]interface{}{
// // 			"message": "Interview completed. Thank you for your time!",
// // 		},
// // 		Timestamp: time.Now().UnixNano() / int64(time.Millisecond),
// // 	}

// // 	c.broadcastToSession(session.ID, response)
// // }

// // // Helper methods
// // func (c *webSocketController) getOrCreateSession(sessionID, campaignID string) (*websocket.Session, error) {
// // 	if session, exists := c.hub.GetSession(sessionID); exists {
// // 		return session, nil
// // 	}

// // 	// Create new session with default questions
// // 	questions := c.getDefaultQuestions() // TODO: Get campaign-specific questions
// // 	session := websocket.NewSession(sessionID, campaignID, questions)

// // 	return session, nil
// // }

// // func (c *webSocketController) sendWelcomeMessage(conn *socket.Conn, session *websocket.Session, campaignID string) {
// // 	currentQuestion := session.GetCurrentQuestion()
// // 	if currentQuestion == nil {
// // 		c.sendErrorMessage(conn, "No questions available")
// // 		return
// // 	}

// // 	sessionJSON, _ := json.Marshal(map[string]interface{}{
// // 		"id":          session.ID,
// // 		"campaign_id": campaignID,
// // 		"progress":    session.GetProgress(),
// // 	})

// // 	welcomeMsg := WSMessage{
// // 		Type:      MsgTypeWelcome,
// // 		SessionID: session.ID,
// // 		Data: map[string]interface{}{
// // 			"message":  "Welcome! Let's start with your first question.",
// // 			"question": currentQuestion.Text,
// // 			"session":  json.RawMessage(sessionJSON),
// // 		},
// // 		Timestamp: time.Now().UnixNano() / int64(time.Millisecond),
// // 	}

// // 	if err := conn.WriteJSON(welcomeMsg); err != nil {
// // 		c.logger.Error("Failed to send welcome message", zap.Error(err))
// // 	}
// // }

// // func (c *webSocketController) sendErrorMessage(conn *socket.Conn, message string) {
// // 	errorMsg := WSMessage{
// // 		Type: MsgTypeError,
// // 		Data: map[string]interface{}{
// // 			"error": message,
// // 		},
// // 		Timestamp: time.Now().UnixNano() / int64(time.Millisecond),
// // 	}

// // 	if conn != nil {
// // 		conn.WriteJSON(errorMsg)
// // 	}
// // }

// // func (c *webSocketController) broadcastToSession(sessionID string, message WSMessage) {
// // 	c.hub.BroadcastToSession(sessionID, message)
// // }

// // func (c *webSocketController) getDefaultQuestions() []websocket.Question {
// // 	return []websocket.Question{
// // 		{ID: "1", Text: "How would you describe your experience with our product?", Type: "open"},
// // 		{ID: "2", Text: "What specific benefits have you seen?", Type: "open"},
// // 		{ID: "3", Text: "Would you recommend us to others?", Type: "rating"},
// // 	}
// // }

// // func (c *webSocketController) getBrandContextForCampaign(ctx context.Context, campaignID string) (*ai.BrandContext, error) {
// // 	// TODO: Implement campaign -> workspace -> brand context lookup
// // 	// For now, return empty context
// // 	return &ai.BrandContext{}, nil
// // }

// // func (c *webSocketController) cleanupInactiveStreams() {
// // 	ticker := time.NewTicker(5 * time.Minute)
// // 	defer ticker.Stop()

// // 	for range ticker.C {
// // 		c.streamsMu.Lock()
// // 		for sessionID, stream := range c.activeStreams {
// // 			if time.Since(stream.LastActivity) > 10*time.Minute {
// // 				stream.Cancel()
// // 				delete(c.activeStreams, sessionID)
// // 				c.logger.Info("Cleaned up inactive stream", zap.String("session_id", sessionID))
// // 			}
// // 		}
// // 		c.streamsMu.Unlock()
// // 	}
// // }

// // internal/controllers/websocket_controller.go
// package controllers

// import (
// 	"encoding/json"
// 	"fmt"
// 	"net/http"
// 	"time"

// 	"github.com/go-chi/chi/v5"
// 	"github.com/google/uuid"
// 	"github.com/gorilla/websocket"
// 	"github.com/ifeanyidike/cenphi/internal/ai"
// 	"github.com/ifeanyidike/cenphi/internal/services"
// 	"go.uber.org/zap"
// )

// type WebsocketController interface {
// 	HandleInterview(w http.ResponseWriter, r *http.Request)
// 	HandleTestimonialUpload(w http.ResponseWriter, r *http.Request)
// }

// type websocketController struct {
// 	wsHub              *services.WSHub
// 	testimonialService services.TestimonialService
// 	aiClient           ai.Intelligence
// 	logger             *zap.Logger
// 	upgrader           websocket.Upgrader
// }

// func NewWebSocketController(
// 	wsHub *services.WSHub,
// 	testimonialService services.TestimonialService,
// 	aiClient ai.Intelligence,
// 	logger *zap.Logger,
// ) WebsocketController {
// 	return &websocketController{
// 		wsHub:              wsHub,
// 		testimonialService: testimonialService,
// 		aiClient:           aiClient,
// 		logger:             logger,
// 		upgrader: websocket.Upgrader{
// 			ReadBufferSize:  4096,
// 			WriteBufferSize: 4096,
// 			CheckOrigin: func(r *http.Request) bool {
// 				return true
// 			},
// 		},
// 	}
// }

// // Message types matching your service implementation
// const (
// 	MsgTypePing              = "ping"
// 	MsgTypePong              = "pong"
// 	MsgTypeWelcome           = "welcome"
// 	MsgTypeClientInfo        = "client_info"
// 	MsgTypeMediaChunk        = "media_chunk"
// 	MsgTypeAudioChunk        = "audio_chunk"
// 	MsgTypeRecordingStart    = "recording_start"
// 	MsgTypeRecordingComplete = "recording_complete"
// 	MsgTypeTextSubmission    = "text_submission"
// 	MsgTypePauseDetected     = "pause_detected"
// 	MsgTypeTranscript        = "transcript"         // From your service
// 	MsgTypeNextQuestion      = "next_question"      // From your service
// 	MsgTypeInterviewComplete = "interview_complete" // From your service
// 	MsgTypeSessionStatus     = "session_status"     // From your service
// 	MsgTypeError             = "error"
// 	MsgTypeHeartbeat         = "heartbeat"
// )

// // WSMessage struct matching your service
// type WSMessage struct {
// 	Type      string                 `json:"type"`
// 	SessionID string                 `json:"session_id"`
// 	Data      map[string]interface{} `json:"data"`
// 	Timestamp int64                  `json:"timestamp"`
// 	Error     string                 `json:"error,omitempty"`
// }

// func (c *websocketController) HandleInterview(w http.ResponseWriter, r *http.Request) {
// 	campaignIDStr := chi.URLParam(r, "campaignID")
// 	if campaignIDStr == "" {
// 		http.Error(w, "Missing campaign ID", http.StatusBadRequest)
// 		return
// 	}

// 	sessionID := r.URL.Query().Get("session")
// 	if sessionID == "" {
// 		sessionID = uuid.New().String()
// 	}

// 	conn, err := c.upgrader.Upgrade(w, r, nil)
// 	if err != nil {
// 		c.logger.Error("Failed to upgrade WebSocket connection", zap.Error(err))
// 		return
// 	}

// 	c.logger.Info("WebSocket connection established",
// 		zap.String("session_id", sessionID),
// 		zap.String("campaign_id", campaignIDStr))

// 	// Get or create session using your WSHub methods
// 	var session *services.Session
// 	existingSession, ok := c.wsHub.GetSession(sessionID)
// 	if ok {
// 		session = existingSession
// 		c.logger.Info("Using existing session", zap.String("session_id", sessionID))
// 	} else {
// 		// Create new session using WSHub's CreateSession method
// 		newSession, err := c.wsHub.CreateSession(campaignIDStr)
// 		if err != nil {
// 			c.logger.Error("Failed to create session", zap.Error(err))
// 			conn.Close()
// 			return
// 		}
// 		session = newSession
// 		c.logger.Info("Created new session", zap.String("session_id", session.ID))
// 	}

// 	// Create client using WSHub's NewClient method
// 	client := c.wsHub.NewClient(conn, session.ID, func(message []byte) {
// 		c.handleMessage(session, campaignIDStr, message)
// 	})

// 	// Add client to session
// 	session.AddClient(client)

// 	// Start client (this will start read and write pumps)
// 	client.Start()

// 	// Send welcome message
// 	c.sendWelcomeMessage(session)

// 	c.logger.Info("WebSocket client setup complete", zap.String("session_id", session.ID))
// }

// func (c *websocketController) sendWelcomeMessage(session *services.Session) {
// 	currentQuestion := session.GetCurrentQuestion()

// 	welcomeData := map[string]interface{}{
// 		"message":         "Welcome to the interview! Let's get started.",
// 		"session_id":      session.ID,
// 		"campaign_id":     session.CampaignID,
// 		"progress":        session.GetProgress(),
// 		"total_questions": len(session.Questions),
// 	}

// 	if currentQuestion != nil {
// 		welcomeData["current_question"] = map[string]interface{}{
// 			"text":     currentQuestion.Text,
// 			"category": currentQuestion.Category,
// 			"index":    session.CurrentQuestionIndex,
// 		}
// 	}

// 	msg := services.WSMessage{
// 		Type:      services.MsgTypeSessionStatus,
// 		SessionID: session.ID,
// 		Data:      welcomeData,
// 		Timestamp: time.Now().UnixNano() / int64(time.Millisecond),
// 	}

// 	c.wsHub.BroadcastToSession(session.ID, msg)
// 	c.logger.Info("Welcome message sent", zap.String("session_id", session.ID))
// }

// func (c *websocketController) handleMessage(session *services.Session, campaignID string, message []byte) {
// 	var msg WSMessage
// 	if err := json.Unmarshal(message, &msg); err != nil {
// 		c.logger.Error("Failed to parse WebSocket message", zap.Error(err))
// 		c.sendErrorMessage(session.ID, "Invalid message format")
// 		return
// 	}

// 	// Update message timestamp if not set
// 	if msg.Timestamp == 0 {
// 		msg.Timestamp = time.Now().UnixNano() / int64(time.Millisecond)
// 	}

// 	c.logger.Debug("Processing WebSocket message",
// 		zap.String("type", msg.Type),
// 		zap.String("session_id", session.ID))

// 	// Route message based on type
// 	switch msg.Type {
// 	case MsgTypePing:
// 		c.handlePing(session, msg)
// 	case MsgTypeClientInfo:
// 		c.handleClientInfo(session, msg)
// 	case MsgTypeAudioChunk:
// 		c.handleAudioChunk(session, msg)
// 	case MsgTypeMediaChunk:
// 		c.handleMediaChunk(session, msg)
// 	case MsgTypeRecordingStart:
// 		c.handleRecordingStart(session, msg)
// 	case MsgTypeRecordingComplete:
// 		c.handleRecordingComplete(session, msg)
// 	case MsgTypeTextSubmission:
// 		c.handleTextSubmission(session, msg)
// 	case MsgTypePauseDetected:
// 		c.handlePauseDetected(session, msg)
// 	default:
// 		c.logger.Warn("Unknown message type", zap.String("type", msg.Type))
// 		c.sendErrorMessage(session.ID, fmt.Sprintf("Unknown message type: %s", msg.Type))
// 	}
// }

// func (c *websocketController) handlePing(session *services.Session, msg WSMessage) {
// 	pongMsg := services.WSMessage{
// 		Type:      services.MessageType(MsgTypePong),
// 		SessionID: session.ID,
// 		Data: map[string]interface{}{
// 			"timestamp": msg.Timestamp,
// 		},
// 		Timestamp: time.Now().UnixNano() / int64(time.Millisecond),
// 	}

// 	c.wsHub.BroadcastToSession(session.ID, pongMsg)
// }

// func (c *websocketController) handleClientInfo(session *services.Session, msg WSMessage) {
// 	c.logger.Info("Processing client info", zap.String("session_id", session.ID))

// 	// Extract and store author information in session
// 	if authorInfo, ok := msg.Data["authorInfo"].(map[string]interface{}); ok {
// 		session.AuthorInfo = authorInfo
// 		c.logger.Info("Stored author info", zap.String("session_id", session.ID))
// 	}

// 	// Extract and store media type
// 	if mediaType, ok := msg.Data["mediaType"].(string); ok {
// 		session.MediaType = mediaType
// 		c.logger.Info("Set media type",
// 			zap.String("session_id", session.ID),
// 			zap.String("media_type", mediaType))
// 	}

// 	// Send acknowledgment
// 	ackMsg := services.WSMessage{
// 		Type:      services.MessageType("client_info_received"),
// 		SessionID: session.ID,
// 		Data: map[string]interface{}{
// 			"message": "Your information has been received. Ready to begin!",
// 			"status":  "ready",
// 		},
// 		Timestamp: time.Now().UnixNano() / int64(time.Millisecond),
// 	}

// 	c.wsHub.BroadcastToSession(session.ID, ackMsg)
// }

// func (c *websocketController) handleAudioChunk(session *services.Session, msg WSMessage) {
// 	c.logger.Debug("Processing audio chunk", zap.String("session_id", session.ID))

// 	// Extract audio data
// 	audioDataInterface, ok := msg.Data["data"]
// 	if !ok {
// 		c.sendErrorMessage(session.ID, "Missing audio data")
// 		return
// 	}

// 	var audioData []byte
// 	switch v := audioDataInterface.(type) {
// 	case string:
// 		// Assume it's base64 encoded
// 		audioData = []byte(v)
// 	case []byte:
// 		audioData = v
// 	default:
// 		c.sendErrorMessage(session.ID, "Invalid audio data format")
// 		return
// 	}

// 	// Use your WSHub's ProcessAudioChunk method
// 	err := c.wsHub.ProcessAudioChunk(session.ID, audioData)
// 	if err != nil {
// 		c.logger.Error("Failed to process audio chunk",
// 			zap.String("session_id", session.ID),
// 			zap.Error(err))
// 		c.sendErrorMessage(session.ID, "Failed to process audio")
// 		return
// 	}

// 	c.logger.Debug("Audio chunk processed successfully", zap.String("session_id", session.ID))
// }

// func (c *websocketController) handleMediaChunk(session *services.Session, msg WSMessage) {
// 	c.logger.Debug("Processing media chunk", zap.String("session_id", session.ID))

// 	// Extract media data
// 	mediaData, ok := msg.Data["data"].(string)
// 	if !ok {
// 		c.sendErrorMessage(session.ID, "Missing media data")
// 		return
// 	}

// 	isLast, _ := msg.Data["isLast"].(bool)
// 	chunkID, _ := msg.Data["id"].(string)
// 	if chunkID == "" {
// 		chunkID = uuid.New().String()
// 	}

// 	// Create media chunk
// 	chunk := services.MediaChunk{
// 		ID:        chunkID,
// 		Data:      []byte(mediaData),
// 		Timestamp: time.Now(),
// 		IsLast:    isLast,
// 		MimeType:  session.MediaType,
// 	}

// 	// Add chunk to session
// 	session.AddMediaChunk(chunk)

// 	// If this is audio data, also process with AI
// 	if session.MediaType == "audio" || session.MediaType == "video" {
// 		err := c.wsHub.ProcessAudioChunk(session.ID, chunk.Data)
// 		if err != nil {
// 			c.logger.Error("Failed to process audio in media chunk", zap.Error(err))
// 		}
// 	}

// 	// If it's the last chunk, finalize the stream
// 	if isLast {
// 		err := c.wsHub.FinalizeAudioStream(session.ID)
// 		if err != nil {
// 			c.logger.Error("Failed to finalize audio stream", zap.Error(err))
// 		}
// 	}

// 	c.logger.Debug("Media chunk processed",
// 		zap.String("session_id", session.ID),
// 		zap.Bool("is_last", isLast))
// }

// func (c *websocketController) handleRecordingStart(session *services.Session, msg WSMessage) {
// 	c.logger.Info("Recording started", zap.String("session_id", session.ID))

// 	// Update session state if needed
// 	session.ProcessingStatus = "recording"

// 	// Send confirmation
// 	confirmMsg := services.WSMessage{
// 		Type:      services.MessageType("recording_started"),
// 		SessionID: session.ID,
// 		Data: map[string]interface{}{
// 			"status":    "recording",
// 			"message":   "Recording started successfully",
// 			"timestamp": time.Now().Unix(),
// 		},
// 		Timestamp: time.Now().UnixNano() / int64(time.Millisecond),
// 	}

// 	c.wsHub.BroadcastToSession(session.ID, confirmMsg)
// }

// func (c *websocketController) handleRecordingComplete(session *services.Session, msg WSMessage) {
// 	c.logger.Info("Recording completed", zap.String("session_id", session.ID))

// 	// Finalize the audio stream
// 	err := c.wsHub.FinalizeAudioStream(session.ID)
// 	if err != nil {
// 		c.logger.Error("Failed to finalize audio stream", zap.Error(err))
// 	}

// 	// The WSHub service will handle the rest of the interview completion process
// 	// including creating the testimonial and queueing AI jobs

// 	// Send completion confirmation
// 	completeMsg := services.WSMessage{
// 		Type:      services.MsgTypeInterviewComplete,
// 		SessionID: session.ID,
// 		Data: map[string]interface{}{
// 			"status":    "completed",
// 			"message":   "Recording completed successfully",
// 			"timestamp": time.Now().Unix(),
// 		},
// 		Timestamp: time.Now().UnixNano() / int64(time.Millisecond),
// 	}

// 	c.wsHub.BroadcastToSession(session.ID, completeMsg)
// }

// func (c *websocketController) handleTextSubmission(session *services.Session, msg WSMessage) {
// 	textContent, ok := msg.Data["text"].(string)
// 	if !ok {
// 		c.sendErrorMessage(session.ID, "Missing text content")
// 		return
// 	}

// 	c.logger.Info("Text testimonial submitted", zap.String("session_id", session.ID))

// 	// Set the current response in the session
// 	session.SetCurrentResponse(textContent)

// 	// Advance to next question or complete interview
// 	nextQuestion := session.AdvanceToNextQuestion()
// 	if nextQuestion != nil {
// 		// Send next question
// 		questionMsg := services.WSMessage{
// 			Type:      services.MsgTypeNextQuestion,
// 			SessionID: session.ID,
// 			Data: map[string]interface{}{
// 				"question":      nextQuestion.Text,
// 				"category":      nextQuestion.Category,
// 				"progress":      session.GetProgress(),
// 				"questionIndex": session.CurrentQuestionIndex,
// 			},
// 			Timestamp: time.Now().UnixNano() / int64(time.Millisecond),
// 		}

// 		c.wsHub.BroadcastToSession(session.ID, questionMsg)
// 	} else {
// 		// Interview complete - the session will handle creating testimonial
// 		// via the WSHub's handleInterviewComplete method
// 		completeMsg := services.WSMessage{
// 			Type:      services.MsgTypeInterviewComplete,
// 			SessionID: session.ID,
// 			Data: map[string]interface{}{
// 				"status":  "completed",
// 				"message": "Thank you! Your testimonial has been submitted.",
// 			},
// 			Timestamp: time.Now().UnixNano() / int64(time.Millisecond),
// 		}

// 		c.wsHub.BroadcastToSession(session.ID, completeMsg)
// 	}
// }

// func (c *websocketController) handlePauseDetected(session *services.Session, msg WSMessage) {
// 	duration, _ := msg.Data["duration"].(float64)
// 	if duration < 3.0 {
// 		return // Only provide hints for pauses longer than 3 seconds
// 	}

// 	c.logger.Debug("Processing pause detected",
// 		zap.String("session_id", session.ID),
// 		zap.Float64("duration", duration))

// 	currentQuestion := session.GetCurrentQuestion()
// 	if currentQuestion == nil {
// 		return
// 	}

// 	// Generate contextual hint based on current question
// 	var hint string
// 	switch currentQuestion.Category {
// 	case "problem_identification":
// 		hint = "Think about the specific challenge or pain point you were experiencing."
// 	case "solution_selection":
// 		hint = "Consider what made our solution stand out from other options."
// 	case "results_outcomes":
// 		hint = "Share specific outcomes, metrics, or improvements you've seen."
// 	default:
// 		hint = "Take your time. Feel free to share any details that come to mind."
// 	}

// 	// Send hint message
// 	hintMsg := services.WSMessage{
// 		Type:      services.MessageType("hint"),
// 		SessionID: session.ID,
// 		Data: map[string]interface{}{
// 			"text":     hint,
// 			"duration": duration,
// 		},
// 		Timestamp: time.Now().UnixNano() / int64(time.Millisecond),
// 	}

// 	c.wsHub.BroadcastToSession(session.ID, hintMsg)
// }

// func (c *websocketController) sendErrorMessage(sessionID, errorMsg string) {
// 	errMsg := services.WSMessage{
// 		Type:      services.MsgTypeError,
// 		SessionID: sessionID,
// 		Data: map[string]interface{}{
// 			"message": errorMsg,
// 		},
// 		Error:     errorMsg,
// 		Timestamp: time.Now().UnixNano() / int64(time.Millisecond),
// 	}

// 	c.wsHub.BroadcastToSession(sessionID, errMsg)
// }

// func (c *websocketController) HandleTestimonialUpload(w http.ResponseWriter, r *http.Request) {
// 	err := r.ParseMultipartForm(100 << 20) // 100 MB limit
// 	if err != nil {
// 		http.Error(w, "Unable to parse form", http.StatusBadRequest)
// 		return
// 	}

// 	campaignIDStr := r.FormValue("campaign_id")
// 	if campaignIDStr == "" {
// 		http.Error(w, "Missing campaign ID", http.StatusBadRequest)
// 		return
// 	}

// 	campaignID, err := uuid.Parse(campaignIDStr)
// 	if err != nil {
// 		http.Error(w, "Invalid campaign ID", http.StatusBadRequest)
// 		return
// 	}

// 	file, handler, err := r.FormFile("testimonial_file")
// 	if err != nil {
// 		http.Error(w, "Unable to retrieve file", http.StatusBadRequest)
// 		return
// 	}
// 	defer file.Close()

// 	// Process upload using testimonial service
// 	testimonial, err := c.testimonialService.CreateFromUpload(
// 		r.Context(),
// 		campaignID,
// 		file,
// 		handler,
// 		r.FormValue("author_name"),
// 		r.FormValue("author_email"),
// 		r.FormValue("author_company"),
// 	)

// 	if err != nil {
// 		c.logger.Error("Failed to create testimonial from upload", zap.Error(err))
// 		http.Error(w, "Failed to process upload", http.StatusInternalServerError)
// 		return
// 	}

// 	response := map[string]interface{}{
// 		"success":        true,
// 		"testimonial_id": testimonial.ID.String(),
// 		"status":         "uploaded",
// 		"message":        "File uploaded successfully",
// 	}

// 	w.Header().Set("Content-Type", "application/json")
// 	json.NewEncoder(w).Encode(response)

// 	c.logger.Info("Testimonial uploaded successfully",
// 		zap.String("testimonial_id", testimonial.ID.String()),
// 		zap.String("campaign_id", campaignID.String()))
// }
