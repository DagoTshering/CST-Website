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

| Variable                 | Used by                  | Purpose                                                            |
| ------------------------ | ------------------------ | ------------------------------------------------------------------ |
| `POSTGRES_DB`            | `db` container           | Database created on first start                                    |
| `POSTGRES_USER`          | `db` container           | Superuser created on first start                                   |
| `POSTGRES_PASSWORD`      | `db` container           | Password for that user                                             |
| `DATABASE_URL`           | Next.js app, drizzle-kit | Connection string the **application** uses                         |
| `NODE_ENV`               | Node.js                  | `development` locally; Compose forces `production` in containers   |
| `ADMIN_EMAIL`            | `pnpm db:seed`           | Email of the initial administrator                                 |
| `ADMIN_INITIAL_PASSWORD` | `pnpm db:seed`           | Initial password (12+ characters); see [Admin panel](#admin-panel) |
| `UPLOAD_DIR`             | Next.js app              | Where uploaded files are stored (default `storage/uploads`)        |

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
pnpm db:seed        # initial administrator and homepage content (safe to rerun)
pnpm dev            # http://localhost:3000, admin at http://localhost:3000/admin
```

Check the database connection at <http://localhost:3000/api/health>
(`{"status":"ok","database":"up"}`, or HTTP 503 when the database is unreachable).

You can also point `DATABASE_URL` at any other PostgreSQL server you already run.

## 4. Run everything with Docker Compose

```bash
docker compose build
docker compose up -d db                 # start the database
docker compose run --rm migrate         # apply migrations (explicit deployment step)
docker compose run --rm migrate ./node_modules/.bin/tsx scripts/seed.ts   # administrator + initial content
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
  its own health check against `/api/health`. Files uploaded in the admin panel are written to the
  named volume `uploads` (mounted at `/app/storage/uploads`), the only writable application path.
- **migrate** — built from the `migrator` stage; runs `drizzle-kit migrate` once and exits. It is in
  the `tools` profile, so `docker compose up` does not start it.
- **db** — official `postgres:18-alpine`, data in the named volume `pgdata`, `pg_isready` health
  check, attached only to the internal `backend` network. Its port is **not** published.

## Admin panel

An administration panel at `/admin` lets authorised administrators manage the homepage content:
About CST, Facilities, Academic Programmes, Events and Announcements, the Staff Directory
(`/about/staff-directory`, with its departments) and the Executives (`/about/executives`; the head
of the chart is also featured on the homepage).
Each has a draft/published status; the public site shows only published content, and saving in the
admin panel updates the homepage immediately.

**First sign-in.** Set `ADMIN_EMAIL` and `ADMIN_INITIAL_PASSWORD` in `.env` (never prefix them with
`NEXT_PUBLIC_`), run `pnpm db:migrate` then `pnpm db:seed`, and sign in at
<http://localhost:3000/admin/login>. The seed is idempotent: if the administrator already exists it
is left untouched, so rerunning it never duplicates the account or resets a changed password.

The seed also fills the homepage with its initial content: About CST, the six facilities, the
programmes and the President's profile, all published (`scripts/seed-content.ts`; photographs are
copied from `public/images` into the upload store). Events and announcements are not seeded. Each
category is seeded only while its table is empty, so a rerun never overwrites edits — but if every
item of a category is deleted, the next seed run adds the initial items back.

> [!WARNING]
> The initial password is for first sign-in only. Before production deployment, sign in, change it
> under **Settings**, and remove `ADMIN_INITIAL_PASSWORD` from the environment. The dashboard shows
> a warning until it has been changed.

**How it works**

- Sign-in: Argon2id password hashes (`@node-rs/argon2`); server-side sessions in `admin_sessions`
  (the HTTP-only, SameSite=Lax cookie holds a random token, the database only its SHA-256 hash;
  12-hour lifetime; `Secure` in production). Failed sign-ins are throttled per email (5 per 15
  minutes) and per client address (25), with one generic error message. No self-registration.
- Authorisation is checked on the server in every admin page, Server Action and Route Handler
  (`src/lib/auth/dal.ts`). `src/proxy.ts` only redirects visitors without a session cookie early.
- Public pages read published content in Server Components through cached queries
  (`src/lib/cms/resources/*`); admin forms save through Server Actions, which refresh that cache.
