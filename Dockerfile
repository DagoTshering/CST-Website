# syntax=docker/dockerfile:1

ARG NODE_VERSION=22-alpine

# ---------- base: Node + pnpm (via Corepack, version pinned by package.json) ----------
FROM node:${NODE_VERSION} AS base
ENV PNPM_HOME=/pnpm \
    PATH=/pnpm:$PATH \
    COREPACK_ENABLE_DOWNLOAD_PROMPT=0 \
    NEXT_TELEMETRY_DISABLED=1
RUN corepack enable
WORKDIR /app

# ---------- deps: install all dependencies from the lockfile ----------
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile

# ---------- builder: produce the standalone Next.js build ----------
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

# ---------- migrator: one-off image that applies Drizzle migrations ----------
# Run with: docker compose run --rm migrate
FROM base AS migrator
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY package.json drizzle.config.ts ./
COPY drizzle ./drizzle
COPY src/lib/db/schema ./src/lib/db/schema
USER node
CMD ["./node_modules/.bin/drizzle-kit", "migrate"]

# ---------- runner: minimal production image ----------
FROM node:${NODE_VERSION} AS runner
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
WORKDIR /app

# Application files are owned by root (read-only for the app user);
# only the Next.js cache directory is writable by the non-root `node` user.
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
RUN mkdir -p .next/cache && chown node:node .next/cache

USER node
EXPOSE 3000
CMD ["node", "server.js"]
