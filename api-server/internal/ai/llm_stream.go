package ai

import (
	"bufio"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"strings"
)

type StreamChunk struct {
	Content    string `json:"content"`
	IsPartial  bool   `json:"is_partial"`
	IsComplete bool   `json:"is_complete"`
	Error      error  `json:"error"`
}

func (s *AIClient) Stream(ctx context.Context, prompt, systemPrompt string) (<-chan StreamChunk, error) {
	resultChan := make(chan StreamChunk, 10)
	log.Println("Streaming...")
	go func() {
		defer close(resultChan)

		// Try OpenAI first
		if err := s.streamOpenAI(ctx, prompt, systemPrompt, resultChan); err != nil {
			// Fall back to claude
			if err := s.streamClaude(ctx, prompt, systemPrompt, resultChan); err != nil {
				resultChan <- StreamChunk{Error: fmt.Errorf("both openai and claude failed: %w", err)}
				return
			}
		}
	}()

	return resultChan, nil
}

func (s *AIClient) streamOpenAI(ctx context.Context, prompt, systemPrompt string, resultChan chan<- StreamChunk) error {
	log.Println("Starting OpenAI stream with Responses API...")

	// request the stream
	resp, err := s.makeOpenAICallV2(ctx, prompt, systemPrompt, true)
	if err != nil {
		return fmt.Errorf("makeOpenAICallV2(stream) error: %w", err)
	}
	if resp == nil {
		return fmt.Errorf("no response from OpenAI stream")
	}
	defer resp.Body.Close()

	log.Printf("OpenAI stream response status: %d", resp.StatusCode)

	// OpenAI streaming still uses 200 on success; otherwise read error body and return
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		errBody, _ := io.ReadAll(io.LimitReader(resp.Body, 1<<20))
		return fmt.Errorf("openai stream error status %d: %s", resp.StatusCode, string(errBody))
	}

	// Use a scanner but increase buffer size for large SSE lines
	scanner := bufio.NewScanner(resp.Body)
	// set maximum token size (e.g., 512 KiB)
	maxToken := 512 * 1024
	buf := make([]byte, 0, 64*1024)
	scanner.Buffer(buf, maxToken)

	log.Println("Starting to scan OpenAI stream...")

	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())

		// server may send blank lines - skip
		if line == "" {
			continue
		}

		// Handle SSE format: "data: {...json...}"
		if strings.HasPrefix(line, "data: ") {
			data := strings.TrimPrefix(line, "data: ")
			data = strings.TrimSpace(data)

			if data == "" {
				continue
			}

			if data == "[DONE]" {
				log.Println("OpenAI stream completed with [DONE]")
				resultChan <- StreamChunk{IsComplete: true}
				return nil
			}

			// Check for completion events first
			var chunk map[string]interface{}
			if err := json.Unmarshal([]byte(data), &chunk); err == nil {
				if eventType, ok := chunk["type"].(string); ok {
					switch eventType {
					case "response.output_item.done", "response.done":
						log.Printf("Stream completion event: %s", eventType)
						resultChan <- StreamChunk{IsComplete: true}
						return nil
					}
				}
			}

			// Try parsing as Responses API format first
			if content := s.parseResponsesAPIChunk(data); content != "" {
				resultChan <- StreamChunk{Content: content, IsPartial: true}
				continue
			}

			// Fallback: Try Chat-completions style chunk
			if content := s.parseChatCompletionsChunk(data); content != "" {
				resultChan <- StreamChunk{Content: content, IsPartial: true}
				continue
			}

			// // Log if we couldn't parse the chunk
			// log.Printf("Could not parse chunk: %q", data)
		}

		// Handle event lines (like "event: response.output_item.done")
		if strings.HasPrefix(line, "event: ") {
			event := strings.TrimPrefix(line, "event: ")
			if event == "response.output_item.done" || event == "response.done" {
				// Next data line should contain completion info
				continue
			}
		}
	}

	// Check for scanner errors
	if err := scanner.Err(); err != nil {
		return fmt.Errorf("error reading OpenAI stream: %w", err)
	}

	// If stream ends without explicit completion, signal completion
	log.Println("OpenAI stream ended without explicit completion")
	resultChan <- StreamChunk{IsComplete: true}
	return nil
}

// parseResponsesAPIChunk tries to parse a chunk using the Responses API format
func (s *AIClient) parseResponsesAPIChunk(data string) string {
	var chunk map[string]interface{}
	if err := json.Unmarshal([]byte(data), &chunk); err != nil {
		return ""
	}

	// Handle different streaming event types
	eventType, ok := chunk["type"].(string)
	if !ok {
		return ""
	}

	switch eventType {
	case "response.output_text.delta":
		// Extract delta content for streaming
		if delta, ok := chunk["delta"].(string); ok && delta != "" {
			// log.Printf("Delta content: %q", delta)
			return delta
		}

	case "response.content_part.done":
		// Extract full text when part is complete
		if part, ok := chunk["part"].(map[string]interface{}); ok {
			if text, ok := part["text"].(string); ok && text != "" {
				log.Printf("Part completed with full text length: %d", len(text))
				// Return empty string here since we want streaming chunks, not full text
				// If you want the full text at the end, you could handle this differently
				return ""
			}
		}

	case "response.output_item.done":
		// Handle completion - this indicates the stream is done
		log.Println("Output item completed")
		return ""

	case "response.done":
		// Handle final completion
		log.Println("Response completely done")
		return ""
	}

	// Try fallback parsing for other formats
	if text, err := extractTextFromResponsesBytes([]byte(data)); err == nil && strings.TrimSpace(text) != "" {
		return text
	}

	return ""
}

// parseChatCompletionsChunk tries to parse a chunk using Chat Completions format
func (s *AIClient) parseChatCompletionsChunk(data string) string {
	var ccChunk struct {
		Choices []struct {
			Delta struct {
				Content string `json:"content"`
			} `json:"delta"`
		} `json:"choices"`
	}

	if err := json.Unmarshal([]byte(data), &ccChunk); err == nil {
		if len(ccChunk.Choices) > 0 {
			content := ccChunk.Choices[0].Delta.Content
			if content != "" {
				return content
			}
		}
	}

	return ""
}

func (s *AIClient) streamClaude(ctx context.Context, prompt, systemPrompt string, resultChan chan<- StreamChunk) error {
	resp, err := s.makeClaudeCall(ctx, prompt, systemPrompt, true)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("claude API error: %s", resp.Status)
	}

	scanner := bufio.NewScanner(resp.Body)

	for scanner.Scan() {
		line := scanner.Text()
		if strings.HasPrefix(line, "data: ") {
			data := strings.TrimPrefix(line, "data: ")
			var streamResp struct {
				Type  string `json:"type"`
				Delta struct {
					Type string `json:"type"`
					Text string `json:"text"`
				} `json:"delta"`
			}

			if err := json.Unmarshal([]byte(data), &streamResp); err != nil {
				continue
			}

			if streamResp.Type == "content_block_delta" && streamResp.Delta.Type == "text_delta" {
				log.Printf("Generated content claude %s", streamResp.Delta.Text)
				resultChan <- StreamChunk{Content: streamResp.Delta.Text, IsPartial: true}
			} else if streamResp.Type == "message_stop" {
				resultChan <- StreamChunk{IsComplete: true}
				return nil
			}
		}
	}
	return scanner.Err()
}
