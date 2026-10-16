import { StrictMode, act, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useSessionSSE } from "../useSessionSSE";
import { useStudioSSE as useLegacySSE } from "../../components/hooks/useStudioSSE";
import { useStudioSSE } from "../useStudioSSE";
import { useStoryVideoSSE } from "../useStoryVideoSSE";
import { useJobProgress } from "../useJobProgress";
import { FakeEventSource } from "./testSetup";
import { SSEProcessing } from "../../components/onboarding/SSEProcessing";

const { token } = vi.hoisted(() => ({ token: vi.fn() }));
// Mock only authentication I/O, before Firebase's module can initialize.
vi.mock("@/stores/authStore", () => ({
  authStore: { user: { getIdToken: token } },
}));

const cleanups: (() => void)[] = [];
afterEach(() => {
  for (const cleanup of cleanups.splice(0)) act(cleanup);
  token.mockReset();
});

async function mountHook<T>(
  hook: (id: string) => T,
  id = "session-a",
  strict = false,
) {
  token.mockResolvedValue("test-token");
  let current!: T;
  function Probe({ id }: { id: string }) {
    current = hook(id);
    return null;
  }
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  async function render(id: string) {
    await act(async () => {
      root.render(
        strict ? (
          <StrictMode>
            <Probe id={id} />
          </StrictMode>
        ) : (
          <Probe id={id} />
        ),
      );
    });
  }
  cleanups.push(() => {
    root.unmount();
    container.remove();
  });
  await render(id);
  return {
    get value() {
      return current;
    },
    render,
    unmount: () => act(() => root.unmount()),
  };
}

function useActiveSession(id: string) {
  const stream = useSessionSSE(id);
  const { connect, disconnect } = stream;
  useEffect(() => {
    connect();
    return disconnect;
  }, [connect, disconnect]);
  return stream;
}

// Actual Go wire names: stage.id/name/order, plus workspace/testimonial at
// envelope level. Avoid a fixture that only matches the client's own types.
function snapshot(stages: unknown[] = [], id = "session-a") {
  return {
    type: "session_created",
    session_id: id,
    workspace_id: "workspace-a",
    testimonial_id: "testimonial-a",
    data: {
      session_id: id,
      type: "clipping",
      status: "active",
      auto_proceed: false,
      stages,
    },
  };
}
const stage = (status = "processing", progress = 25) => ({
  id: "transcribe",
  name: "transcription",
  display_name: "Transcribe",
  order: 1,
  status,
  progress,
});
const send = (source: FakeEventSource, data: unknown) =>
  act(() => source.message(data));

