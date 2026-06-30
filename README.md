# URL Checker

Monorepo bootstrap for the async URL checking service.

## CI

GitHub Actions runs a simple gated pipeline: `npm ci` once, then parallel
`npm run eslint`, `npm run typecheck`, and `npm run test` + `npm run format:check`,
followed by a final `npm run build` job. The same chain ports 1:1 to GitLab CI.
