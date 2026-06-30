# Architecture Decisions

## ADR-001: NestJS over Express

- The API uses NestJS to show idiomatic backend structure instead of an Express app wrapped in decorators.
- DI tokens in `apps/api/src/config/tokens.ts` separate business ports from concrete adapters.

## ADR-002: Ports and Adapters

- The domain depends on `JobStore`, `JobQueue`, `HttpChecker`, `DelayProvider`, `Clock`, and `RandomProvider` only.
- Memory-backed adapters ship by default so the project boots offline with zero infrastructure.
- `STORAGE_DRIVER` and `QUEUE_DRIVER` are already wired as extension points for Redis, TypeORM, and BullMQ.

## ADR-003: Job Status Rules

- Per-URL errors do not fail the whole job.
- A job is `completed` once every URL reaches a terminal per-URL status, even if all URLs ended in `error`.
- `failed` is reserved for unexpected internal processing failures.

## ADR-004: Polling Epoch Guard

- The frontend stores `pollEpoch` and aborts the previous request whenever the active job changes.
- Responses are applied only if both `jobId` and `pollEpoch` still match the current state.
- This prevents stale responses from old requests from mutating the UI after a fast switch.

## ADR-005: Vitest Everywhere

- Vitest is used on both backend and frontend to keep one test runner and one mental model.
- Backend coverage focuses on domain invariants, processor concurrency/cancellation, and API e2e flows.
- Frontend coverage focuses on store race-condition behavior and optimistic cancellation.

## Runtime Layout

- `apps/api`: NestJS REST API, in-memory default adapters, background processing.
- `apps/web`: React + Vite + Zustand SPA.
- `packages/shared`: API contracts shared by backend and frontend.

## Implemented Extension Markers

- `apps/api/src/processing/providers/fetch-http-checker.ts`: `// EXTENSION:` HEAD -> GET fallback for `405`.
- `apps/api/src/domain/services/job-processor.ts`: `// EXTENSION:` global outbound concurrency cap.
- Further logical next steps: SSE/WebSocket progress streaming, idempotency keys, Redis store, TypeORM store, BullMQ queue.