describe("Studio session consumer", () => {
  it("handles StrictMode setup/cleanup and passes the token to the real stream URL", async () => {
    const hook = await mountHook(useActiveSession, "session-a", true);
    expect(FakeEventSource.instances).toHaveLength(1);
    expect(FakeEventSource.instances[0].url).toBe(
      "https://api.example.test/studio/sessions/session-a/stream?token=test-token",
    );
    act(() => FakeEventSource.instances[0].open());
    expect(hook.value.isConnected).toBe(true);
  });

  it("reads the server snapshot, preserves reviewing, and derives completion counts", async () => {
    const hook = await mountHook(useActiveSession);
    send(FakeEventSource.instances[0], snapshot([stage("reviewing", 100)]));
    expect(hook.value.stages[0].status).toBe("reviewing");
    expect(hook.value.session).toMatchObject({
      workspace_id: "workspace-a",
      testimonial_id: "testimonial-a",
      total_steps: 1,
      completed_steps: 1,
    });
  });

  it("replaces an old snapshot completely after reconnect, including empty stages and previews", async () => {
    vi.useFakeTimers();
    const hook = await mountHook(useActiveSession);
    const first = FakeEventSource.instances[0];
    send(
      first,
      snapshot([
        {
          ...stage("completed", 100),
          metadata: { preview_url: "https://example.test/old.mp4" },
        },
      ]),
    );
    expect(hook.value.latestPreview?.preview_url).toContain("old.mp4");
    act(() => first.fail());
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    send(FakeEventSource.instances[1], snapshot([]));
    expect(hook.value.stages).toEqual([]);
    expect(hook.value.latestPreview).toBeNull();
    expect(hook.value.currentStage).toBeNull();
    expect(hook.value.session?.completed_steps).toBe(0);
  });

  it("ignores both cross-session messages and queued callbacks from a replaced stream", async () => {
    const hook = await mountHook(useActiveSession);
    const first = FakeEventSource.instances[0];
    send(first, snapshot([stage()]));
    await hook.render("session-b");
    expect(first.close).toHaveBeenCalledOnce();
    send(first, snapshot([stage("completed", 100)]));
    const second = FakeEventSource.instances[1];
    send(second, snapshot([stage()], "session-a"));
    expect(hook.value.session).toBeNull();
    send(second, snapshot([], "session-b"));
    expect(hook.value.session?.id).toBe("session-b");
  });

  it("cannot open a stale stream when the old token request finishes last", async () => {
    const hook = await mountHook(useActiveSession);
    let resolve!: (token: string) => void;
    token.mockImplementationOnce(
      () =>
        new Promise((r) => {
          resolve = r;
        }),
    );
    await hook.render("session-b");
    await hook.render("session-c");
    await act(async () => resolve("late-token"));
    expect(FakeEventSource.instances).toHaveLength(2);
    expect(FakeEventSource.instances[1].url).toContain("session-c/stream");
  });

  it("makes completion idempotent, keeps reviewing, and rejects late progress", async () => {
    const hook = await mountHook(useActiveSession);
    const source = FakeEventSource.instances[0];
    send(source, snapshot([stage()]));
    const complete = {
      type: "step_complete",
      session_id: "session-a",
      stage: stage("reviewing", 100),
    };
    send(source, complete);
    send(source, complete);
    send(source, {
      type: "step_progress",
      session_id: "session-a",
      stage: stage("processing", 40),
    });
    expect(hook.value.session?.completed_steps).toBe(1);
    expect(hook.value.stages[0]).toMatchObject({
      status: "reviewing",
      progress: 100,
    });
    expect(hook.value.currentStage).toBeNull();
    send(source, {
      type: "stage_accepted",
      session_id: "session-a",
      stage: stage("accepted", 100),
    });
    send(source, complete);
    expect(hook.value.stages[0].status).toBe("accepted");
  });

  it("counts skipped stages once and permits progress after an explicit retry", async () => {
    const hook = await mountHook(useActiveSession);
    const source = FakeEventSource.instances[0];
    send(source, snapshot([stage()]));
    send(source, {
      type: "stage_skipped",
      session_id: "session-a",
      stage: stage("skipped_auto", 0),
    });
    expect(hook.value.session?.skipped_steps).toBe(1);
    send(source, {
      type: "stage_retry",
      session_id: "session-a",
      stage: stage("pending", 0),
    });
    send(source, {
      type: "step_progress",
      session_id: "session-a",
      stage: stage("processing", 10),
    });
    expect(hook.value.stages[0]).toMatchObject({
      status: "processing",
      progress: 10,
    });
    expect(hook.value.session?.skipped_steps).toBe(0);
  });

  it("survives malformed data and accepts a later valid snapshot", async () => {
    const hook = await mountHook(useActiveSession);
    act(() =>
      FakeEventSource.instances[0].onmessage?.(
        new MessageEvent("message", { data: "{" }),
      ),
    );
    expect(hook.value.error).toBe("Failed to parse session update");
    send(FakeEventSource.instances[0], snapshot([]));
    expect(hook.value.session?.id).toBe("session-a");
  });
});

