#!/usr/bin/env bash
set -eou pipefail

# Test runner with CLI-style flags
# Usage: ./scripts/test.sh [unit|int] [--cover] [--watch]
# Default: ./scripts/test.sh (no args) -> unit tests

TEST_TYPE="${1:-unit}"
shift || true

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
COVER_DIR="coverage/$TEST_TYPE"

# Build args, starting with test directory
ARGS=("$TEST_DIR")

# Process remaining args and convert --cover to --coverage
for arg in "$@"; do
  if [[ $arg == "--cover" ]]; then
    ARGS+=(--coverage --coverage-dir "$COVER_DIR")
  else
    ARGS+=("$arg")
  fi
done

# Run bun test with config and all args
bun test --config "$CONFIG" "${ARGS[@]}"
echo "✅ Done!"
