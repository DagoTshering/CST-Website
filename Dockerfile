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
# It also carries the seed script, which creates the initial administrator and the homepage's
# initial content (copying its photographs into the `uploads` volume):
#   docker compose run --rm migrate ./node_modules/.bin/tsx scripts/seed.ts
FROM base AS migrator
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY package.json drizzle.config.ts ./
COPY drizzle ./drizzle
COPY src/lib/db ./src/lib/db
COPY src/lib/auth/password.ts ./src/lib/auth/password.ts
COPY src/lib/media/paths.ts ./src/lib/media/paths.ts
COPY src/content/home.ts ./src/content/home.ts
COPY public/images ./public/images
COPY scripts/seed.ts scripts/seed-content.ts ./scripts/
RUN mkdir -p storage/uploads && chown node:node storage/uploads
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
# only the Next.js cache and the uploads directory (a volume) are writable by `node`.
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
RUN mkdir -p .next/cache storage/uploads && chown node:node .next/cache storage/uploads

USER node
EXPOSE 3000
CMD ["node", "server.js"]