describe("other Studio consumers", () => {
  it("uses the actual default-message wire format in the legacy hook and bounds history", async () => {
    const hook = await mountHook((id) => useLegacySSE(id));
    const source = FakeEventSource.instances[0];
    send(source, { type: "heartbeat" });
    expect(hook.value.events).toHaveLength(0);
    for (let i = 0; i < 55; i++)
      send(source, {
        type: "step_progress",
        session_id: "session-a",
        id: String(i),
      });
    expect(hook.value.events).toHaveLength(50);
    expect(hook.value.lastEvent?.id).toBe("54");
    act(() => hook.value.disconnect());
    act(() => hook.value.reconnect());
    expect(FakeEventSource.instances).toHaveLength(1);
  });

  it("stops progress tracking and suppresses late events", async () => {
    const hook = await mountHook(() => useJobProgress());
    await act(async () => hook.value.startTracking("session-a"));
    const source = FakeEventSource.instances[0];
    expect(source.url).toContain("token=test-token");
    send(source, {
      type: "compression_progress",
      session_id: "session-a",
      data: { progress: 40 },
    });
    expect(hook.value.jobStatus?.progress).toBe(40);
    act(() => hook.value.stopTracking());
    send(source, { type: "compression_progress", data: { progress: 80 } });
    expect(hook.value.jobStatus?.progress).toBe(40);
  });

  it.each(["studio", "story"])(
    "cancels pending auth in the %s compatibility hook",
    async (kind) => {
      const hook = await mountHook(() =>
        kind === "studio" ? useStudioSSE() : useStoryVideoSSE(),
      );
      let resolve!: (token: string) => void;
      token.mockImplementationOnce(
        () =>
          new Promise((r) => {
            resolve = r;
          }),
      );
      act(() =>
        (hook.value.startSession as (id: string, option: any) => void)(
          "session-a",
          kind === "studio" ? "clipping" : false,
        ),
      );
      act(() => hook.value.stopSession());
      await act(async () => resolve("late-token"));
      expect(FakeEventSource.instances).toHaveLength(0);
    },
  );
});


it("authenticates the onboarding compression stream and closes it on completion", async () => {
  token.mockResolvedValue("test-token");
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  cleanups.push(() => { root.unmount(); container.remove(); });
  await act(async () => root.render(<SSEProcessing testimonialId="testimonial-a" compressionSessionId="compression-a" onComplete={() => {}} onGoToDashboard={() => {}} />));
  const stream = FakeEventSource.instances.find(s => s.url.includes("/studio/sessions/"))!;
  expect(stream.url).toBe("https://api.example.test/studio/sessions/compression-a/stream?token=test-token");
  send(stream, {type:"compression_complete", session_id:"other", data:{}});
  expect(stream.close).not.toHaveBeenCalled();
  send(stream, {type:"compression_complete", session_id:"compression-a", data:{}});
  expect(stream.close).toHaveBeenCalledOnce();
});


it("tracks the current story stage without a stale closure and clears it for a new session", async () => {
  const hook = await mountHook(() => useStoryVideoSSE());
  await act(async () => hook.value.startSession("session-a", false));
  const source = FakeEventSource.instances[0];
  send(source, {type:"step_started", session_id:"session-a", stage:{...stage(), id:"extract_clips"}});
  send(source, {type:"clip_extracted", session_id:"session-a", clip:{id:"clip-a"}, progress:{clips_extracted:1,total_clips:2}});
  expect(hook.value.currentStage?.progress).toBe(50);
  expect(hook.value.clips).toHaveLength(1);
  send(source, {type:"step_complete", session_id:"session-a", stage:{...stage("completed",100),id:"extract_clips"}});
  expect(hook.value.currentStage).toBeNull();
  await act(async () => hook.value.startSession("session-b", false));
  expect(hook.value.clips).toEqual([]);
  expect(hook.value.stages).toEqual([]);
});


it("accepts the initial snapshot's pipeline_type field from StepOrchestrator", async () => {
  const hook = await mountHook(useActiveSession);
  send(FakeEventSource.instances[0], {type:"session_created", session_id:"session-a", data:{session_id:"session-a",pipeline_type:"story_video",stages:[]}});
  expect(hook.value.session?.session_type).toBe("story_video");
});
