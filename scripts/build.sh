#!/usr/bin/env bash
set -eou pipefail

# Build standalone binary
echo "🔨 Building standalone binary..."
bun build --compile --outfile dist/kagent src/cli.ts
echo "✅ Done!"
