import { afterEach, describe, expect, it, vi } from "vitest";
import { connectSSE } from "./connection";
import { FakeEventSource } from "./testSetup";

const flush = async () => {
  await Promise.resolve();
  await Promise.resolve();
};
const callbacks = () => ({
  onOpen: vi.fn(),
  onMessage: vi.fn(),
  onError: vi.fn(),
});
let stop: (() => void) | undefined;
afterEach(() => stop?.());

describe("SSE connection ownership", () => {
  it("stops after five consecutive retries, including native CONNECTING errors", async () => {
    vi.useFakeTimers();
    const handlers = callbacks();
    const getUrl = vi.fn(async () => "https://example.test/stream");
    stop = connectSSE(getUrl, handlers);
    await flush();
    for (const delay of [1000, 2000, 4000, 8000, 16000]) {
      const current = FakeEventSource.instances.at(-1)!;
      current.fail(FakeEventSource.CONNECTING);
      current.fail(); // Duplicate errors must not schedule a second retry.
      expect(current.close).toHaveBeenCalledTimes(1);
      await vi.advanceTimersByTimeAsync(delay - 1);
      const before = FakeEventSource.instances.length;
      await vi.advanceTimersByTimeAsync(1);
      expect(FakeEventSource.instances).toHaveLength(before + 1);
    }
    FakeEventSource.instances.at(-1)!.fail();
    await vi.advanceTimersByTimeAsync(60000);
    expect(FakeEventSource.instances).toHaveLength(6);
    expect(getUrl).toHaveBeenCalledTimes(6);
    expect(handlers.onError).toHaveBeenLastCalledWith(
      expect.stringContaining("Please reconnect"),
    );
  });

  it("invalidates a pending token request when disconnected", async () => {
    let resolve!: (url: string) => void;
    stop = connectSSE(
      () =>
        new Promise((r) => {
          resolve = r;
        }),
      callbacks(),
    );
    stop();
    resolve("https://example.test/stream?token=old");
    await flush();
    expect(FakeEventSource.instances).toHaveLength(0);
  });

  it("cancels retry timers and ignores queued callbacks from a closed source", async () => {
    vi.useFakeTimers();
    const handlers = callbacks();
    stop = connectSSE(async () => "https://example.test/stream", handlers);
    await flush();
    const first = FakeEventSource.instances[0];
    first.fail();
    first.open();
    first.message({ type: "step_complete" });
    expect(handlers.onOpen).not.toHaveBeenCalled();
    expect(handlers.onMessage).not.toHaveBeenCalled();
    stop();
    await vi.advanceTimersByTimeAsync(60000);
    expect(FakeEventSource.instances).toHaveLength(1);
  });

  it("refreshes the URL/token and resets the failure budget after a successful open", async () => {
    vi.useFakeTimers();
    const getUrl = vi
      .fn()
      .mockResolvedValueOnce("https://example.test/?token=first")
      .mockResolvedValue("https://example.test/?token=second");
    const handlers = callbacks();
    stop = connectSSE(getUrl, handlers);
    await flush();
    FakeEventSource.instances[0].fail();
    await vi.advanceTimersByTimeAsync(1000);
    const second = FakeEventSource.instances[1];
    expect(second.url).toContain("token=second");
    second.open();
    second.fail();
    await vi.advanceTimersByTimeAsync(1000);
    expect(FakeEventSource.instances).toHaveLength(3);
    expect(handlers.onOpen).toHaveBeenCalledOnce();
  });

  it("bounds failed authentication and never exposes token-provider errors", async () => {
    vi.useFakeTimers();
    const handlers = callbacks();
    stop = connectSSE(async () => {
      throw new Error("private-token");
    }, handlers);
    await vi.runAllTimersAsync();
    expect(FakeEventSource.instances).toHaveLength(0);
    expect(handlers.onError).toHaveBeenCalledTimes(6);
    expect(JSON.stringify(handlers.onError.mock.calls)).not.toContain(
      "private-token",
    );
  });
});
