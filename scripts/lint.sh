#!/usr/bin/env bash
set -eou pipefail

# Run pre-commit hooks
echo "🔍 Running pre-commit hooks..."
pre-commit run --all
echo "✅ Done!"
