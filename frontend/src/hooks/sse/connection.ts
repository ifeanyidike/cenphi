export interface SSEHandlers {
  onOpen: () => void;
  onMessage: (event: MessageEvent) => void;
  onError: (message: string) => void;
}

/** Own one stream and its retries. Disconnect also invalidates pending auth. */
export function connectSSE(
  getUrl: () => Promise<string>,
  handlers: SSEHandlers,
): () => void {
  let stopped = false;
  let source: EventSource | null = null;
  let retryTimer: ReturnType<typeof setTimeout> | undefined;
  let failures = 0;

  const closeSource = () => {
    const previous = source;
    source = null;
    previous?.close();
  };

  const retry = (message: string) => {
    closeSource();
    if (stopped || retryTimer !== undefined) return;
    if (failures >= 5) {
      handlers.onError(`${message} Please reconnect to try again.`);
      return;
    }
    const delay = Math.min(1000 * 2 ** failures, 30000);
    failures += 1;
    handlers.onError(`Reconnecting... (attempt ${failures}/5)`);
    retryTimer = setTimeout(() => {
      retryTimer = undefined;
      void open();
    }, delay);
  };

  const open = async () => {
    try {
      // Resolve a fresh token for every attempt, including retries.
      const url = await getUrl();
      if (stopped) return;
      const current = new EventSource(url);
      source = current;
      current.onopen = () => {
        if (stopped || source !== current) return;
        failures = 0;
        handlers.onOpen();
      };
      current.onmessage = (event) => {
        if (!stopped && source === current) handlers.onMessage(event);
      };
      current.onerror = () => {
        if (stopped || source !== current) return;
        // Close even CONNECTING streams: do not race native auto-reconnect.
        retry("Connection lost.");
      };
    } catch {
      // Never include URLs or token-provider errors in logs/UI.
      if (!stopped) retry("Unable to connect.");
    }
  };

  void open();
  return () => {
    stopped = true;
    clearTimeout(retryTimer);
    retryTimer = undefined;
    closeSource();
  };
}
