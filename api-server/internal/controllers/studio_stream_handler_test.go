package controllers

import (
	"context"
	"database/sql"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/ifeanyidike/cenphi/internal/middleware"
	"github.com/ifeanyidike/cenphi/internal/models"
	"github.com/ifeanyidike/cenphi/internal/repositories"
	"github.com/ifeanyidike/cenphi/internal/sse"
	"go.uber.org/zap"
)

func TestStudioStreamDeniesBeforeOpening(t *testing.T) {
	const session = "a8fbb324-bb0f-4ab0-9723-aa52434927cd"
	for _, test := range []struct {
		name, id, user string
		allowed        bool
		queryErr       error
		restoreErr     error
		stageErr       error
		status         int
	}{
		{name: "anonymous", id: session, status: http.StatusUnauthorized},
		{name: "invalid session", id: "not-a-uuid", user: "alice", status: http.StatusBadRequest},
		{name: "other workspace", id: session, user: "alice", status: http.StatusForbidden},
		{name: "session restoration failure", id: session, user: "alice", allowed: true, restoreErr: errors.New("unavailable"), status: http.StatusInternalServerError},
		{name: "stage restoration failure", id: session, user: "alice", allowed: true, stageErr: errors.New("unavailable"), status: http.StatusInternalServerError},
		{name: "database failure", id: session, user: "alice", queryErr: errors.New("unavailable"), status: http.StatusInternalServerError},
	} {
		t.Run(test.name, func(t *testing.T) {
			db, mock, err := sqlmock.New()
			if err != nil {
				t.Fatal(err)
			}
			defer db.Close()
			if test.user != "" && test.id == session {
				query := mock.ExpectQuery("SELECT EXISTS").WithArgs(session, test.user)
				if test.queryErr != nil {
					query.WillReturnError(test.queryErr)
				} else {
					query.WillReturnRows(sqlmock.NewRows([]string{"exists"}).AddRow(test.allowed))
				}
			}
			ctx := chi.NewRouteContext()
			ctx.URLParams.Add("sessionID", test.id)
			request := httptest.NewRequest(http.MethodGet, "/studio/sessions/"+test.id+"/stream", nil)
			request = request.WithContext(context.WithValue(request.Context(), chi.RouteCtxKey, ctx))
			if test.user != "" {
				request = request.WithContext(context.WithValue(request.Context(), middleware.UserKey, test.user))
			}
			writer := httptest.NewRecorder()
			// No SSE manager or repository is installed: an unauthorized request must
			// return before touching either, not merely write an error and continue.
			controller := StudioController{db: db, logger: zap.NewNop()}
			if test.allowed {
				controller.sseManager = &sse.SSEManager{}
				controller.sessionRepo = failingStreamSessionRepo{err: test.restoreErr}
				controller.stageRepo = failingStreamStageRepo{err: test.stageErr}
			}
			controller.StreamStudioEvents(writer, request)
			if writer.Code != test.status {
				t.Fatalf("got %d, want %d", writer.Code, test.status)
			}
			if writer.Header().Get("Content-Type") == "text/event-stream" {
				t.Fatal("denied request opened a stream")
			}
			if err := mock.ExpectationsWereMet(); err != nil {
				t.Fatal(err)
			}
		})
	}
}

// Embed unused methods so a test cannot accidentally execute an application
// repository. These two methods are the restoration I/O boundary.
type failingStreamSessionRepo struct {
	repositories.ProcessingSessionRepository
	err error
}

func (r failingStreamSessionRepo) GetByID(_ context.Context, id uuid.UUID, _ *sql.DB) (*models.ProcessingSession, error) {
	return &models.ProcessingSession{ID: id}, r.err
}

type failingStreamStageRepo struct {
	repositories.ProcessingStageRepository
	err error
}

func (r failingStreamStageRepo) GetBySessionID(context.Context, uuid.UUID, *sql.DB) ([]*models.ProcessingStage, error) {
	return nil, r.err
}

func TestStudioCompressionIDDoesNotRequireProcessingSessionRow(t *testing.T) {
	const session = "a8fbb324-bb0f-4ab0-9723-aa52434927cd"
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatal(err)
	}
	defer db.Close()
	mock.ExpectQuery(accessQueryPattern).WithArgs(session, "alice").WillReturnRows(sqlmock.NewRows([]string{"exists"}).AddRow(true))
	ctx := chi.NewRouteContext()
	ctx.URLParams.Add("sessionID", session)
	request := httptest.NewRequest(http.MethodGet, "/studio/sessions/"+session+"/stream", nil)
	request = request.WithContext(context.WithValue(request.Context(), chi.RouteCtxKey, ctx))
	request = request.WithContext(context.WithValue(request.Context(), middleware.UserKey, "alice"))
	controller := StudioController{db: db, logger: zap.NewNop(), sseManager: &sse.SSEManager{}, sessionRepo: failingStreamSessionRepo{err: sql.ErrNoRows}}
	recorder := httptest.NewRecorder()
	// Stop at the transport's Flusher check. Delivery is covered in package sse;
	// this test protects the controller's compression-ID authorization path.
	controller.StreamStudioEvents(unflushableWriter{recorder}, request)
	if recorder.Header().Get("Content-Type") != "text/event-stream" {
		t.Fatalf("authorized upload ID rejected: %d %s", recorder.Code, recorder.Body.String())
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatal(err)
	}
}

type unflushableWriter struct{ http.ResponseWriter }
