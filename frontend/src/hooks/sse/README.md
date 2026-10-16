# Studio SSE connections

Start with `connection.ts` for transport ownership, then `../useSessionSSE.ts`
for the Studio screen's state updates. The Go sender lives in
`api-server/internal/sse/sse.go` from the repository root.

## Connection contract

- Each subscription owns one EventSource, its retry timer and its pending token request.
- Disconnect closes the stream, clears its timer and invalidates late token results and queued callbacks.
- The helper closes a failed native stream before retrying. Browser reconnects and application retries never compete.
- Five consecutive retries use delays of 1, 2, 4, 8 and 16 seconds. A successful open resets the budget. A new attempt obtains a fresh token.
- The existing server accepts Firebase tokens in the query string for native EventSource. The Studio route verifies the token and checks workspace membership before streaming. Upload compression IDs are resolved through testimonial metadata in the same workspace check. Tokens must not appear in application logs.

## Events and recovery

Studio uses default SSE messages: `data: <JSON>`, with the event type inside
that JSON. Initial snapshots and incremental updates use the server's stage
IDs and statuses. A `reviewing` stage still requires the caller's decision;
100% progress does not turn it into an accepted stage.

The hook replaces its state on a new snapshot. It derives counts from stage
state, so duplicate completion events cannot increase the total. Progress
cannot overwrite a terminal stage; an explicit retry makes it pending again.

The Go broadcaster serializes events under its state lock and routes them to
clients of the matching session. It normalizes legacy Studio events that carry
only `job_id`. A full client queue closes that stream so it reconnects for a
fresh snapshot. Failed writes and cancelled connections remove registrations.

There is no Last-Event-ID replay or durable event log. Recovery uses a fresh
snapshot from the existing in-memory session manager or database restoration.
This change does not add distributed delivery across server instances.

## Offline tests

Use Node 22 with the existing Yarn project, then run from `frontend/`:

```sh
yarn test:sse
```

The separate Vitest config loads only these SSE tests. Authentication and
EventSource are mocked before the application can initialize Firebase, and
fetch is blocked. The hook tests use real React mounts, including StrictMode,
and the onboarding compression component. They use server-shaped messages,
not live generation jobs.

From `api-server/`:

```sh
go test -race ./internal/sse ./internal/controllers -run 'Test(Studio|CanStreamSession)' -count=1
```

The Go tests use in-memory writers, real stream serialization and routing, and
SQL-mocked access checks. They never construct the Redis-subscribing SSE
manager or start the application. These checks do not validate production
Firebase, Redis, Postgres, load balancers or live generation providers.

The separate testimonial monitor and general AI streaming endpoints are
outside this Studio regression suite. This is not a security audit of the
whole application.
