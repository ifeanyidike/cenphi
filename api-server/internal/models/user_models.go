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
	Name          string      `json:"name"`
	Settings      interface{} `json:"settings"`
	Permissions   interface{} `json:"permissions"`
	LastActiveAt  time.Time   `json:"last_active_at"`
	CreatedAt     time.Time   `json:"created_at"`
	UpdatedAt     time.Time   `json:"updated_at,omitempty"`
}

// FullName returns the user's full name.
// func (u *User) FullName() string {
// 	return u.FirstName + " " + u.LastName
// }