- Uploads go to `POST /api/admin/uploads`: images are decoded and re-encoded with `sharp` (JPEG,
  PNG or WebP, up to 8 MB, metadata stripped), PDFs are checked by signature (up to 100 MB), and files
  get random names under `UPLOAD_DIR`, images in `images/` and documents in `documents/`. (Files
  stored before this split sat directly in `UPLOAD_DIR`; `pnpm uploads:organise` moves them, and
  is safe to rerun.) `GET /media/<file>` serves a file publicly only while
  published content uses it; otherwise only to a signed-in administrator.

**Ordering.** Lists the administrator puts in order (staff within a department, the executives'
chart rows, downloads within a category, departments, facilities, programmes, download
categories) have no order number in their forms. The form has a **Position** choice (First /
After … / Last), and each list page has an **Arrange order** screen where items are dragged (or
moved with ▲/▼) and saved together. The stored `sort_order` is renumbered 10, 20, 30, … on each
change (`src/lib/cms/ordering.ts`).

**Adding a content category:** add a table to `src/lib/db/schema/content.ts` and generate a
migration; add `src/lib/cms/resources/<name>.ts` (schema, form fields, writes, queries) following
an existing one; add the pages and `actions.ts` under `src/app/admin/(panel)/<name>/`; add it to
`src/components/admin/nav.ts`.

**In production**, also: serve the site over HTTPS only; run it behind a reverse proxy that sets
`X-Forwarded-For` (the login throttle uses it, and a client could otherwise set it); and back up the
`uploads` volume together with the database.

## Staff directory and executives

The Staff Directory and Executives pages read from the database. Administrators manage them under
**Admin → Staff Directory** (people, with their departments, designations, duties, programmes
and photos; the departments and the list of designations are managed there too) and
**Admin → Executives** (the President and Deans on the chart). Executives are a separate table from
staff: an executive who is also in the directory can be linked to their staff record, and then
their directory photo is used unless one is uploaded for them. The executive at the head of the
chart is the one featured in the homepage's Leadership section.

`pnpm db:seed` adds the initial data from `data/people/staff.json` and `data/people/executives.json`
(photos from `public/images/staff` and `public/images/executives`): departments while there are
none, and each person once (by their id in that data), so a rerun never duplicates or overwrites
anyone, and someone an administrator deleted is not added again.

## Programme pages

The Programmes listing (`/programmes`) and each programme's page (`/programmes/<slug>`) read from
the database. Administrators manage them under **Admin → Academic Programmes**: a programme's form
holds its listing details and its page (address, degree, duration, start date, department,
summary, learning outcomes, entry requirements, careers, structure notes, the department's web
page, the programme document as a link and/or an uploaded PDF, and up to three photos), and below the form are its **modules** and **facilities**, each added, edited, deleted
and arranged on their own. The documents every bachelor's programme page lists come from
**Admin → Admissions**. Only published programmes
with a page address appear on the website; the homepage's programme rows link to their pages.

`pnpm db:seed` fills in each programme's page once from `data/programmes/programmes.json` (the
content the static pages were built from), matching it to its programme by name, while that
programme has no page address yet; it never overwrites a page an administrator has edited. Module
descriptions written for the prototype are seeded as "to confirm" (shown in the admin list) so
the department can check them.

Each programme's page is generated on its first visit and then served from the cache, which the
admin panel refreshes on every change. `src/proxy.ts` answers addresses that are not a published
programme with a 404 before anything is generated, so made-up addresses cannot fill the cache.

## About page

The About page (`/about`) reads from the database. Administrators manage it under
**Admin → About Page**: one form for the page's text (each section's heading, the introduction and
campus photo, the vision and what it is pursued through, what the college offers and its
services), and below it the college's **names** on the timeline (always in order of year) and the
**research and innovation centres** (each with an optional full name, description, website, email
and photo; drafts are not shown; each group arranged on its own). The homepage's About CST section
is separate (**Admin → About CST**). The page's programme counts are not typed in: they count the
published programmes in Academic Programmes.

`pnpm db:seed` fills the page in once from `data/about.json` (the text the college supplied; its
`meta.notes` list what is still to be confirmed): the text while there is none, and the names and
centres while there are none. It never replaces anything an administrator has written.

## Admissions page

The Admission for new students page (`/admissions`) reads from the database. Administrators
manage it under **Admin → Admissions**: one form for what the page says once (the intake, the
introduction and photos, who can apply, the documents, the admissions office), and below it the
**important dates**, the **entry requirements** (a set of tables per kind of programme, with the
undergraduate programmes each applies to; those are the programmes the page lists) and the
**questions and answers** (with placeholders such as `{email}` and `{applyWindow}`).

