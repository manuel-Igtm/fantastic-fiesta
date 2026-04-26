#!/usr/bin/env bash

set -euo pipefail

echo "[docker] Checking Docker CLI availability"
if ! command -v docker >/dev/null 2>&1; then
  echo "[docker] Docker CLI is not installed in this environment."
  exit 1
fi

if docker info >/dev/null 2>&1; then
  echo "[docker] Docker daemon is already available."
  docker compose version >/dev/null 2>&1 || true
  exit 0
fi

if command -v systemctl >/dev/null 2>&1 && systemctl is-system-running >/dev/null 2>&1; then
  echo "[docker] Attempting systemd-managed startup"
  sudo systemctl enable --now docker >/dev/null 2>&1 || true
fi

if docker info >/dev/null 2>&1; then
  echo "[docker] Docker daemon started via systemd."
  docker compose version >/dev/null 2>&1 || true
  exit 0
fi

SESSION_NAME="docker-daemon"
tmux -f /exec-daemon/tmux.portal.conf has-session -t "=$SESSION_NAME" 2>/dev/null || \
  tmux -f /exec-daemon/tmux.portal.conf new-session -d -s "$SESSION_NAME" -c "$PWD" -- "${SHELL:-zsh}" -l

echo "[docker] Starting dockerd in tmux session '$SESSION_NAME' with non-systemd-safe flags."
tmux -f /exec-daemon/tmux.portal.conf send-keys -t "$SESSION_NAME:0.0" C-c
tmux -f /exec-daemon/tmux.portal.conf send-keys -t "$SESSION_NAME:0.0" \
  "sudo dockerd --host=unix:///var/run/docker.sock --iptables=false --bridge=none --ip-forward=false --ip-masq=false > /tmp/save-sabi-dockerd.log 2>&1" C-m

for _ in $(seq 1 20); do
  if docker info >/dev/null 2>&1; then
    echo "[docker] Docker daemon is ready."
    docker compose version >/dev/null 2>&1 || true
    exit 0
  fi
  sleep 1
done

echo "[docker] Warning: docker daemon could not be started in this runtime."
echo "[docker] Continuing without daemon. See /tmp/save-sabi-dockerd.log for details."
exit 0
