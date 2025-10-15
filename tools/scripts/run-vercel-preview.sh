#!/usr/bin/env bash
set -euo pipefail

if ! command -v vercel >/dev/null 2>&1; then
  echo "Vercel CLI not found. Install it with 'pnpm dlx vercel@latest login' or 'npm install -g vercel'." >&2
  exit 1
fi

if ! command -v pnpm >/dev/null 2>&1; then
  echo "pnpm is required. Install it from https://pnpm.io/installation." >&2
  exit 1
fi

ROOT_DIR=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
APP_DIR=${APP_DIR:-"$ROOT_DIR/apps/web"}

if [ ! -d "$APP_DIR" ]; then
  echo "Could not find Next.js app at '$APP_DIR'. Set APP_DIR to your app directory." >&2
  exit 1
fi

VERCEL_TOKEN=${VERCEL_TOKEN:-}
if [ -z "$VERCEL_TOKEN" ]; then
  echo "VERCEL_TOKEN environment variable is required (create from Vercel account settings)." >&2
  exit 1
fi

VERCEL_ORG_ID=${VERCEL_ORG_ID:-}
VERCEL_PROJECT_ID=${VERCEL_PROJECT_ID:-}
if [ -z "$VERCEL_ORG_ID" ] || [ -z "$VERCEL_PROJECT_ID" ]; then
  echo "Both VERCEL_ORG_ID and VERCEL_PROJECT_ID must be set. Use 'vercel link' or the Vercel dashboard to obtain them." >&2
  exit 1
fi

ENVIRONMENT=${ENVIRONMENT:-preview}
ENV_FILE=${ENV_FILE:-.env.${ENVIRONMENT}}

if [ -n "$ENV_FILE" ] && [ ! -f "$ENV_FILE" ]; then
  echo "Environment file '$ENV_FILE' not found. The deploy will use variables from Vercel unless you provide one." >&2
fi

PNPM_LOCK_FLAGS=()
if [ -f "$ROOT_DIR/pnpm-lock.yaml" ] || [ -f "$APP_DIR/pnpm-lock.yaml" ]; then
  PNPM_LOCK_FLAGS+=(--frozen-lockfile)
fi

if [ -f "$ROOT_DIR/pnpm-workspace.yaml" ]; then
  pnpm install "${PNPM_LOCK_FLAGS[@]}"
else
  pnpm --dir "$APP_DIR" install "${PNPM_LOCK_FLAGS[@]}"
fi

pnpm --dir "$APP_DIR" build

VERCEL_BASE_ARGS=(--cwd "$APP_DIR" --token "$VERCEL_TOKEN")
VERCEL_SCOPE=${VERCEL_SCOPE:-${VERCEL_TEAM:-}}
if [ -n "$VERCEL_SCOPE" ]; then
  VERCEL_BASE_ARGS+=(--scope "$VERCEL_SCOPE")
fi

VERCEL_ENV_ARGS=()
if [ -n "$ENV_FILE" ] && [ -f "$ENV_FILE" ]; then
  VERCEL_ENV_ARGS+=(--env-file "$ENV_FILE")
fi

run_vercel() {
  env VERCEL_ORG_ID="$VERCEL_ORG_ID" VERCEL_PROJECT_ID="$VERCEL_PROJECT_ID" vercel "$@"
}

run_vercel "${VERCEL_BASE_ARGS[@]}" pull --yes --environment "$ENVIRONMENT"
run_vercel "${VERCEL_BASE_ARGS[@]}" build
DEPLOYMENT_URL=$(run_vercel "${VERCEL_BASE_ARGS[@]}" deploy --prebuilt "${VERCEL_ENV_ARGS[@]}")

echo "Preview deployment ready: $DEPLOYMENT_URL"

TEST_ALIAS=${TEST_ALIAS:-}
if [ -n "$TEST_ALIAS" ]; then
  run_vercel "${VERCEL_BASE_ARGS[@]}" alias "$DEPLOYMENT_URL" "$TEST_ALIAS"
  echo "Alias '$TEST_ALIAS' updated to point at $DEPLOYMENT_URL"
fi
