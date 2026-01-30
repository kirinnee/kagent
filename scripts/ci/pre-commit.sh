#!/usr/bin/env bash
set -eou pipefail

echo "⬇️ Installing Dependencies..."
bun install --frozen-lockfile
echo "✅ Done!"

echo "🔍 Running Pre-Commit..."
pre-commit run --all -v
echo "✅ Done!"
