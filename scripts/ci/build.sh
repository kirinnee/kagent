#!/usr/bin/env bash
set -eou pipefail

# CI build script - delegates to main build.sh
# Run via: nix develop .#ci -c ./scripts/ci/build.sh

echo "🔨 Building CLI..."
./scripts/build.sh

# Verify binary exists
echo "🔍 Verifying binary..."
test -f dist/kagent && ./dist/kagent --version
echo "✅ Done!"
