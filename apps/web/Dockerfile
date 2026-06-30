# syntax=docker/dockerfile:1.7

FROM node:22-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json tsconfig.base.json tsconfig.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json

RUN --mount=type=cache,target=/root/.npm npm ci

FROM deps AS build
COPY apps/web apps/web
COPY packages/shared packages/shared

RUN npm run build --workspace @url-checker/shared && npm run build --workspace @url-checker/web

FROM nginx:1.27-alpine AS runtime

COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/web/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=10s --timeout=3s --retries=5 CMD wget -qO- http://127.0.0.1/ >/dev/null 2>&1 || exit 1
