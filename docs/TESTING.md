# Testing

## Quality Gate

```bash
npm run eslint
npm run typecheck
npm run test
npm run format:check
npm run build
```

## Test Layers

- Backend unit: domain state machine, processor concurrency, cancellation, durations.
- Backend e2e: create/list/details/cancel/404/validation/health.
- Frontend unit: Zustand store polling epoch guard and optimistic cancellation.

## CI

- `npm ci` once
- parallel `eslint`, `typecheck`, and `test` + `format:check`
- gated `build`

The same flow maps cleanly to GitLab CI.
