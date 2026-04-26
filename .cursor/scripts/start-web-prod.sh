#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
SESSION_NAME="${SESSION_NAME:-web-prod}"
WEB_PORT="${WEB_PORT:-5173}"

cd "$REPO_ROOT"

export NODE_ENV="${NODE_ENV:-production}"

if [[ ! -d apps/web/dist ]]; then
  echo "[start-web-prod] Build output missing, running npm run build:web"
  npm run build:web
fi

SESSION_NAME="$SESSION_NAME"; tmux -f /exec-daemon/tmux.portal.conf has-session -t "=$SESSION_NAME" 2>/dev/null || \
  tmux -f /exec-daemon/tmux.portal.conf new-session -d -s "$SESSION_NAME" -c "$PWD" -- "${SHELL:-zsh}" -l

RUN_CMD="cd \"$REPO_ROOT\" && NODE_ENV=production npm run preview --workspace=@save-sabi/web -- --host 0.0.0.0 --port \"$WEB_PORT\""
tmux -f /exec-daemon/tmux.portal.conf send-keys -t "$SESSION_NAME:0.0" C-c
tmux -f /exec-daemon/tmux.portal.conf send-keys -t "$SESSION_NAME:0.0" "$RUN_CMD" C-m

echo "[web] Started web preview in tmux session '$SESSION_NAME' on port $WEB_PORT"
