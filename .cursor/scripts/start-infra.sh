#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

cd "$REPO_ROOT"

"$SCRIPT_DIR/start-postgres.sh"
"$SCRIPT_DIR/start-redis.sh"
"$SCRIPT_DIR/bootstrap-db.sh"

echo "[infra] local PostgreSQL + Redis are ready for Save Sabi"
