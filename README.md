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

## Deployment and Operations

### Container Images

Production-ready Dockerfiles are provided for each runtime service:

- `apps/api/Dockerfile`
- `apps/web/Dockerfile`
- `services/ai-orchestrator/Dockerfile`

Build all images locally:

- `npm run docker:build`

### Compose Profiles

`docker-compose.yml` now supports profiles for infra and apps:

- Infra only (Postgres, Redis, MinIO): `npm run docker:up`
- Full stack (infra + API + Web + AI): `npm run docker:up:apps`
- Stop all services and remove volumes: `npm run docker:down`

### CI/CD

GitHub Actions workflow (`.github/workflows/ci.yml`) runs:

- Node lint/test/build
- Python orchestrator dependency + syntax check
- Docker image build validation for API, Web, and AI services

### Kubernetes Manifests (starter set)

Baseline manifests are included under `infra/k8s`:

- `api-deployment.yaml`
- `web-deployment.yaml`
- `ai-orchestrator-deployment.yaml`

These are deployment+service templates intended for environment-specific overlays
(e.g., Kustomize/Helm values per staging/production).

### Hosting Recommendation

For production, prefer:

- **Kubernetes (EKS/GKE/AKS)** for API/Web/AI workloads
- **Managed PostgreSQL** (RDS/Cloud SQL)
- **Managed Redis** (Elasticache/MemoryStore)
- **S3-compatible object storage** for report and vault artifacts
- **Ingress + WAF** in front of public API/Web

Minimum deployment flow:

1. Build and push versioned images.
2. Apply DB migrations in a controlled job.
3. Roll out API, AI, and web deployments.
4. Verify health endpoints and smoke tests.
5. Promote traffic after readiness checks.

## Security Baseline Included

- Global request validation (whitelist + forbid unknown fields)
- Helmet hardening in API bootstrap
- JWT secret requirements in environment validation
- Queue-ready architecture for anomaly and fraud workflows
- CI gates for lint, test, and build
