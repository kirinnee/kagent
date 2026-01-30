# Shell Script Conventions - Examples

## Example 1: Simple Setup Script

```bash
#!/usr/bin/env bash
set -eou pipefail

# Install project dependencies

echo "⬇️ Installing Dependencies..."
bun install
echo "✅ Done!"
```

## Example 2: Build Script

```bash
#!/usr/bin/env bash
set -eou pipefail

# Build standalone binary

echo "🔨 Building standalone binary..."
bun build --compile --outfile dist/kagent src/cli.ts
echo "✅ Done!"
```

## Example 3: Clean Script

```bash
#!/usr/bin/env bash
set -eou pipefail

# Clean build artifacts and dependencies

echo "🧹 Cleaning build artifacts and dependencies..."
rm -rf dist node_modules coverage
echo "✅ Done!"
```

## Example 4: Test Script with Arguments

```bash
#!/usr/bin/env bash
set -eou pipefail

# Test runner with CLI-style flags
# Usage: ./scripts/test.sh [unit|int] [--cover] [--watch]

TEST_TYPE="${1:-unit}"
shift || true

# Parse flags
COVER=false
WATCH=false

while [[ $# -gt 0 ]]; do
  case "$1" in
  --cover)
    COVER=true
    shift
    ;;
  --watch)
    WATCH=true
    shift
    ;;
  *)
    echo "❌ Unknown flag: $1"
    echo "Usage: ./scripts/test.sh [unit|int] [--cover] [--watch]"
    exit 1
    ;;
  esac
done

# Determine test directory and bun config
case "$TEST_TYPE" in
unit)
  echo "🧪 Running unit tests..."
  ;;
int)
  echo "🧪 Running integration tests..."
  ;;
*)
  echo "❌ Unknown test type: $TEST_TYPE"
  echo "Usage: ./scripts/test.sh [unit|int] [--cover] [--watch]"
  exit 1
  ;;
esac

TEST_DIR="test/$TEST_TYPE"
CONFIG="bun.config.$TEST_TYPE.ts"

# Run bun test with config and propagate all args
bun test --config "$CONFIG" "$TEST_DIR" "$@"
echo "✅ Done!"
```

## Example 5: CI Build Script

```bash
#!/usr/bin/env bash
set -eou pipefail

# CI build script - delegates to main build.sh
# Run via: nix develop .#ci -c ./scripts/ci/build.sh

echo "⬇️ Installing Dependencies..."
bun install --frozen-lockfile
echo "✅ Done!"

echo "🔨 Building CLI..."
./scripts/build.sh

# Verify binary exists and Nix build works
echo "🔍 Verifying binary..."
test -f dist/kagent && ./dist/kagent --version

echo "🔦 Verifying Nix build..."
nix build .#kagent
echo "✅ Done!"
```

## Example 6: Pre-Commit Script

```bash
#!/usr/bin/env bash
set -eou pipefail

echo "⬇️ Installing Dependencies..."
bun install --frozen-lockfile
echo "✅ Done!"

echo "🔍 Running Pre-Commit..."
pre-commit run --all -v
echo "✅ Done!"
```

## Example 7: Dev Script with Arguments

```bash
#!/usr/bin/env bash
set -eou pipefail

# Run CLI in development mode
# Usage: ./scripts/dev.sh [command] [options]
# Example: ./scripts/dev.sh hello --verbose

echo "🚀 Running CLI in development mode..."
bun run src/cli.ts "$@"
echo "✅ Done!"
```

## Example 8: Multi-Step Script

```bash
#!/usr/bin/env bash
set -eou pipefail

# Complete build and test pipeline

echo "⬇️ Installing Dependencies..."
bun install --frozen-lockfile
echo "✅ Done!"

echo "🔨 Building..."
bun run build
echo "✅ Done!"

echo "🧪 Running tests..."
bun test
echo "✅ Done!"

echo "🔍 Running linter..."
pre-commit run --all
echo "✅ Done!"

echo "🎉 All checks passed!"
```

## Example 9: Script with Error Handling

```bash
#!/usr/bin/env bash
set -eou pipefail

# Check required commands
if ! command -v bun &> /dev/null; then
  echo "❌ bun is required but not installed"
  exit 1
fi

if ! command -v git &> /dev/null; then
  echo "❌ git is required but not installed"
  exit 1
fi

echo "⬇️ Installing Dependencies..."
bun install
echo "✅ Done!"

echo "🔨 Building..."
bun run build
echo "✅ Done!"
```

## Example 10: Script with Cleanup

```bash
#!/usr/bin/env bash
set -eou pipefail

# Build script with cleanup on failure

# Cleanup function
cleanup() {
  if [[ -d "./temp" ]]; then
    echo "🧹 Cleaning up temporary files..."
    rm -rf ./temp
  fi
}

# Trap exit signals
trap cleanup EXIT

echo "🔨 Building..."

# Create temp directory
mkdir -p ./temp

# Do some work
touch ./temp/file.txt

echo "✅ Done!"
# cleanup runs automatically here
```
