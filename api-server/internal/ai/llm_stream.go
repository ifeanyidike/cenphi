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

// func (s *AIClient) streamOpenAI(ctx context.Context, prompt, systemPrompt string, resultChan chan<- StreamChunk) error {
// 	log.Println("calling openai stream")
// 	resp, err := s.makeOpenAICallV2(ctx, prompt, systemPrompt, true)
// 	if err != nil {
// 		return err
// 	}

// 	defer resp.Body.Close()
// 	log.Println("made openai http call")
// 	if resp.StatusCode != http.StatusOK {
// 		return fmt.Errorf("OpenAI API error: %s", resp.Status)
// 	}
// 	log.Println("scanning openai buf")
// 	scanner := bufio.NewScanner(resp.Body)
// 	for scanner.Scan() {
// 		line := scanner.Text()

// 		if after, ok := strings.CutPrefix(line, "data: "); ok {
// 			data := after

// 			if data == "[DONE]" {
// 				resultChan <- StreamChunk{IsComplete: true}
// 				return nil
// 			}

// 			var streamResp struct {
// 				Choices []struct {
// 					Delta struct {
// 						Content string `json:"content"`
// 					} `json:"delta"`
// 				} `json:"choices"`
// 			}

// 			if err := json.Unmarshal([]byte(data), &streamResp); err != nil {
// 				continue
// 			}
// 			if len(streamResp.Choices) > 0 {
// 				content := streamResp.Choices[0].Delta.Content
// 				if content != "" {
// 					resultChan <- StreamChunk{Content: content, IsPartial: true}
// 				}
// 			}
// 		}
// 	}

// 	return scanner.Err()
// }

func (s *AIClient) streamOpenAI(ctx context.Context, prompt, systemPrompt string, resultChan chan<- StreamChunk) error {
	// request the stream
	resp, err := s.makeOpenAICallV2(ctx, prompt, systemPrompt, true)
	if err != nil {
		return fmt.Errorf("makeOpenAICallV2(stream) error: %w", err)
	}
	if resp == nil {
		return fmt.Errorf("no response from OpenAI stream")
	}
	// Do not defer close here if you want caller to control lifetime,
	// but in this function we own it:
	defer resp.Body.Close()

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

	for scanner.Scan() {
		line := scanner.Text()

		// server may send blank lines - skip
		if line == "" {
			continue
		}

		// Example SSE line: "data: {...json...}"
		// there may be multiple "data: " occurrences per line; split and handle each
		parts := strings.SplitSeq(line, "data: ")
		for p := range parts {
			p = strings.TrimSpace(p)
			if p == "" {
				continue
			}
			if p == "[DONE]" {
				// done
				resultChan <- StreamChunk{IsComplete: true}
				return nil
			}

			// Try several parsing strategies, prefer Responses API shape
			// 1) Try ResponsesAPIResponse extract
			if t, err := extractTextFromResponsesBytes([]byte(p)); err == nil && t != "" {
				// we got something
				resultChan <- StreamChunk{Content: t, IsPartial: true}
				continue
			}

			// 2) Try Chat-completions style chunk: {"choices":[{"delta":{"content":"..."}}]}
			var ccChunk struct {
				Choices []struct {
					Delta struct {
						Content string `json:"content"`
					} `json:"delta"`
				} `json:"choices"`
			}
			if err := json.Unmarshal([]byte(p), &ccChunk); err == nil {
				if len(ccChunk.Choices) > 0 {
					content := ccChunk.Choices[0].Delta.Content
					if content != "" {
						resultChan <- StreamChunk{Content: content, IsPartial: true}
						continue
					}
				}
			}

			// 3) Generic fallback: look for "text" fields nested under "output"
			var generic map[string]interface{}
			if err := json.Unmarshal([]byte(p), &generic); err == nil {
				// attempt shallow extraction of text
				if out, ok := generic["output"].([]interface{}); ok {
					for _, o := range out {
						if om, ok := o.(map[string]interface{}); ok {
							if content, ok := om["content"].([]interface{}); ok {
								for _, ci := range content {
									if cim, ok := ci.(map[string]interface{}); ok {
										if t, ok := cim["text"].(string); ok && t != "" {
											resultChan <- StreamChunk{Content: t, IsPartial: true}
										}
									}
								}
							}
						}
					}
				}
			}
		}
	}

	// return scanner error (if any)
	if err := scanner.Err(); err != nil {
		return fmt.Errorf("error reading OpenAI stream: %w", err)
	}
	// If stream ends without explicit [DONE], signal completion
	resultChan <- StreamChunk{IsComplete: true}
	return nil
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
