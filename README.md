# Save Sabi

Production-grade fintech platform scaffold aligned to the provided PRD, app flow, design, security checklist, and backend architecture documents.

## Monorepo Structure

- `apps/api` - NestJS API (modular monolith entry point)
- `apps/web` - React + Vite web client shell
- `services/ai-orchestrator` - FastAPI AI orchestration service
- `packages/shared` - Shared TypeScript contracts
- `infra` - Infrastructure documentation and Terraform placeholder
- `.github/workflows` - CI pipelines

## Quick Start

1. Copy environment templates:
   - `cp .env.example .env`
   - `cp services/ai-orchestrator/.env.example services/ai-orchestrator/.env`
2. Start local dependencies:
   - `npm run docker:up`
3. Install dependencies:
   - `npm install`
4. Run services:
   - API: `npm run dev:api`
   - Web: `npm run dev:web`
   - AI service: `npm run dev:ai`

## Security Baseline Included

- Global request validation (whitelist + forbid unknown fields)
- Helmet hardening in API bootstrap
- JWT secret requirements in environment validation
- Queue-ready architecture for anomaly and fraud workflows
- CI gates for lint, test, and build
