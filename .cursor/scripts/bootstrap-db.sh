#!/usr/bin/env bash

set -euo pipefail

DB_USER="${DB_USER:-save_sabi}"
DB_PASSWORD="${DB_PASSWORD:-save_sabi_dev}"
DB_NAME="${DB_NAME:-save_sabi}"

echo "[bootstrap-db] Ensuring postgres service is running"
"$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/start-postgres.sh"

echo "[bootstrap-db] Ensuring role/database exist"
sudo -u postgres psql -v ON_ERROR_STOP=1 <<SQL
DO \$\$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '${DB_USER}') THEN
    CREATE ROLE ${DB_USER} LOGIN PASSWORD '${DB_PASSWORD}';
  ELSE
    ALTER ROLE ${DB_USER} WITH LOGIN PASSWORD '${DB_PASSWORD}';
  END IF;
END \$\$;
SQL

if ! sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" | rg -q "1"; then
  sudo -u postgres createdb -O "${DB_USER}" "${DB_NAME}"
fi

export DATABASE_URL="${DATABASE_URL:-postgresql://${DB_USER}:${DB_PASSWORD}@localhost:5432/${DB_NAME}}"

echo "[bootstrap-db] Running Prisma schema push"
(
  cd /workspace/apps/api
  npx prisma db push --schema prisma/schema.prisma
)

echo "[bootstrap-db] Completed"
