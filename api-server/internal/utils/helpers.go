package utils

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"math/big"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/ifeanyidike/cenphi/internal/middleware"
)

// Helper function to extract job ID from optimization notes
func ExtractJobIDFromPbNotes(notes []string) string {
	for _, note := range notes {
		// Look for job ID in note
		if strings.Contains(note, "Processing job created:") {
			parts := strings.Split(note, ":")
			if len(parts) >= 2 {
				return strings.TrimSpace(parts[1])
			}
		}
	}

	return ""
}

// Helper function to generate a unique ID
func GenerateUniqueID() string {
	return fmt.Sprintf("%d-%d", time.Now().UnixNano(), RandomInt(10000, 99999))
}

// Helper function to generate a random integer
func RandomInt(min, max int) int {
	if max <= min {
		return min
	}
	nBig, err := rand.Int(rand.Reader, big.NewInt(int64(max-min+1)))
	if err != nil {
		// fallback to deterministic but safe value
		return min
	}
	return min + int(nBig.Int64())
}

func ToJSONMapString(input map[string]string) map[string]any {
	out := make(map[string]any)

	for k, v := range input {
		out[k] = v
	}

	return out
}

func ToStringJSONMap(input map[string]any) map[string]string {
	out := make(map[string]string, len(input))
	for k, v := range input {
		if v == nil {
			out[k] = ""
			continue
		}
		switch t := v.(type) {
		case string:
			out[k] = t
		default:
			out[k] = fmt.Sprintf("%v", t)
		}
	}
	return out
}

func GetStringValue(s *string) string {
	if s != nil {
		return *s
	}
	return ""
}

func StringToFloat32Ptr(str string) *float32 {
	if str == "" {
		return nil
	}
	if val, err := strconv.ParseFloat(str, 32); err == nil {
		f32 := float32(val)
		return &f32
	}
	return nil
}

func StringPtr(s string) *string {
	return &s
}

func GetString(payload map[string]any, key string) string {
	if val, ok := payload[key].(string); ok {
		return val
	}
	return ""
}

func GetBool(payload map[string]any, key string) bool {
	if val, ok := payload[key].(bool); ok {
		return val
	}
	return false
}

func GetInt32(payload map[string]any, key string) int32 {
	v, ok := payload[key]
	if !ok || v == nil {
		return 0
	}
	switch t := v.(type) {
	case float64:
		return int32(t)
	case float32:
		return int32(t)
	case int:
		return int32(t)
	case int32:
		return t
	case int64:
		return int32(t)
	case json.Number:
		if i64, err := t.Int64(); err == nil {
			return int32(i64)
		}
		if f, err := t.Float64(); err == nil {
			return int32(f)
		}
	case string:
		if i, err := strconv.Atoi(t); err == nil {
			return int32(i)
		}
	}
	return 0
}

func GetFloat32(payload map[string]any, key string) float32 {
	if val, ok := payload[key].(float64); ok {
		return float32(val)
	}
	if val, ok := payload[key].(float32); ok {
		return val
	}
	return 0.0
}

func GetStringArray(payload map[string]any, key string) []string {
	if val, ok := payload[key].([]interface{}); ok {
		result := make([]string, 0, len(val))
		for _, v := range val {
			if str, ok := v.(string); ok {
				result = append(result, str)
			}
		}
		return result
	}
	return []string{}
}

func GetStringMap(payload map[string]any, key string) map[string]string {
	if val, ok := payload[key].(map[string]interface{}); ok {
		result := make(map[string]string)
		for k, v := range val {
			if str, ok := v.(string); ok {
				result[k] = str
			}
		}
		return result
	}
	return map[string]string{}
}

func GenerateFilename(mediaType string) string {
	timestamp := time.Now().Unix()
	randomBytes := make([]byte, 8)
	rand.Read(randomBytes)
	randomString := hex.EncodeToString(randomBytes)

	extension := getExtensionFromMediaType(mediaType)
	return fmt.Sprintf("%d_%s%s", timestamp, randomString, extension)
}

func getExtensionFromMediaType(mediaType string) string {
	switch {
	case strings.HasPrefix(mediaType, "video/"):
		return ".mp4"
	case strings.HasPrefix(mediaType, "audio/"):
		return ".mp3"
	case strings.HasPrefix(mediaType, "text/"):
		return ".txt"
	default:
		return ".bin"
	}
}

func GetInt(payload map[string]any, key string) (int, bool) {
	v, ok := payload[key]
	if !ok || v == nil {
		return 0, false
	}
	switch t := v.(type) {
	case int:
		return t, true
	case int32:
		return int(t), true
	case int64:
		return int(t), true
	case float64:
		return int(t), true
	case string:
		if i, err := strconv.Atoi(t); err == nil {
			return i, true
		}
		return 0, false
	default:
		return 0, false
	}
}

// CleanAIJSONResponse removes markdown code block wrappers from AI responses
// Handles formats like:
//   ```json
//   [{"text": "...", ...}]
//   ```
// or just:
//   ```
//   [{"text": "...", ...}]
//   ```
func CleanAIJSONResponse(response string) string {
	// Trim whitespace
	response = strings.TrimSpace(response)

	// Remove markdown code block markers
	// Pattern 1: ```json ... ```
	if strings.HasPrefix(response, "```json") {
		response = strings.TrimPrefix(response, "```json")
		response = strings.TrimSpace(response)
	}

	// Pattern 2: ``` ... ```
	if strings.HasPrefix(response, "```") {
		response = strings.TrimPrefix(response, "```")
		response = strings.TrimSpace(response)
	}

	// Remove trailing code block marker
	if strings.HasSuffix(response, "```") {
		response = strings.TrimSuffix(response, "```")
		response = strings.TrimSpace(response)
	}

	return response
}

// GetUserID extracts the user ID from the request context
// Returns the user ID string set by the auth middleware
func GetUserID(r *http.Request) string {
	userID, ok := r.Context().Value(middleware.UserKey).(string)
	if !ok {
		return ""
	}
	return userID
}
