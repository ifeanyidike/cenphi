// internal/services/sentiment_service.go
package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/ifeanyidike/cenphi/internal/contracts"
	"github.com/ifeanyidike/cenphi/pb"
	// "github.com/ifeanyidike/cenphi/internal/pb"
)

// sentimentService provides sentiment analysis for text
type sentimentService struct {
	grpcClient  *pb.IntelligenceClient
	httpClient  *http.Client
	apiKey      string
	enableCache bool
}

func NewSentimentService(grpcClient *pb.IntelligenceClient, apiKey string, enableCache bool) contracts.SentimentService {
	return &sentimentService{
		grpcClient:  grpcClient,
		httpClient:  &http.Client{Timeout: 10 * time.Second},
		apiKey:      apiKey,
		enableCache: enableCache,
	}
}

// AnalyzeText returns a sentiment score between -1 (very negative) and 1 (very positive)
func (s *sentimentService) AnalyzeText(text string) (float64, error) {
	// Skip empty text
	if strings.TrimSpace(text) == "" {
		return 0, fmt.Errorf("empty text")
	}

	// // Use GRPC client if available
	// if s.grpcClient != nil {
	// 	return s.analyzeWithGRPC(text)
	// }

	// // Otherwise use OpenAI API
	// return s.analyzeWithOpenAI(text)
	return 0, nil
}

func (s *sentimentService) AnalyzeWithGRPC(text string) (float64, error) {
	// ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	// defer cancel()

	// request := &pb.SentimentRequest{
	// 	Text: text,
	// }

	// response, err := (*s.grpcClient).AnalyzeSentiment(ctx, request)
	// if err != nil {
	// 	return 0, fmt.Errorf("GRPC sentiment analysis failed: %w", err)
	// }

	// return response.Score, nil
	return 0, nil
}

func (s *sentimentService) AnalyzeWithOpenAI(text string) (float64, error) {
	// Format the request for the OpenAI API
	requestBody, err := json.Marshal(map[string]interface{}{
		"model": "gpt-3.5-turbo-0125",
		"messages": []map[string]string{
			{
				"role":    "system",
				"content": "You are a sentiment analysis tool. Given a text, rate its sentiment on a scale from -1 (extremely negative) to 1 (extremely positive). Return only the numeric value, no other text.",
			},
			{
				"role":    "user",
				"content": text,
			},
		},
		"temperature": 0.1,
	})
	if err != nil {
		return 0, fmt.Errorf("failed to marshal OpenAI request: %w", err)
	}

	// Create the HTTP request
	req, err := http.NewRequest("POST", "https://api.openai.com/v1/chat/completions", bytes.NewBuffer(requestBody))
	if err != nil {
		return 0, fmt.Errorf("failed to create OpenAI request: %w", err)
	}

	// Set the headers
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+s.apiKey)

	// Make the request
	resp, err := s.httpClient.Do(req)
	if err != nil {
		return 0, fmt.Errorf("OpenAI request failed: %w", err)
	}
	defer resp.Body.Close()

	// Check the response status
	if resp.StatusCode != http.StatusOK {
		return 0, fmt.Errorf("OpenAI returned status %d", resp.StatusCode)
	}

	// Parse the response
	var result struct {
		Choices []struct {
			Message struct {
				Content string `json:"content"`
			} `json:"message"`
		} `json:"choices"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return 0, fmt.Errorf("failed to decode OpenAI response: %w", err)
	}

	if len(result.Choices) == 0 {
		return 0, fmt.Errorf("empty response from OpenAI")
	}

	// Parse the sentiment score
	var score float64
	content := strings.TrimSpace(result.Choices[0].Message.Content)
	_, err = fmt.Sscanf(content, "%f", &score)
	if err != nil {
		return 0, fmt.Errorf("failed to parse sentiment score from '%s': %w", content, err)
	}

	// Validate the score is in the expected range
	if score < -1 || score > 1 {
		return 0, fmt.Errorf("sentiment score %f is outside the expected range [-1, 1]", score)
	}

	return score, nil
}

// IsPotentialTestimonial checks if a text is likely to be a testimonial
func (s *sentimentService) IsPotentialTestimonial(text string) (bool, float64, error) {
	// Skip short texts
	if len(strings.Split(text, " ")) < 5 {
		return false, 0, nil
	}

	// Analyze sentiment
	score, err := s.AnalyzeText(text)
	if err != nil {
		return false, 0, err
	}

	// Consider positive texts as potential testimonials
	return score > 0.3, score, nil
}
