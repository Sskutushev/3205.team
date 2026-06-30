# URL Checker

Async URL checking service built as a small fullstack monorepo:

- `apps/api`: NestJS REST API with background URL processing
- `apps/web`: React + Vite + Zustand client
- `packages/shared`: shared API contracts

## Features

### Backend

- Submit a batch of URLs and process them asynchronously in the background
- Enforce per-job concurrency cap of `5` concurrent HEAD requests
- Cancel running jobs with cooperative abort handling
- Run locally with zero external infrastructure in default `memory` mode

### Frontend

- Poll active jobs safely without stale response races (epoch guard)
- Light and dark themes, persisted and matching the system preference
- UI in five languages (English, Español, Русский, Deutsch, 中文) with flags
- Errors surface as user-friendly toast notifications, fully translated
- Animated background, fully responsive layout down to 375px (iPhone SE)

## Stack

- Backend: NestJS, TypeScript, Vitest
- Frontend: React, Vite, Zustand, lucide-react, TypeScript, Vitest
- Frontend extras: light/dark themes and a dependency-free i18n layer (5 locales)
- Tooling: npm workspaces, ESLint, Prettier, GitHub Actions, Docker

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
