package controllers

import (
	"context"
	"database/sql"
)

// A valid login is not sufficient: the session belongs to a workspace.
func canStreamSession(ctx context.Context, db *sql.DB, sessionID, firebaseUID string) (bool, error) {
	var allowed bool
	err := db.QueryRowContext(ctx, `
  SELECT EXISTS (
   SELECT 1 FROM (
    SELECT workspace_id FROM processing_sessions WHERE id = $1::uuid
    UNION ALL
    SELECT workspace_id FROM testimonials WHERE metadata->>'session_id' = $1::text
   ) target
   JOIN team_members tm ON tm.workspace_id = target.workspace_id
   JOIN users u ON u.id = tm.user_id
   WHERE u.firebase_uid = $2
  )`, sessionID, firebaseUID).Scan(&allowed)
	return allowed, err
}
