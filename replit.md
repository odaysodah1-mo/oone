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
