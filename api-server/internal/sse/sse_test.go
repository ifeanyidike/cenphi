package sse

import (
	"context"
	"encoding/json"
	"errors"
	"strings"
	"testing"
	"time"

	"go.uber.org/zap"
)

// No constructor: NewSSEManager starts Redis subscriptions. These tests use
// real routing/serialization and in-memory channels, with no external I/O.
func testManager(t *testing.T) *SSEManager {
	t.Helper()
	ctx, cancel := context.WithCancel(context.Background())
	t.Cleanup(cancel)
	return &SSEManager{ctx: ctx, cancel: cancel, logger: zap.NewNop(),
		studioClients: make(map[string]studioClient), sessions: make(map[string]*ProcessingSession)}
}

func addTestSession(m *SSEManager, id string) {
	m.sessions[id] = &ProcessingSession{ID: id, WorkspaceID: "workspace-" + id,
		Type: "clipping", Status: "active", StartedAt: time.Date(2026, 10, 16, 0, 0, 0, 0, time.UTC),
		Stages:           map[string]*ProcessingStageEvent{"transcribe": {ID: "transcribe", Name: "transcription", Order: 1, Status: "processing"}},
		AcceptedVersions: make(map[string]string)}
}

func decodeEvent(t *testing.T, data []byte) StudioEvent {
	t.Helper()
	var event StudioEvent
	if err := json.Unmarshal(data, &event); err != nil {
		t.Fatal(err)
	}
	return event
}

func TestStudioDeliveryIsSessionScoped(t *testing.T) {
	m := testManager(t)
	a := studioClient{sessionID: "a", events: make(chan []byte, 10)}
	b := studioClient{sessionID: "b", events: make(chan []byte, 10)}
	m.studioClients["a"] = a
	m.studioClients["b"] = b
	if m.HasStudioClient("c") {
		t.Fatal("unrelated session counted as connected")
	}
	m.BroadcastStudioEvent(StudioEvent{Type: "step_progress", SessionID: "a"})
	if len(a.events) != 1 || len(b.events) != 0 {
		t.Fatal("cross-session delivery")
	}
	event := &StudioEvent{Type: "preview_ready", SessionID: "wrong"}
	m.SendStudioEvent("b", event)
	if len(a.events) != 1 || len(b.events) != 1 {
		t.Fatal("SendStudioEvent ignored destination")
	}
	if event.SessionID != "wrong" {
		t.Fatal("caller event was mutated")
	}
	if got := decodeEvent(t, <-b.events); got.SessionID != "b" {
		t.Fatalf("wrong destination: %s", got.SessionID)
	}
}

func TestStudioPayloadIsSnapshotAndLegacySkipIsRouted(t *testing.T) {
	m := testManager(t)
	addTestSession(m, "a")
	client := studioClient{sessionID: "a", events: make(chan []byte, 10)}
	m.studioClients["a"] = client
	// Exercise the real producer, rather than hand-writing only a consumer fixture.
	m.UpdateStageProgress("a", "transcribe", 25, "first", nil)
	m.UpdateStageProgress("a", "transcribe", 75, "second", nil)
	first := decodeEvent(t, <-client.events)
	if first.Stage.Progress != 25 || first.Stage.Message != "first" {
		t.Fatal("queued event changed with mutable stage")
	}
	<-client.events
	if err := m.SkipStage("a", "transcribe", "user_manual_skip"); err != nil {
		t.Fatal(err)
	}
	skipped := decodeEvent(t, <-client.events)
	if skipped.Type != "stage_skipped" || skipped.SessionID != "a" {
		t.Fatalf("legacy JobID event not normalized: %+v", skipped)
	}
}

type streamWriter struct {
	writes chan []byte
	fail   bool
}

func (w *streamWriter) Write(data []byte) (int, error) {
	if w.fail {
		return 0, errors.New("client gone")
	}
	w.writes <- append([]byte(nil), data...)
	return len(data), nil
}
func (w *streamWriter) Flush() {}

func TestStudioStreamSnapshotDeliveryAndCleanup(t *testing.T) {
	m := testManager(t)
	addTestSession(m, "a")
	addTestSession(m, "b")
	writer := &streamWriter{writes: make(chan []byte, 100)}
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	done := make(chan error, 1)
	go func() { done <- m.StreamStudioEvents(ctx, writer, "a") }()
	read := func() StudioEvent {
		t.Helper()
		select {
		case data := <-writer.writes:
			if !strings.HasPrefix(string(data), "data: ") || strings.Contains(string(data), "event:") {
				t.Fatal("default onmessage wire format changed")
			}
			return decodeEvent(t, []byte(strings.TrimSpace(strings.TrimPrefix(string(data), "data: "))))
		case <-time.After(time.Second):
			t.Fatal("stream did not write")
			return StudioEvent{}
		}
	}
	initial := read()
	if initial.SessionID != "a" || initial.Type != "session_created" || initial.Data["total_steps"] != float64(1) {
		t.Fatalf("bad snapshot: %+v", initial)
	}
	m.BroadcastStudioEvent(StudioEvent{Type: "step_progress", SessionID: "b"})
	m.UpdateStageProgress("a", "transcribe", 60, "own session", nil)
	if next := read(); next.SessionID != "a" || next.Stage.Progress != 60 {
		t.Fatal("wrong session reached stream")
	}
	cancel()
	select {
	case err := <-done:
		if err != nil {
			t.Fatal(err)
		}
	case <-time.After(time.Second):
		t.Fatal("disconnect leaked stream")
	}
	if m.HasStudioClient("a") {
		t.Fatal("client registration leaked")
	}
}

func TestStudioStreamWriteFailureCleansRegistration(t *testing.T) {
	m := testManager(t)
	addTestSession(m, "a")
	if err := m.StreamStudioEvents(context.Background(), &streamWriter{fail: true}, "a"); err == nil {
		t.Fatal("write failure swallowed")
	}
	if m.HasStudioClient("a") {
		t.Fatal("failed initial write leaked registration")
	}
}

func TestStudioSlowClientIsClosedForSnapshotRecovery(t *testing.T) {
	m := testManager(t)
	client := studioClient{sessionID: "a", events: make(chan []byte, 1)}
	m.studioClients["a"] = client
	m.BroadcastStudioEvent(StudioEvent{SessionID: "a", Type: "step_progress"})
	m.BroadcastStudioEvent(StudioEvent{SessionID: "a", Type: "step_complete"})
	if m.HasStudioClient("a") {
		t.Fatal("slow client left silently missing events")
	}
	<-client.events
	if _, ok := <-client.events; ok {
		t.Fatal("slow stream not closed")
	}
}

func TestStudioSnapshotDuringUpdates(t *testing.T) {
	m := testManager(t)
	addTestSession(m, "a")
	writer := &streamWriter{writes: make(chan []byte, 100)}
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	done := make(chan error, 1)
	go func() { done <- m.StreamStudioEvents(ctx, writer, "a") }()
	for i := 0; i < 50; i++ {
		m.UpdateStageProgress("a", "transcribe", i, "update", nil)
	}
	cancel()
	select {
	case err := <-done:
		if err != nil {
			t.Fatal(err)
		}
	case <-time.After(time.Second):
		t.Fatal("stream leaked")
	}
	// Also run under -race: the snapshot and queued payload must not retain maps
	// or stage pointers that a producer can mutate while serializing.
}
