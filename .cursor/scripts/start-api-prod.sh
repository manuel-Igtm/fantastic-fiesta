#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
SESSION_NAME="${SESSION_NAME:-api-prod}"

cd "$REPO_ROOT"

SESSION_NAME="$SESSION_NAME"; tmux -f /exec-daemon/tmux.portal.conf has-session -t "=$SESSION_NAME" 2>/dev/null || \
  tmux -f /exec-daemon/tmux.portal.conf new-session -d -s "$SESSION_NAME" -c "$PWD" -- "${SHELL:-zsh}" -l

API_PORT="${API_PORT:-3000}"
DATABASE_URL="${DATABASE_URL:-postgresql://save_sabi:save_sabi_dev@localhost:5432/save_sabi}"
REDIS_URL="${REDIS_URL:-redis://localhost:6379}"
JWT_ACCESS_SECRET="${JWT_ACCESS_SECRET:-dev-access-secret}"
JWT_REFRESH_SECRET="${JWT_REFRESH_SECRET:-dev-refresh-secret}"
JWT_ACCESS_TTL="${JWT_ACCESS_TTL:-900}"
JWT_REFRESH_TTL="${JWT_REFRESH_TTL:-2592000}"
TOKENIZATION_SECRET="${TOKENIZATION_SECRET:-dev-tokenization-secret}"
CALLBACK_SIGNING_SECRET="${CALLBACK_SIGNING_SECRET:-dev-callback-signing-secret}"
PARTNER_CALLBACK_SECRET="${PARTNER_CALLBACK_SECRET:-dev-partner-callback-secret}"
IDEMPOTENCY_KEY_TTL_SECONDS="${IDEMPOTENCY_KEY_TTL_SECONDS:-86400}"
AI_ORCHESTRATOR_URL="${AI_ORCHESTRATOR_URL:-http://127.0.0.1:8001}"

RUN_CMD="cd \"$REPO_ROOT\" && \
NODE_ENV=production \
API_PORT=\"$API_PORT\" \
DATABASE_URL=\"$DATABASE_URL\" \
REDIS_URL=\"$REDIS_URL\" \
JWT_ACCESS_SECRET=\"$JWT_ACCESS_SECRET\" \
JWT_REFRESH_SECRET=\"$JWT_REFRESH_SECRET\" \
JWT_ACCESS_TTL=\"$JWT_ACCESS_TTL\" \
JWT_REFRESH_TTL=\"$JWT_REFRESH_TTL\" \
TOKENIZATION_SECRET=\"$TOKENIZATION_SECRET\" \
CALLBACK_SIGNING_SECRET=\"$CALLBACK_SIGNING_SECRET\" \
PARTNER_CALLBACK_SECRET=\"$PARTNER_CALLBACK_SECRET\" \
IDEMPOTENCY_KEY_TTL_SECONDS=\"$IDEMPOTENCY_KEY_TTL_SECONDS\" \
AI_ORCHESTRATOR_URL=\"$AI_ORCHESTRATOR_URL\" \
node apps/api/dist/main.js"

tmux -f /exec-daemon/tmux.portal.conf send-keys -t "$SESSION_NAME:0.0" C-c
tmux -f /exec-daemon/tmux.portal.conf send-keys -t "$SESSION_NAME:0.0" "$RUN_CMD" C-m

echo "[api] Started API in tmux session '$SESSION_NAME' on port $API_PORT"
