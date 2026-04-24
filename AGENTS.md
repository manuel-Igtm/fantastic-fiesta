# Cloud Agent Instructions

## Repository Stack

- Node.js monorepo (npm workspaces)
  - `apps/api` - NestJS backend API
  - `apps/web` - React + Vite frontend
  - `packages/shared` - shared TypeScript contracts
- Python service
  - `services/ai-orchestrator` - FastAPI AI orchestration service

## Environment Boot Expectations

Environment bootstrap is defined in `.cursor/environment.json`:
- Uses `.cursor/Dockerfile` to ensure Node + Python runtimes exist.
- Runs idempotent install steps:
  - `npm install`
  - Python virtualenv setup in `.venv`
  - `pip install -r services/ai-orchestrator/requirements.txt`

## Common Commands

- Lint all Node workspaces: `npm run lint`
- Test API workspace: `npm run test`
- Build all Node workspaces: `npm run build`
- Run API (dev): `npm run dev:api`
- Run web (dev): `npm run dev:web`
- Run AI service (dev): `npm run dev:ai`

## Service Ports

- API: `3000`
- Web: `5173`
- AI service: `8001`
- Postgres (compose): `5432`
- Redis (compose): `6379`
- MinIO (compose): `9000`, `9001`

## Notes

- For integration tests or local end-to-end flows that require infra dependencies, run `npm run docker:up` before starting app services.
- Keep install steps idempotent and avoid embedding secrets in repository files.
