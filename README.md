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

## Local Run

1. Install dependencies:

```bash
npm ci
```

2. Start the API:

```bash
npm run start:dev --workspace @url-checker/api
```

3. Start the web app in another terminal:

```bash
npm run dev --workspace @url-checker/web
```

- API: `http://localhost:3000`
- Web: `http://localhost:5173`

## Docker

Default fast-start profile:

```bash
docker compose up --build
```

- API: `http://localhost:3000`
- Web: `http://localhost:8080`

Optional infra scaffolding profiles:

```bash
docker compose --profile scale up --build
docker compose --profile sql up --build
```

`scale` adds Redis and `sql` adds Postgres so the repository is already laid out for the next adapter wave.

## Environment Variables

Copy `.env.example` if you want a starting point.

| Variable            |  Default | Purpose                  |
| ------------------- | -------: | ------------------------ |
| `PORT`              |   `3000` | Nest API listen port     |
| `STORAGE_DRIVER`    | `memory` | Active job-store adapter |
| `QUEUE_DRIVER`      | `memory` | Active queue adapter     |
| `VITE_API_BASE_URL` |    empty | Frontend API base URL    |

## API

| Method   | Route           | Description                           |
| -------- | --------------- | ------------------------------------- |
| `POST`   | `/api/jobs`     | Create a job from `urls: string[]`    |
| `GET`    | `/api/jobs`     | List recent jobs with summary stats   |
| `GET`    | `/api/jobs/:id` | Fetch job details and per-URL results |
| `DELETE` | `/api/jobs/:id` | Cancel a running job                  |
| `GET`    | `/health`       | Health probe                          |

## Quality Gate

```bash
npm run eslint
npm run typecheck
npm run test
npm run format:check
npm run build
```

## CI

GitHub Actions runs `npm ci` once, then parallel `eslint`, `typecheck`, and `test` + `format:check`, followed by a gated `build`. The same chain ports 1:1 to GitLab CI.

## Notes

- Default mode is intentionally offline-friendly and dependency-free.
- Shared contracts are authored once in `packages/shared` and consumed by both apps.
- Architectural decisions are documented in `ARCHITECTURE.md`.
