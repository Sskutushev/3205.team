# Future Extensions

## Already Marked in Code

- `apps/api/src/processing/providers/fetch-http-checker.ts`: `// EXTENSION:` HEAD -> GET fallback for `405`.
- `apps/api/src/domain/services/job-processor.ts`: `// EXTENSION:` global outbound concurrency cap.

## Next Practical Expansions

- Redis-backed `JobStore` for cross-process state sharing.
- TypeORM-backed `JobStore` with SQL rollups and persistence.
- BullMQ-backed queue for horizontal scaling and stateless API nodes.
- SSE or WebSocket progress streaming to reduce polling.
- Idempotency keys for `POST /api/jobs`.
- Rate limiting and per-tenant quotas.
- Redis pub/sub fanout between API instances.
- Retry policy and dead-letter handling for distributed processing.

## Infra Profiles

- `docker compose --profile scale up --build` for Redis scaffolding.
- `docker compose --profile sql up --build` for Postgres scaffolding.
