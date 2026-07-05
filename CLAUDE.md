# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A small internal **Project Tracker** web app: vanilla PHP backend + vanilla JS/HTML/CSS frontend, MySQL via PDO, served by Apache on IONOS shared hosting. There is **no framework, no build step, no package manager, and no test suite** — files are deployed as-is (uploaded to the host). "Running" the app means serving the directory with PHP+MySQL behind Apache; editing a `.php`/`.js`/`.css` file and uploading it is the entire deploy cycle.

There are no build/lint/test commands. To exercise endpoints locally you need a PHP runtime with the MySQL extension and Apache honoring `.htaccess` (mod_rewrite). `GET /api/health` (or `/api/health.php`) returns `{"status":"ok"}` and is the one endpoint that needs no auth — use it as a connectivity check.

## Architecture

**Request routing has two layers, and the frontend bypasses the clean one.** `.htaccess` defines clean REST routes (`/api/projects/123` → `projects.php?id=123`) plus an SPA-style fallback that sends any non-file request to `index.php`. But the JS (`js/*.js`) calls the PHP files **directly** — `/api/projects.php?id=`, `/api/details.php?id=`, `/api/auth.php?action=login`. Both paths work; the rewrite rules are effectively unused by the current client. When adding endpoints, follow the existing JS convention (call `*.php` directly) unless you also intend to use the rewrites.

**Auth is a single daily-rotating password, not user accounts.** `api/auth.php` computes the valid password server-side as `DDMMYYFS` (day+month+2-digit-year + literal `FS`, e.g. `240626FS` for 24 June 2026) using the server timezone `America/Chicago` (set in `config/db.php`). A correct password sets `$_SESSION['authenticated'] = true`. Enforcement lives in `config/auth_check.php`:
- HTML pages (`index.php`, `project-form.php`) call `requireAuthRedirect()` → redirect to `/login.html`.
- API endpoints call `requireAuth()` → `401` JSON. `api/health.php` is deliberately unauthenticated.

**Data model: two tables in a 1:1 relationship on `projectID`.**
- `Projects` — `projectID` (PK), `projectName`, `status` (plain VARCHAR, default `'Draft'`), `dateCreated`, `lastUpdated`.
- `Details` — `projectID` (PK + FK → Projects, `ON DELETE CASCADE`), plus per-project fields: `canva`, `dropbox`, `mockUps`, `listing` (text/links), `blurb`, `accessCode`, and boolean flags `pinterest`, `expansion`, `blog`, `email`.

Key behaviors that span files:
- **`isIncomplete`** is computed in SQL (the `BASE_SELECT` CASE expression in `api/projects.php`), not stored. A project is "incomplete" if its Details row is missing or any of canva/dropbox/mockUps/listing/pinterest is empty. The grid shows a `!` badge for these.
- **New project IDs use `MAX(projectID)+1`** in `api/projects.php` rather than relying on AUTO_INCREMENT — a deliberate workaround (see migration notes below). Keep this in mind before "fixing" it to a plain auto-increment insert.
- **Details are upserted**, not separately created/updated: `api/details.php` PUT uses `INSERT ... ON DUPLICATE KEY UPDATE`, so the same call works for both new and existing projects. The frontend always saves the project first, then PUTs details using the returned `projectID`.

**Frontend is three independent pages, no SPA router** despite the `.htaccess` fallback:
- `index.php` + `js/main.js` — searchable project grid; clicking a row opens a modal (summary view fetches Details lazily).
- `project-form.php` + `js/project-form.js` — create/edit; edit mode is triggered by `?id=` and loads project + details in parallel.
- `login.html` + `js/login.js` — password form.
All styling is one file, `css/styles.css`. `formatDate()` (duplicated in both `main.js` and `project-form.js`) renders timestamps in `America/Chicago` to match the server.

## Navigation gotchas (not bugs, but easy to misread)

- **Legacy/dead code:** `api/statuses.php` queries a `Status` table, but `migrate.sql` replaced the old `statusID` FK with a plain `status` VARCHAR, and the form hardcodes the options (`Draft`, `Idea`, `In Progress`, `Live`). The statuses endpoint and `Status` table are effectively unused — prefer the hardcoded list unless you intentionally reintroduce the table.
- **`migrate.php` / `migrate.sql` are one-time fix scripts** (reassign `projectID 0→1`, dedupe Details, set the Details PK/FK, reset AUTO_INCREMENT). They are meant to be run once and then deleted from the server — do not treat them as a repeatable schema source of truth.
- **`formatDate()` is duplicated** verbatim in `js/main.js` and `js/project-form.js`; change both if you touch it.

## Items needing attention

Flagged during codebase review (2026-06-24). Ordered by severity — these are pre-existing, not introduced by current work.

**Security**
- **Live production DB credentials are committed in `config/db.php`** (host, user, password — confirmed tracked by git). They should be rotated, moved out of the tracked file (e.g. an untracked config include or environment), and scrubbed from history. There is no `.env` or separate config today.
- **`migrate.php` has no auth check** (unlike every other endpoint, it skips `requireAuth()`) and can alter the schema. If it is ever present on the live server it is publicly runnable by anyone — keep it out of deployment / delete it from the host.
- **API errors leak internals:** every `catch` returns `$e->getMessage()` as a `detail` field in the JSON response, exposing DB structure and query errors to clients. Suppress `detail` in production responses.
- **Auth hardening gaps:** the daily password (`DDMMYYFS`) is predictable; login (`api/auth.php`) has no rate limiting; state-changing endpoints (POST/PUT) have no CSRF protection; and `session_start()` in `config/auth_check.php` sets no `HttpOnly`/`Secure`/`SameSite` cookie flags.

**Maintenance**
- **No `.gitignore` exists.** The untracked `.vs/` IDE folder (and similar local artifacts) can easily be committed by accident — add a `.gitignore` covering `.vs/` at minimum.
