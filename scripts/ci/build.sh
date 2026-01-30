#!/usr/bin/env bash
set -eou pipefail

# CI build script - builds CLI and verifies Nix build
# Run via: nix develop .#ci -c ./scripts/ci/build.sh

echo "⬇️ Installing Dependencies..."
bun install --frozen-lockfile
echo "✅ Done!"

echo "🔨 Building CLI..."
bun build --compile --outfile dist/kagent src/cli.ts
echo "✅ Done!"

# Verify binary exists and works
echo "🔍 Verifying binary..."
test -f dist/kagent && ./dist/kagent --version

echo "🔦 Verifying Nix build..."
nix build .#kagent
echo "✅ Done!"

echo "🔍 Verifying binary..."
test -f result/bin/kagent && ./result/bin/kagent --version
