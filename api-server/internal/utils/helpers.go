package utils

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"strconv"
	"strings"
	"time"
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
	return min + time.Now().Nanosecond()%(max-min)
}

func ToJSONMapString(input map[string]string) map[string]any {
	out := make(map[string]any)

	for k, v := range input {
		out[k] = v
	}

	return out
}

func ToStringJSONMap(input map[string]any) map[string]string {
	out := make(map[string]string)

	for k, v := range input {
		out[k] = v.(string)
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
	if val, ok := payload[key].(float64); ok {
		return int32(val)
	}
	if val, ok := payload[key].(int); ok {
		return int32(val)
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
