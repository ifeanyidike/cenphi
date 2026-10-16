package controllers

import (
	"context"
	"errors"
	"testing"

	"github.com/DATA-DOG/go-sqlmock"
)

const accessQueryPattern = `SELECT EXISTS \(\s*SELECT 1 FROM \(\s*SELECT workspace_id FROM processing_sessions WHERE id = \$1::uuid\s*UNION ALL\s*SELECT workspace_id FROM testimonials WHERE metadata->>'session_id' = \$1::text\s*\) target\s*JOIN team_members tm ON tm.workspace_id = target.workspace_id\s*JOIN users u ON u.id = tm.user_id\s*WHERE u.firebase_uid = \$2\s*\)`

func TestCanStreamSession(t *testing.T) {
	for _, allowed := range []bool{true, false} {
		db, mock, err := sqlmock.New()
		if err != nil {
			t.Fatal(err)
		}
		mock.ExpectQuery(accessQueryPattern).WithArgs("a8fbb324-bb0f-4ab0-9723-aa52434927cd", "firebase-user").WillReturnRows(sqlmock.NewRows([]string{"exists"}).AddRow(allowed))
		got, err := canStreamSession(context.Background(), db, "a8fbb324-bb0f-4ab0-9723-aa52434927cd", "firebase-user")
		if err != nil || got != allowed {
			t.Fatalf("access result %v, %v", got, err)
		}
		if err := mock.ExpectationsWereMet(); err != nil {
			t.Fatal(err)
		}
		db.Close()
	}
}

func TestCanStreamSessionFailsClosedOnDatabaseError(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatal(err)
	}
	defer db.Close()
	mock.ExpectQuery(accessQueryPattern).WithArgs("a8fbb324-bb0f-4ab0-9723-aa52434927cd", "firebase-user").WillReturnError(errors.New("database unavailable"))
	allowed, err := canStreamSession(context.Background(), db, "a8fbb324-bb0f-4ab0-9723-aa52434927cd", "firebase-user")
	if err == nil || allowed {
		t.Fatal("database error granted stream access")
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatal(err)
	}
}
