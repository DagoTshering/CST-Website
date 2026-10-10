# CST Website

Project foundation built with **Next.js 16 (App Router)**, **TypeScript (strict)**, **PostgreSQL**,
**Drizzle ORM**, **Tailwind CSS 4**, **pnpm** and **Docker Compose**.

This repository contains infrastructure only: a landing page, a database health check and an example
`users` table used to verify the ORM setup. No authentication or business features are implemented.

## Stack and versions

| Tool         | Version                      |
| ------------ | ---------------------------- |
| Node.js      | 22 LTS (`>=22`)              |
| pnpm         | 10.28 (pinned via Corepack)  |
| Next.js      | 16.4                         |
| React        | 19.3                         |
| TypeScript   | 5.9                          |
| Tailwind CSS | 4.3                          |
| Drizzle ORM  | 0.45 / drizzle-kit 0.31      |
| Driver       | `postgres` (postgres.js) 3.4 |
| PostgreSQL   | 18 (`postgres:18-alpine`)    |
| ESLint       | 9 (flat config) + Prettier 3 |

## Project structure

```
.
├── Dockerfile               # multi-stage: deps → builder → migrator / runner
├── docker-compose.yml       # app + db (+ migrate job)
├── docker-compose.dev.yml   # dev-only: exposes Postgres on 127.0.0.1:5432
├── drizzle.config.ts        # drizzle-kit configuration
├── drizzle/migrations/      # generated SQL migrations (commit these)
├── src/
│   ├── app/
│   │   ├── api/health/route.ts   # GET /api/health → checks DB connectivity
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   └── lib/db/
│       ├── index.ts              # shared Drizzle client: getDb()
│       └── schema/
│           ├── index.ts          # central schema export
│           └── users.ts          # example table
└── .env.example
```

Tailwind CSS 4 is wired through Next.js 16's Turbopack CSS loader (`@tailwindcss/turbopack` in
`next.config.ts`), which is the current `create-next-app` default, so no `postcss.config.mjs` is
needed.

## Prerequisites

- Node.js 22 or newer
- pnpm — easiest via Corepack: `corepack enable` (the version is pinned in `package.json`)
- Docker Desktop (or Docker Engine) with Docker Compose v2

## 1. Install dependencies

```bash
pnpm install
```

## 2. Configure environment variables

```bash
cp .env.example .env        # Windows PowerShell: Copy-Item .env.example .env
```

| Variable            | Used by                  | Purpose                                                          |
| ------------------- | ------------------------ | ---------------------------------------------------------------- |
| `POSTGRES_DB`       | `db` container           | Database created on first start                                  |
| `POSTGRES_USER`     | `db` container           | Superuser created on first start                                 |
| `POSTGRES_PASSWORD` | `db` container           | Password for that user                                           |
| `DATABASE_URL`      | Next.js app, drizzle-kit | Connection string the **application** uses                       |
| `NODE_ENV`          | Node.js                  | `development` locally; Compose forces `production` in containers |

**`DATABASE_URL` vs `POSTGRES_*`.** The `POSTGRES_*` variables only _initialise_ the PostgreSQL
container, and only the first time its data volume is created; changing them later does not change an
existing database. `DATABASE_URL` is what the app and drizzle-kit connect with.

- Outside Docker (`pnpm dev`, `pnpm db:migrate`) the host is `localhost`, as in `.env`.
- Inside Docker Compose, `DATABASE_URL` is **overridden** in `docker-compose.yml` and built from the
  `POSTGRES_*` values with the internal hostname `db`. You do not need a second env file.

If the password contains URL-reserved characters (`@ : / ? # %`), percent-encode them in
`DATABASE_URL`, or use an alphanumeric password.

In production, provide real secrets through your deployment platform's environment or a secret
manager. `.env` and `.env.*` (except `.env.example`) are git- and docker-ignored.

## 3. Run locally (app on your machine, database in Docker)

```bash
# Start only PostgreSQL and publish it on 127.0.0.1:5432
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d db

pnpm db:migrate     # apply migrations
pnpm dev            # http://localhost:3000
```

Check the database connection at <http://localhost:3000/api/health>
(`{"status":"ok","database":"up"}`, or HTTP 503 when the database is unreachable).

You can also point `DATABASE_URL` at any other PostgreSQL server you already run.

## 4. Run everything with Docker Compose

