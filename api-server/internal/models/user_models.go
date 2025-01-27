package models

import (
	"time"

	"github.com/google/uuid"
)

// User represents a user in the system.
type User struct {
	ID            uuid.UUID   `json:"id"`
	Email         string      `json:"email"`
	EmailVerified bool        `json:"email_verified"`
	FirebaseUID   string      `json:"firebase_uid"`
	FirstName     string      `json:"first_name"`
	LastName      string      `json:"last_name"`
	Settings      interface{} `json:"settings"`
	Permissions   interface{} `json:"permissions"`
	LastActive    time.Time   `json:"last_active"`
	CreatedAt     time.Time   `json:"created_at"`
	UpdatedAt     time.Time   `json:"updated_at,omitempty"`
}

// FullName returns the user's full name.
func (u *User) FullName() string {
	return u.FirstName + " " + u.LastName
}
