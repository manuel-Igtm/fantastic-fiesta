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
- Uses `.cursor/Dockerfile` to preinstall:
  - Node + npm
  - Python + pip + venv
  - Docker CLI + compose plugin
  - PostgreSQL + Redis
- Runs idempotent install steps:
  - `npm install`
  - Python virtualenv setup in `.venv`
  - `pip install -r services/ai-orchestrator/requirements.txt`
  - executable helper scripts in `.cursor/scripts`

## Non-systemd Startup Helpers

Use these scripts when the environment does not support `systemd`:

- `.cursor/scripts/start-docker.sh` - starts Docker daemon via tmux fallback and validates connectivity
- `.cursor/scripts/start-postgres.sh` - starts PostgreSQL via `service` and checks readiness
- `.cursor/scripts/start-redis.sh` - starts Redis via `service` and checks readiness
- `.cursor/scripts/start-infra.sh` - orchestrates Docker/Postgres/Redis startup and DB bootstrap
- `.cursor/scripts/bootstrap-db.sh` - ensures `save_sabi` role/database exist and runs `prisma db push`
- `.cursor/scripts/start-api-prod.sh` - runs API in production env
- `.cursor/scripts/start-ai-prod.sh` - runs AI orchestrator in production mode
- `.cursor/scripts/start-web-prod.sh` - serves the built web app on port `5173`
- `.cursor/scripts/start-apps-prod.sh` - starts API + AI + web in tmux sessions

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

- For integration tests or local end-to-end flows that require infra dependencies:
  - prefer `npm run docker:up` when Docker works in the runtime
  - otherwise use `.cursor/scripts/start-infra.sh` and then `.cursor/scripts/start-apps-prod.sh`
- Keep install steps idempotent and avoid embedding secrets in repository files.
