# Running

## Local Development

1. Install dependencies:

```bash
npm ci
```

2. Start the API:

```bash
npm run start:dev --workspace @url-checker/api
```

3. Start the web app in a second terminal:

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

The web container serves the built SPA via nginx and reverse-proxies `/api`
to the API service on the compose network, so the frontend needs no
`VITE_API_BASE_URL` and there is no cross-origin setup in Docker.

Optional infra profiles:

```bash
docker compose --profile scale up --build
docker compose --profile sql up --build
```

## Environment Variables

Use `.env.example` as a starting point.

| Variable            |              Default | Purpose                             |
| ------------------- | -------------------: | ----------------------------------- |
| `PORT`              |               `3000` | Nest API listen port                |
| `STORAGE_DRIVER`    |             `memory` | Job-store adapter: `memory`/`redis` |
| `REDIS_URL`         | `redis://redis:6379` | Redis connection when driver=redis  |
| `QUEUE_DRIVER`      |             `memory` | Active queue adapter                |
| `VITE_API_BASE_URL` |                empty | Frontend API base URL               |

Run with shared Redis state:

```bash
STORAGE_DRIVER=redis docker compose --profile scale up --build
```