The page is *upcoming* before the date marked as opening applications, *open* until the end of the
date marked as closing them, and *closed* after; the Admissions screen says which it is today. A
State setting pins it instead (e.g. to close early). The state is worked out for each request, so
the page changes on the day, without a rebuild. The documents are also listed on every bachelor's
programme page.

`pnpm db:seed` fills the page in once from `data/admission.json` (with the photos in
`public/images/admission`), never replacing anything an administrator has written.

## Vacancies page

The Vacancies page (`/vacancies`, with a page per post at `/vacancies/<slug>`) lists job
recruitment notices only: vacancies, recruitment notices, shortlists, interview schedules,
recruitment examination results and final selections. It is separate from the homepage's
Announcements (general college notices), with its own table (`vacancies`), admin screens
(**Admin → Vacancies**) and categories.

Each post is written in a rich-text editor (Tiptap, MIT-licensed open-source extensions only):
headings, bold to strikethrough, alignment, lists, links and tables (insert, header row, rows and
columns, merged cells); text pasted from Word or a PDF keeps what the editor supports. A post can
be saved as a draft, previewed, published, updated and unpublished, and may carry the official
notice as a PDF. The editor's document is stored as JSON and sanitised on the server
(`src/lib/rich-text.ts`: only the editor's node types, marks and attributes, and only http(s),
mailto, tel and site links), and the pages draw it as React elements, never as raw HTML.
Unpublished posts are not public (their address is a 404). Each post has a preview page
(`/admin/vacancies/<id>/preview`) showing the saved version exactly as the public page would, for
any signed-in administrator. When a post's address is changed, the old address keeps working: it
redirects permanently to the new one (`vacancy_slug_redirects`).

## Downloads page

`/downloads` lists forms, guidelines, regulations, reports and publications by category. A
download is either a PDF (uploaded in the admin panel, served from `/media/...?download=1` so the
browser saves it) or a link, such as a Google Drive folder. Administrators manage downloads and
their categories under **Admin → Downloads**; drafts stay off the page.

**Importing the previous website's downloads.** `pnpm downloads:fetch` reads
<https://cst.edu.bt/downloads/>, downloads every file it can (Google Drive files, and Google Docs
and Slides exported as PDF), keeps folders and web pages as links, and writes:

- `data/legacy-downloads/manifest.json` — every entry with its category, title, original URL,
  result and checksum (committed);
- `data/legacy-downloads/files/` — the PDFs (gitignored: about 240 MB).

It is resumable (files already downloaded are not fetched again) and reports failures, links that
several entries share, and unrelated links found outside the page's content. Then
`pnpm db:seed` adds every entry as a published download, once: rerunning it never duplicates an
entry, overwrites an edit or brings back one an administrator deleted. Entries whose PDF is missing
are skipped with a message, so run `pnpm downloads:fetch` before seeding on a new machine (and
before `docker compose build`, so the migrator image carries the PDFs).

## Security headers

Every page and endpoint (all paths except uploaded files under `/media`, which set their own
policy) is sent these headers, from `headers()` in `next.config.ts`. A new page gets them
automatically: nothing needs adding per page.

| Header                    | Value                                          | Effect                                                       |
| ------------------------- | ---------------------------------------------- | ------------------------------------------------------------ |
| `Content-Security-Policy` | `frame-src 'self' https://app.airgradient.com` | only our pages and the AirGradient dashboard may be embedded |
|                           | `frame-ancestors 'none'`                       | no other site may embed ours (clickjacking)                  |
|                           | `object-src 'none'; base-uri 'self'`           | no plugins, no `<base>` tricks                               |
|                           | `form-action 'self'`                           | forms only submit to this site                               |
| `X-Frame-Options`         | `DENY`                                         | the same as `frame-ancestors`, for older browsers            |
| `X-Content-Type-Options`  | `nosniff`                                      | browsers do not guess file types                             |
| `Referrer-Policy`         | `strict-origin-when-cross-origin`              | other sites see only our domain, not full addresses          |

**When building a new page:**

- **Embedding another service** (a YouTube video, a Google Map, another dashboard): add its
  address to `frame-src` in `next.config.ts` (e.g. `https://www.youtube-nocookie.com`), or browsers
  will block it and show an empty frame.
- **A form that submits to another website** is blocked by `form-action 'self'`. Forms using the
  site's own Server Actions are fine.
- **Being embedded elsewhere** (another site showing one of our pages in a frame) is blocked on
  purpose; it would need a deliberate exception.
- After a change, open the affected page with `pnpm build && pnpm start` and check the browser
  console for "Content Security Policy" errors.

Scripts are not restricted yet: that needs per-request nonces (see the Next.js guide in
`node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md`).

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
