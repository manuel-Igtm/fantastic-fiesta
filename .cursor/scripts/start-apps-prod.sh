#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

cd "$REPO_ROOT"

SESSION_NAME="ai-prod"; tmux -f /exec-daemon/tmux.portal.conf has-session -t "=$SESSION_NAME" 2>/dev/null || \
  tmux -f /exec-daemon/tmux.portal.conf new-session -d -s "$SESSION_NAME" -c "$PWD" -- "${SHELL:-zsh}" -l
SESSION_NAME="web-prod"; tmux -f /exec-daemon/tmux.portal.conf has-session -t "=$SESSION_NAME" 2>/dev/null || \
  tmux -f /exec-daemon/tmux.portal.conf new-session -d -s "$SESSION_NAME" -c "$PWD" -- "${SHELL:-zsh}" -l

"$SCRIPT_DIR/start-api-prod.sh"

tmux -f /exec-daemon/tmux.portal.conf send-keys -t "ai-prod:0.0" C-c
tmux -f /exec-daemon/tmux.portal.conf send-keys -t "ai-prod:0.0" "cd \"$REPO_ROOT\" && $SCRIPT_DIR/start-ai-prod.sh" C-m

tmux -f /exec-daemon/tmux.portal.conf send-keys -t "web-prod:0.0" C-c
tmux -f /exec-daemon/tmux.portal.conf send-keys -t "web-prod:0.0" "cd \"$REPO_ROOT\" && $SCRIPT_DIR/start-web-prod.sh" C-m

echo "[apps] Started API, AI, and Web production sessions."
echo "[apps] Use: tmux -f /exec-daemon/tmux.portal.conf ls"
