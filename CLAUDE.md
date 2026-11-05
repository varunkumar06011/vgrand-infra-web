# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

- Install: `npm ci` (lockfile is `package-lock.json`; no pnpm/yarn lockfile exists)
- Dev server: `npm run dev` (http://localhost:3000)
- Build: `npm run build` (`next build`)
- Lint: `npm run lint` (ESLint flat config in `eslint.config.mjs`, extends `eslint-config-next` core-web-vitals + TypeScript)
- Typecheck: `npx tsc --noEmit` (no npm script; `tsconfig.json` uses `@/*` → `./src/*`)
- Optimize tour media: `npm run tour:images` (reads `tour-source/`, which is gitignored)
- There is no test runner and no `test` script. Do not look for a single-test command.

Verification for a change: run `npm run build` and `npm run lint`. The Claude task workflow (`.github/workflows/claude-task.yml`) runs the first existing script among `build:web`, `test`, `build`, `lint`, so `build` is the gate it uses.

## Architecture

**Stack:** Next.js 16 App Router under `src/app/` (no root `app/` directory is routed), React 19, Tailwind 3, Supabase (Postgres, Auth, Storage), deployed to Vercel. Next.js 16 renames `middleware` to `proxy`, so the request gate is `src/proxy.ts`.

**Public site.** Pages in `src/app/` (home, `about`, `contact`, `gallery`, `projects/[slug]`, legal pages) are composed from `src/components/`. Project content is static in `src/data/projects.ts`. `Projects.tsx` imports that file directly. The Supabase `projects` table is separate and is written only through `/api/projects`, which calls `revalidatePath('/')` and `revalidatePath('/projects')`. Expect the static file and the database to drift unless a page reads the table.

**Virtual tours.** Each project has a config in `src/data/tours/` (`elite-homes.ts` for scenes and hotspots, `elite-homes.i18n*.ts` for every display string, `index.ts` as the slug registry). `src/components/tour/` renders it, and `ProjectTour.tsx` renders nothing when a slug has no config. Read `src/components/tour/README.md` before changing tour scenes; it documents how scene `enabled` flags and links interact.

**Admin.** `/admin` is a Supabase email/password login (`src/app/admin/page.tsx`). `/admin/dashboard`, `/admin/leads`, `/admin/projects` and `/admin/materials` sit under `src/components/admin/AdminLayout.tsx`, which checks the session client-side. `src/proxy.ts` refreshes the Supabase session cookie on every request.

**API routes** (`src/app/api/*/route.ts`) follow one pattern:
- Authenticated write routes call `getAuthenticatedUser(request)` from `src/lib/auth.ts` and return `unauthorizedResponse()` if it is null. The user is read from the cookie session.
- Writes then use `getAdminClient()` from `src/lib/supabaseAdmin.ts`, which uses the service-role key and bypasses RLS. Any new route that accepts input must validate it itself.
- Public routes (`leads`, `save-enquiry`, `consent`, `visits/track`) call `rateLimit()` from `src/lib/rateLimit.ts`. That limiter is an in-memory Map per server instance, so it is not shared across Vercel instances.
- Uploads go through `uploadToStorage()` in `src/lib/storage.ts`, which enforces the extension, MIME and 20 MB limits and returns a public URL.

**Integrations:**
- `src/app/api/webhook/route.ts` is the WhatsApp Cloud API handler. GET answers Meta's verification challenge; POST runs a lead-capture conversation whose state lives in the `whatsapp_sessions` table. Outbound messages go through `src/lib/whatsapp.ts`.
- Instagram feed: `src/app/api/instagram/route.ts`, with `refresh-instagram-token` renewing the token.
- Brochure downloads and construction-update media come from `/api/brochure-download` and `/api/construction-updates`.

**Database.** Tables in use: `leads`, `projects`, `materials`, `construction_updates`, `consent_logs`, `site_visits`, `whatsapp_sessions`. There is no migration tool. The `supabase_*.sql` files in the repo root are run by hand in the Supabase SQL Editor. None of them is numbered, so check the file header and the table it touches before running one. `supabase_rls_hardening.sql` enables RLS across tables; read it before adding a table.

**Environment variables** (`.env.local`, never commit): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_BUCKET_PROJECTS` (defaults to `projects`), `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_VERIFY_TOKEN`, `INSTAGRAM_ACCESS_TOKEN`, `INSTAGRAM_BUSINESS_ACCOUNT_ID`, `AGENT_WHATSAPP_NUMBER`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_GA_ID`, `NEXT_PUBLIC_FB_PIXEL_ID`, `NEXT_PUBLIC_GOOGLE_CLIENT_ID`.

**Security headers and CSP** live in `next.config.ts` (`headers()`). Any new third-party script, font, image host or API origin must be added there, or the browser blocks it. `images.remotePatterns` also has an explicit host allowlist.

**`vgrand-whatsapp-integration/`** is a separate, unrouted copy of an earlier WhatsApp bot (`.js`/`.jsx`, its own `docs/SETUP_GUIDE.md`, its own `supabase/schema.sql`). Its `docs/` refer to a `/api/whatsapp-webhook` path, but the live route is `/api/webhook`. Do not edit it unless the task names it.

