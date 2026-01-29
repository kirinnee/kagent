#!/usr/bin/env bash
set -eou pipefail

# Run CLI in development mode
# Usage: ./scripts/dev.sh [command] [options]
# Example: ./scripts/dev.sh hello --verbose
echo "🚀 Running CLI in development mode..."
bun run src/cli.ts "$@"
echo "✅ Done!"
