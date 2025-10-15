#!/usr/bin/env bash
set -euo pipefail
FILE=".yarn/releases/yarn-4.4.1.cjs"
if [ ! -f "$FILE" ]; then
  echo "Vendored Yarn missing: $FILE"
  echo "Download it with:"
  echo "  curl -fL -o $FILE https://github.com/yarnpkg/berry/releases/download/@yarnpkg/cli/4.4.1/yarn-4.4.1.cjs"
  exit 1
fi
