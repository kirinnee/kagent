#!/usr/bin/env bash
set -eou pipefail

# Clean build artifacts and dependencies
echo "🧹 Cleaning build artifacts and dependencies..."
rm -rf dist node_modules coverage
echo "✅ Done!"
