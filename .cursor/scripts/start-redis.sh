#!/usr/bin/env bash

set -euo pipefail

if command -v redis-server >/dev/null 2>&1; then
  if command -v service >/dev/null 2>&1; then
    sudo service redis-server start >/dev/null 2>&1 || true
  fi
fi

if redis-cli ping >/dev/null 2>&1; then
  echo "[redis] Ready"
  exit 0
fi

mkdir -p "${HOME}/.cache/save-sabi"
redis-server --daemonize yes --save 60 1 --dir "${HOME}/.cache/save-sabi" >/dev/null 2>&1 || true

for _ in $(seq 1 20); do
  if redis-cli ping >/dev/null 2>&1; then
    echo "[redis] Ready"
    exit 0
  fi
  sleep 1
done

echo "[redis] Failed to start" >&2
exit 1
