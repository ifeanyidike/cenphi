package ai

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"strings"
	"time"
)

// type OpenAIResponse struct {
// 	Choices []Choice  `json:"choices"`
// 	Error   *APIError `json:"error,omitempty"`
// }

func (ai AIClient) Complete(ctx context.Context, prompt, systemPrompt string) (string, error) {
	// Try OpenAI first
	response, err := ai.callOpenAI(ctx, prompt, systemPrompt)
	if err == nil {
		log.Println("✅ OpenAI completed successfully")
		return response, nil
	}

	// Log OpenAI failure reason before falling back to Claude
	log.Printf("⚠️ OpenAI failed (falling back to Claude): %v", err)

	// Fallback to Claude
	return ai.callClaude(ctx, prompt, systemPrompt)
}

// func (s AIClient) callOpenAI(ctx context.Context, prompt, systemPrompt string) (string, error) {
// 	resp, err := s.makeOpenAICall(ctx, prompt, systemPrompt, false)
// 	if err != nil {
// 		fmt.Printf("an error occurred when making open ai call %s\n", err)
// 		return "", fmt.Errorf("an error occurred when making open ai call %s", err)
// 	}

// 	if resp.StatusCode != http.StatusOK {
// 		fmt.Printf("open ai returned with status %s\n", resp.Status)
// 		bodyBytes, _ := io.ReadAll(resp.Body)
// 		resp.Body.Close()
// 		return "", fmt.Errorf("openai error: status %d: %s", resp.StatusCode, string(bodyBytes))
// 	}
// 	defer resp.Body.Close()

// 	// Read the entire response body first for debugging
// 	body, err := io.ReadAll(resp.Body)
// 	if err != nil {
// 		fmt.Printf("failed to read response body: %s\n", err)
// 		return "", fmt.Errorf("failed to read response body: %w", err)
// 	}

// 	// Check if response body is empty
// 	if len(body) == 0 {
// 		fmt.Println("received empty response from OpenAI")
// 		return "", fmt.Errorf("received empty response from OpenAI")
// 	}

// 	var response OpenAIResponse
// 	if err := json.Unmarshal(body, &response); err != nil {
// 		fmt.Printf("failed to unmarshal response: %s\n", err)
// 		return "", fmt.Errorf("failed to unmarshal response: %w", err)
// 	}

// 	// Safe error checking
// 	if response.Error != nil && response.Error.Message != "" {
// 		fmt.Printf("OpenAI error: %s\n", response.Error.Message)
// 		return "", fmt.Errorf("OpenAI error: %s", response.Error.Message)
// 	}

// 	if len(response.Choices) == 0 {
// 		fmt.Println("no completion generated")
// 		return "", fmt.Errorf("no completion generated")
// 	}

// 	// Safe content access
// 	content := response.Choices[0].Message.Content
// 	if content == "" {
// 		fmt.Println("empty content returned")
// 		return "", fmt.Errorf("empty content returned")
// 	}

// 	fmt.Printf("response: %#v\n", response)
// 	return content, nil
// }

