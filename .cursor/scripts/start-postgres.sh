#!/usr/bin/env bash

set -euo pipefail

if command -v service >/dev/null 2>&1; then
  sudo service postgresql start >/dev/null
  echo "[postgres] started via service"
else
  sudo -u postgres pg_ctlcluster 16 main start
  echo "[postgres] started via pg_ctlcluster"
fi

pg_isready -h 127.0.0.1 -p 5432 -U postgres >/dev/null
echo "[postgres] ready on 127.0.0.1:5432"
