#!/usr/bin/env bash
set -euo pipefail
FILE=".yarn/releases/yarn-4.4.1.cjs"
MIN_SIZE=1000000
if [ ! -f "$FILE" ]; then
  echo "Vendored Yarn missing: $FILE"
  echo "Download it with:"
  echo "  curl -fL -o $FILE https://github.com/yarnpkg/berry/releases/download/@yarnpkg/cli/4.4.1/yarn-4.4.1.cjs"
  exit 1
fi
SIZE=$(stat -c%s "$FILE" 2>/dev/null || echo 0)
if [ "$SIZE" -lt "$MIN_SIZE" ]; then
  cat <<MSG
Vendored Yarn CLI appears to be a placeholder (size ${SIZE} bytes).
Please replace it with the official 4.4.1 standalone build:
  curl -fL -o $FILE https://github.com/yarnpkg/berry/releases/download/@yarnpkg/cli/4.4.1/yarn-4.4.1.cjs
MSG
  exit 1
fi
