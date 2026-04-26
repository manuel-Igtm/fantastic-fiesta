#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
SESSION_NAME="${SESSION_NAME:-ai-prod}"

cd "$REPO_ROOT"

SESSION_NAME="$SESSION_NAME"; tmux -f /exec-daemon/tmux.portal.conf has-session -t "=$SESSION_NAME" 2>/dev/null || \
  tmux -f /exec-daemon/tmux.portal.conf new-session -d -s "$SESSION_NAME" -c "$PWD" -- "${SHELL:-zsh}" -l

if [[ -f "$REPO_ROOT/.venv/bin/activate" ]]; then
  RUN_CMD="cd \"$REPO_ROOT\" && . \"$REPO_ROOT/.venv/bin/activate\" && python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --app-dir services/ai-orchestrator"
else
  RUN_CMD="cd \"$REPO_ROOT\" && python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --app-dir services/ai-orchestrator"
fi

tmux -f /exec-daemon/tmux.portal.conf send-keys -t "$SESSION_NAME:0.0" C-c
tmux -f /exec-daemon/tmux.portal.conf send-keys -t "$SESSION_NAME:0.0" "$RUN_CMD" C-m

echo "[ai] Started AI service in tmux session '$SESSION_NAME' on port 8001"
