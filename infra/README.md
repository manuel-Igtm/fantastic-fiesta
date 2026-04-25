# Infrastructure Workspace

This directory is reserved for infrastructure as code and deployment tooling.

## Current contents

- `k8s/` contains starter deployment manifests for:
  - `api` (`infra/k8s/api-deployment.yaml`)
  - `web` (`infra/k8s/web-deployment.yaml`)
  - `ai-orchestrator` (`infra/k8s/ai-orchestrator-deployment.yaml`)

## Planned expansion

- `terraform/` for cloud resources, IAM policy definitions, networking, and managed data stores.
- `k8s/` to be extended with Services, Ingress/Gateway, autoscaling, PodDisruptionBudgets, and secrets/config externalization.
- `scripts/` for operational bootstrap, migration, and release helpers.

## Deployment notes

- The current manifests are deployment-oriented stubs intended to support Phase 8 architecture and CI consistency checks.
- Production rollout should layer:
  - managed secrets (KMS/secret manager),
  - image signing and provenance,
  - progressive delivery (blue/green or canary),
  - observability wiring (OpenTelemetry collectors, metrics, alerts).
