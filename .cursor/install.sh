#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$REPO_ROOT"

echo "[install] Starting Save Sabi cloud environment bootstrap at $REPO_ROOT"

# Ensure user-level Python scripts are available (used in fallback path below).
export PATH="$HOME/.local/bin:/opt/save-sabi/ai-venv/bin:$PATH"

if [[ -d .cursor/scripts ]]; then
  chmod +x .cursor/scripts/*.sh
fi

if [[ -f package-lock.json ]]; then
  echo "[install] Installing Node workspace dependencies with npm ci"
  npm ci
else
  echo "[install] Installing Node workspace dependencies with npm install"
  npm install
fi

echo "[install] Creating/updating Python virtual environment"
if python3 -m venv .venv 2>/dev/null; then
  echo "[install] Virtual environment created with stdlib venv"
else
  echo "[install] stdlib venv unavailable; falling back to virtualenv"
  python3 -m pip install --user --upgrade pip virtualenv
  python3 -m virtualenv .venv
fi

echo "[install] Installing AI orchestrator Python dependencies"
. .venv/bin/activate
python -m pip install --upgrade pip
pip install -r services/ai-orchestrator/requirements.txt

if [[ -d /opt/save-sabi/ai-venv ]]; then
  echo "[install] Syncing shared AI virtualenv at /opt/save-sabi/ai-venv"
  /opt/save-sabi/ai-venv/bin/pip install --upgrade pip
  /opt/save-sabi/ai-venv/bin/pip install -r services/ai-orchestrator/requirements.txt
fi

echo "[install] Bootstrap complete"