func (s AIClient) callOpenAI(ctx context.Context, prompt, systemPrompt string) (string, error) {
	resp, err := s.makeOpenAICallV2(ctx, prompt, systemPrompt, false)
	if err != nil {
		return "", fmt.Errorf("makeOpenAICallV2 error: %w", err)
	}
	if resp == nil {
		return "", fmt.Errorf("no response from OpenAI")
	}
	// ensure body closed
	defer resp.Body.Close()

	// on non-2xx, read a limited error body and return
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		errBody, _ := io.ReadAll(io.LimitReader(resp.Body, 1<<20)) // 1 MiB
		return "", fmt.Errorf("openai error status %d: %s", resp.StatusCode, string(errBody))
	}

	// read limited body to avoid OOM
	bodyBytes, err := io.ReadAll(io.LimitReader(resp.Body, 4<<20)) // 4 MiB
	if err != nil {
		return "", fmt.Errorf("failed to read response body: %w", err)
	}
	if len(bodyBytes) == 0 {
		return "", fmt.Errorf("empty response body from OpenAI")
	}

	// 1) Try the Responses API extractor (preferred)
	text, err := extractTextFromResponsesBytes(bodyBytes)
	if err == nil && strings.TrimSpace(text) != "" {
		return text, nil
	}

	// 2) Fallback: try to unmarshal into the ResponsesAPIResponse and inspect other content items
	var r ResponsesAPIResponse
	if err := json.Unmarshal(bodyBytes, &r); err == nil {
		// try to extract any text-like fields generically
		var parts []string
		for _, out := range r.Output {
			for _, c := range out.Content {
				// common keys: output_text (in Text), or other types might include "title", "url", etc.
				if c.Text != "" {
					parts = append(parts, c.Text)
				} else {
					// if ContentItem is extended, marshal it back to raw JSON and append that (for debugging)
					if raw, err := json.Marshal(c); err == nil {
						parts = append(parts, string(raw))
					}
				}
			}
		}
		if len(parts) > 0 {
			return strings.Join(parts, "\n"), nil
		}
	}

	// 3) Fallback: try the chat-completions compatibility shape (choices[].message.content or choices[].text)
	var legacy struct {
		Choices []struct {
			Message struct {
				Content string `json:"content"`
			} `json:"message"`
			Text string `json:"text"`
		} `json:"choices"`
	}
	if err := json.Unmarshal(bodyBytes, &legacy); err == nil {
		if len(legacy.Choices) > 0 {
			if legacy.Choices[0].Message.Content != "" {
				return legacy.Choices[0].Message.Content, nil
			}
			if legacy.Choices[0].Text != "" {
				return legacy.Choices[0].Text, nil
			}
		}
	}

	// Nothing useful found — return raw body for debugging
	// trim to a reasonable size in the error message
	snip := string(bodyBytes)
	if len(snip) > 2000 {
		snip = snip[:2000] + "...(truncated)"
	}
	return "", fmt.Errorf("openai returned empty text; raw response: %s", snip)
}

func (s AIClient) callClaude(ctx context.Context, prompt, systemPrompt string) (string, error) {
	log.Println("📞 Calling Claude API...")
	startTime := time.Now()

	resp, err := s.makeClaudeCall(ctx, prompt, systemPrompt, false)
	if err != nil {
		duration := time.Since(startTime)
		log.Printf("❌ Claude API call failed after %v: %v", duration, err)
		return "", err
	}

	log.Printf("✅ Claude API call completed in %v", time.Since(startTime))

	if resp.StatusCode != http.StatusOK {
		// Read and discard error response body
		io.ReadAll(resp.Body)
		resp.Body.Close()
		return "", fmt.Errorf("claude API error: %s", resp.Status)
	}
	defer resp.Body.Close()

	// Read response body
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("failed to read response body: %w", err)
	}

	// Correct Claude API v3 response structure
	var response struct {
		Content []struct {
			Type string `json:"type"`
			Text string `json:"text"`
		} `json:"content"`
		Role       string `json:"role"`
		Model      string `json:"model"`
		StopReason string `json:"stop_reason"`
		Usage      struct {
			InputTokens  int `json:"input_tokens"`
			OutputTokens int `json:"output_tokens"`
		} `json:"usage"`
		Type  string `json:"type"`
		Error struct {
			Type    string `json:"type"`
			Message string `json:"message"`
		} `json:"error"`
	}

	if err := json.Unmarshal(body, &response); err != nil {
		return "", fmt.Errorf("failed to decode Claude response: %w", err)
	}

	if response.Error.Message != "" {
		return "", fmt.Errorf("claude error: %s", response.Error.Message)
	}

	if len(response.Content) == 0 {
		return "", fmt.Errorf("no completion generated")
	}

	// Find the text content
	for _, content := range response.Content {
		if content.Type == "text" {
			return content.Text, nil
		}
	}

	return "", fmt.Errorf("no text content found in response")
}
