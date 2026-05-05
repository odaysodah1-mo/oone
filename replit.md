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
