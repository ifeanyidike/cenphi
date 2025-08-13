package models

import (
	"time"

	"github.com/google/uuid"
)

// User represents a user in the system.
type User struct {
	ID            uuid.UUID  `json:"id" db:"id"`
	FirebaseUID   string     `json:"firebase_uid" db:"firebase_uid"`
	Email         string     `json:"email" db:"email"`
	EmailVerified bool       `json:"email_verified" db:"email_verified"`
	Name          string     `json:"name" db:"name"`
	Settings      JSONMap    `json:"settings" db:"settings"`
	LastActiveAt  *time.Time `json:"last_active_at" db:"last_active_at"`
	UpdatedAt     time.Time  `json:"updated_at" db:"updated_at"`
	CreatedAt     time.Time  `json:"created_at" db:"created_at"`
}

// FullName returns the user's full name.
// func (u *User) FullName() string {
// 	return u.FirstName + " " + u.LastName
// }