```bash
docker compose build
docker compose up -d db                 # start the database
docker compose run --rm migrate         # apply migrations (explicit deployment step)
docker compose up -d                    # start app + db
```

Open <http://localhost:3000>. Useful commands:

```bash
docker compose ps                       # status and health
docker compose logs -f app              # app logs
docker compose down                     # stop (data is kept)
```

What the Compose setup does:

- **app** — built from the `runner` stage (Next.js standalone output), runs as the non-root `node`
  user with a read-only root filesystem, waits for the `db` health check, exposes port 3000 and has
  its own health check against `/api/health`.
- **migrate** — built from the `migrator` stage; runs `drizzle-kit migrate` once and exits. It is in
  the `tools` profile, so `docker compose up` does not start it.
- **db** — official `postgres:18-alpine`, data in the named volume `pgdata`, `pg_isready` health
  check, attached only to the internal `backend` network. Its port is **not** published.

## Database migrations

```bash
# 1. Edit or add tables in src/lib/db/schema/ (export new files from schema/index.ts)
pnpm db:generate            # writes SQL to drizzle/migrations/ (no DB connection needed)
# 2. Review the generated SQL, commit it
pnpm db:migrate             # applies pending migrations (locally)
docker compose run --rm migrate   # applies them inside Docker
```

Applied migrations are recorded in the `drizzle.__drizzle_migrations` table.
Rebuild the migrator image after adding migrations: `docker compose build migrate`.

## Inspecting, persisting and resetting data

Data persists in the `cst-website_pgdata` volume across `docker compose down` and restarts.

```bash
pnpm db:studio                                        # Drizzle Studio (needs DB reachable on localhost)
docker compose exec db psql -U cst_website -d cst_website     # psql inside the container
#   \dt            list tables
#   \d users       describe the example table
```

Reset the database completely (**deletes all data**):

```bash
docker compose down -v      # removes containers and the pgdata volume
docker compose up -d db
docker compose run --rm migrate
```

## Code quality and builds

```bash
pnpm lint            # ESLint (next/core-web-vitals + typescript + prettier)
pnpm typecheck       # next typegen && tsc --noEmit
pnpm format          # Prettier: write
pnpm format:check    # Prettier: check only
pnpm build           # production build (.next/standalone)
pnpm start           # serve the production build locally
```

`pnpm start` uses `next start`, which prints a notice that standalone output is meant to be run with
`node .next/standalone/server.js`; it still works for local checks. Containers run `node server.js`.

## Local development vs production

|              | Local development                      | Production (Docker)                                    |
| ------------ | -------------------------------------- | ------------------------------------------------------ |
| Command      | `pnpm dev`                             | `node server.js` in the `runner` image                 |
| `NODE_ENV`   | `development`                          | `production`                                           |
| Env source   | `.env` loaded by Next.js / drizzle-kit | Container environment (Compose `env_file` + overrides) |
| DB host      | `localhost`                            | `db` (internal Docker network)                         |
| Hot reload   | Yes; DB pool cached on `globalThis`    | No                                                     |
| Migrations   | `pnpm db:migrate`                      | `docker compose run --rm migrate`                      |
| DB pool size | 5                                      | 10                                                     |

## Troubleshooting

- **`DATABASE_URL is not set`** — create `.env` from `.env.example`.
- **`ECONNREFUSED 127.0.0.1:5432` running locally** — the database port is not published by default.
  Start it with `docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d db`.
- **Port 5432 already in use** — another PostgreSQL is running on your machine. Stop it, or change the
  host port in `docker-compose.dev.yml` (e.g. `127.0.0.1:5433:5432`) and in `DATABASE_URL`.
- **`password authentication failed`** — `POSTGRES_*` only apply when the volume is first created.
  If you changed them afterwards, either restore the old values or reset with `docker compose down -v`.
- **`required variable POSTGRES_USER is missing`** — Compose could not find `.env` in the project folder.
- **App container keeps restarting / unhealthy** — check `docker compose logs app` and
  `docker compose ps`; `/api/health` returns 503 when the database is unreachable.
- **`relation "users" does not exist`** — migrations have not been applied: `docker compose run --rm migrate`.
- **Build changes not visible in Docker** — rebuild: `docker compose up -d --build`.
- **PostgreSQL 18 volume layout** — the volume is mounted at `/var/lib/postgresql` (the 18+ image
  convention). Volumes created by older major versions are not compatible; use `pg_upgrade` or dump/restore.
