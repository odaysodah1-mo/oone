# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## Basmah Consumer App (`artifacts/basmah`)

- **i18n**: `react-i18next` with Arabic (default) and English. Translation files at `src/i18n/ar.ts` and `src/i18n/en.ts`. Language is persisted in `localStorage` as `basmah-lang`. Switching language also flips `document.dir` (rtl/ltr) and `document.lang`.
- **Pricing toggle**: "مع طباعة / بدون طباعة" toggle on team-detail page. Per-color prices stored in `jerseyColorsTable.priceWithCustomization` and `priceWithoutCustomization` (nullable integers — null means fall back to `team.basePrice`).
- **Governorate field**: Order form includes a `governorate` dropdown (Jordan's 12 governorates). Saved to `ordersTable.governorate`.

## Branch Management System

- **DB schema**: `branchesTable` in `lib/db/src/schema/branches.ts` — stores username, passwordHash, governorate, commissionRate, active. `ordersTable` has `governorate` column.
- **Branch API routes**: `artifacts/api-server/src/routes/branch.ts`
  - `POST /api/branch/login` — HMAC-SHA256 token auth (SESSION_SECRET)
  - `GET /api/branch/orders` — orders filtered by branch governorate
  - `GET /api/branch/stats` — branch stats
  - `PATCH /api/branch/orders/:id/status` — advance order status
  - `GET /api/admin/branches` — list all branches with stats
  - `POST /api/admin/branches` — create branch
  - `PATCH /api/admin/branches/:id` — update branch (password/governorate/commissionRate/active)
  - `DELETE /api/admin/branches/:id` — delete branch
- **Branch dashboard** (`artifacts/basmah-branch`): Served as pre-built static files from the API server at `/basmah-branch/`. Dark-themed, standalone React app. **When code changes, rebuild with**: `PORT=6800 BASE_PATH=/basmah-branch/ pnpm --filter @workspace/basmah-branch run build`. Served by `artifacts/api-server/src/app.ts` via `express.static`. The `basmah-branch` Vite dev workflow is intentionally non-functional (Replit port detection bug for newly created artifacts) — static serving is the workaround.
- **Admin branch section**: `BranchesSection` component in `artifacts/basmah-admin/src/App.tsx` — full CRUD table for branches including stats (total orders, revenue, commission).

## Security Hardening

- **Admin auth middleware**: `artifacts/api-server/src/middleware/adminAuth.ts` — checks `x-admin-key` header vs `ADMIN_SECRET` env var (defaults to `basmah2025` in dev, warns in logs). Applied to all `/admin/*` routes and `POST /storage/uploads/request-url`.
- **Rate limiting** (`express-rate-limit`): `/api/orders` (20/10min), `/api/branch/login` (10/15min), `/api/admin/*` (300/15min).
- **Admin login flow**: `basmah-admin` stores entered password under `sessionStorage("admin_key")`, validates by hitting `GET /api/admin/teams` with `x-admin-key` header, redirects to login on 401 responses, clears session on logout.
- **Order pricing**: `POST /api/orders` accepts optional `jerseyColorId`; if provided, uses `jerseyColorsTable.priceWithCustomization / priceWithoutCustomization` for correct pricing. `jerseyColorId` is now passed through from `team-detail.tsx → order-context → order.tsx`.
- **GET /api/orders** requires admin auth (not public).
- **GET /api/orders/by-phone** returns limited fields only; server-side phone format validation (`/^07\d{8}$/`).

## Background Removal

- Server-side via `POST /api/admin/remove-background` using `@imgly/background-removal-node` (multer upload, returns PNG).
- Native modules (`onnxruntime-node`, `sharp`, `protobufjs`) are externalized in `build.mjs` and listed in `onlyBuiltDependencies` in `pnpm-workspace.yaml`.
- `ImageUploadSlot` in `basmah-admin` has a "جاهزة مقصوصة" toggle to skip BG removal for pre-cut PNGs.
