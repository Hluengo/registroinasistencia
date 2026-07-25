# AGENTS.md

## Project

React 19 + Vite + TypeScript SPA for tracking school absences ("Registro de Inasistencias"). Supabase backend (PostgreSQL, Auth, Storage). Express API server for Gemini AI proxy. Deployed on Vercel.

## Commands

```bash
npm run dev          # Vite dev server (port 5173, proxies /api → localhost:8787)
npm run dev:api      # Express API server (port 8787) — separate process, run alongside dev
npm run lint         # ESLint + tsc --noEmit (runs BOTH, do not skip either)
npm run lint:fix     # ESLint auto-fix
npm run test         # Vitest unit tests
npm run test:e2e     # Playwright E2E (auto-starts dev server)
npm run doctor       # React Doctor analysis
```

**Always run `npm run lint` before committing.** It runs ESLint and TypeScript type-checking in one shot. There is no separate `typecheck` script.

## Architecture

```
src/                  # React SPA
  App.tsx             # Main app — tab-based routing, no react-router
  pages/              # Lazy-loaded page components (Dashboard, Inasistencias, Pruebas, etc.)
  components/         # Shared UI components
  hooks/queries/      # React Query hooks organized by domain
  services/           # Supabase data access layer
  lib/                # Supabase client singleton, validators, transformations
  types/db.ts         # AUTO-GENERATED Supabase types — DO NOT EDIT MANUALLY
  types.ts            # App-level type aliases re-exporting from types/db.ts
  constants/          # Centralized constants (status codes, query keys, UI config)
server/index.ts       # Express API (Gemini proxy only, port 8787)
supabase/migrations/  # SQL migrations (001–012)
e2e/                  # Playwright E2E tests
```

## Key Quirks

- **Two env files**: Server loads `.env.local` first, falls back to `.env`. Frontend vars must use `VITE_` prefix.
- **Path alias**: `@/*` maps to project root (`./`). Use it for cross-directory imports.
- **Vitest uses `pool: 'vmForks'` and `environment: 'node'`** — not jsdom. If a test needs DOM APIs, it won't have them.
- **`tsconfig.json` has `noUncheckedIndexedAccess: true`** — array/object index access returns `T | undefined`. Handle it.
- **`tsconfig.json` excludes `EXAMPLE_*.ts*`** — example files are ignored by type-checking.
- **Supabase types are generated**: Run `supabase gen types typescript --project-url <URL> > src/types/db.ts` to regenerate. Never hand-edit `db.ts`.
- **HMR disabled via env**: Set `DISABLE_HMR=true` to prevent file-watching flicker during agent edits.
- **Role system**: `teacher` (public view only) → `staff` → `superuser`. Access control is in `useAuth` hook and Supabase RLS policies.
- **Pages are lazy-loaded** with `React.lazy()` in `App.tsx` — no code-splitting config needed beyond what Vite does automatically.
- **React Query staleTime**: 60s, `refetchOnMount: false`. Tests may need to account for cached data.

## Testing

- **Unit tests**: Co-located with source — `src/**/*.test.ts` and `src/**/*.spec.ts`. Run with `npm run test`.
- **Integration tests**: Co-located in `src/services/*.integration.test.ts`. Same vitest command, same config.
- **E2E tests**: In `e2e/`. Playwright with Chromium only. Dev server starts automatically. Run with `npm run test:e2e`.
- **CI**: React Doctor runs on PRs and pushes to `main` (`.github/workflows/react-doctor.yml`).

## Code Style

- Prettier: no semicolons, single quotes, trailing commas (es5), 80 char width, LF endings.
- ESLint enforces Prettier via `prettier/prettier: "error"`.
- UI text is in **Spanish** (domain-specific). Code identifiers are in **English**.
- All Supabase data access goes through `src/services/` → re-exported from `src/lib/supabaseClient.ts`. There is one singleton client.

## Common Pitfalls

- Running `lint` separately from `tsc` misses type errors. Always use `npm run lint` (the combined script).
- Vitest runs in Node environment — `window`, `document`, etc. are undefined unless mocked.
- `src/types/db.ts` gets overwritten on regen — never add hand-written types there.
- `server/index.ts` is a standalone Express process — it does not share Vite's HMR or module resolution.
- Supabase RLS policies in `supabase/migrations/` control row-level access — service-layer changes may need corresponding migration updates.
