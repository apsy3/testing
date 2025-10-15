#!/usr/bin/env bash
set -euo pipefail

FILE=".yarn/releases/yarn-4.4.1.cjs"
MIN_SIZE=1000000
ENSURE_SCRIPT="tools/scripts/ensure-yarn.mjs"

attempt_download() {
  if [ "${CHECK_YARN_SKIP_ENSURE:-0}" = "1" ]; then
    return
  fi
  if command -v node >/dev/null 2>&1 && [ -f "$ENSURE_SCRIPT" ]; then
    node "$ENSURE_SCRIPT" || true
  fi
}

file_size() {
  if [ -f "$1" ]; then
    stat -c%s "$1"
  else
    echo 0
  fi
}

attempt_download

if [ ! -f "$FILE" ]; then
  echo "Vendored Yarn missing: $FILE"
  echo "Download it with:"
  echo "  curl -fL -o $FILE https://github.com/yarnpkg/berry/releases/download/@yarnpkg/cli/4.4.1/yarn-4.4.1.cjs"
  exit 1
fi

SIZE=$(file_size "$FILE")
if [ "$SIZE" -lt "$MIN_SIZE" ]; then
  attempt_download
  SIZE=$(file_size "$FILE")
fi

if [ "$SIZE" -lt "$MIN_SIZE" ]; then
  cat <<MSG
Vendored Yarn CLI appears to be a placeholder (size ${SIZE} bytes).
Please replace it with the official 4.4.1 standalone build:
  curl -fL -o $FILE https://github.com/yarnpkg/berry/releases/download/@yarnpkg/cli/4.4.1/yarn-4.4.1.cjs
MSG
  exit 1
fi
