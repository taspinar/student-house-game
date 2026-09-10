#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."
command -v npm >/dev/null || { echo "npm is required"; exit 1; }
[[ -d node_modules ]] || npm ci

npm run lint
npm run type-check
npm test
npm run build

echo "Verification completed."
