package utils

import (
	"fmt"
	"regexp"
	"strings"
)

var emailRegex = regexp.MustCompile(`^[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}$`)

func ValidateEmail(email string) error {
	if email == "" {
		return fmt.Errorf("email is required")
	}
	if !emailRegex.MatchString(strings.ToLower(email)) {
		return fmt.Errorf("invalid email format")
	}
	return nil
}

func ValidateWorkspaceName(name string) error {
	if name == "" {
		return fmt.Errorf("workspace name is required")
	}
	if len(name) < 2 {
		return fmt.Errorf("workspace name must be at least 2 characters")
	}
	if len(name) > 100 {
		return fmt.Errorf("workspace name must be less than 100 characters")
	}
	return nil
}

func ValidateTestimonialType(testimonialType string) error {
	validTypes := []string{"text", "video", "audio"}
	for _, validType := range validTypes {
		if testimonialType == validType {
			return nil
		}
	}
	return fmt.Errorf("invalid testimonial type: must be one of %v", validTypes)
}

func ValidateTestimonialStatus(status string) error {
	validStatuses := []string{"draft", "published", "archived", "processing"}
	for _, validStatus := range validStatuses {
		if status == validStatus {
			return nil
		}
	}
	return fmt.Errorf("invalid status: must be one of %v", validStatuses)
}
