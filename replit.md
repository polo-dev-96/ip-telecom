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

## Artifacts

### Dashboard de Atendimentos (`artifacts/atendimento-dashboard`)
- **Type**: React + Vite frontend-only (no backend — mock data)
- **Preview path**: `/`
- **Description**: Full analytics dashboard for closed/finalized multi-channel attendances (WhatsApp, Instagram, Webchat, Email, Telegram)
- **Language**: Portuguese (pt-BR)
- **Key pages**: Visão Geral, Atendimentos, Canais, Agentes, Automação, Qualidade, Detalhe do Atendimento
- **Architecture**: Clean adapter pattern — `MockDashboardDataProvider` can be swapped for `DatabaseDashboardDataProvider` or `ApiDashboardDataProvider`
- **Mock data**: 600 realistic attendance records in `src/data/mock/seed.ts`
- **Data adapter**: `src/data/adapters/mockAdapter.ts` — TODO: replace with DB/API adapter
- **Metrics**: TTR mean/median/P90, SLA compliance, FCR, CSAT, NPS, automation rate, transfer rate, handoff time, ACW

### API Server (`artifacts/api-server`)
- **Type**: Express API
- **Preview path**: `/api`
