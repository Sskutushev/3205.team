# URL Checker

Async URL checking service built as a small fullstack monorepo:

- `apps/api`: NestJS REST API with background URL processing
- `apps/web`: React + Vite + Zustand client
- `packages/shared`: shared API contracts

## Features

- Submit a batch of URLs and process them asynchronously in the background
- Enforce per-job concurrency cap of `5` concurrent HEAD requests
- Cancel running jobs with cooperative abort handling
- Poll active jobs safely without stale response races in the UI
- Run locally with zero external infrastructure in default `memory` mode

## Stack

- Backend: NestJS, TypeScript, Vitest
- Frontend: React, Vite, Zustand, TypeScript, Vitest
- Tooling: npm workspaces, ESLint, Prettier, GitHub Actions

## API

| Method   | Route           | Description                           |
| -------- | --------------- | ------------------------------------- |
| `POST`   | `/api/jobs`     | Create a job from `urls: string[]`    |
| `GET`    | `/api/jobs`     | List recent jobs with summary stats   |
| `GET`    | `/api/jobs/:id` | Fetch job details and per-URL results |
| `DELETE` | `/api/jobs/:id` | Cancel a running job                  |
| `GET`    | `/health`       | Health probe                          |

## Docs

- Run instructions: `docs/RUNNING.md`
- Testing and quality gate: `docs/TESTING.md`
- Architecture decisions: `docs/ARCHITECTURE.md`
- Future extension map: `docs/EXTENSIONS.md`

## Notes

- Default mode is intentionally offline-friendly and dependency-free.
- Shared contracts are authored once in `packages/shared` and consumed by both apps.
