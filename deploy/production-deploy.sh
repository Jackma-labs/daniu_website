#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/daniu/app}"
BRANCH="${BRANCH:-main}"

if [ ! -d "$APP_DIR/.git" ]; then
  echo "Missing git checkout: $APP_DIR" >&2
  exit 1
fi

cd "$APP_DIR"

git fetch origin "$BRANCH"
current_branch="$(git branch --show-current)"
if [ "$current_branch" != "$BRANCH" ]; then
  git checkout "$BRANCH"
fi
git pull --ff-only origin "$BRANCH"

if docker compose version >/dev/null 2>&1; then
  compose_cmd="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
  compose_cmd="docker-compose"
else
  echo "Docker Compose is not installed." >&2
  exit 1
fi

$compose_cmd -f docker-compose.yml up -d --build --remove-orphans
$compose_cmd -f docker-compose.yml ps
