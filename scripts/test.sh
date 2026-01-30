#!/usr/bin/env bash
set -eou pipefail

# Test runner with CLI-style flags
# Usage: ./scripts/test.sh [unit|int] [--cover] [--watch]
# Default: ./scripts/test.sh (no args) -> unit tests

TEST_TYPE="${1:-unit}"
shift || true

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
CONFIG="bunfig.$TEST_TYPE.toml"
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

# Swap bunfig.toml with test-type specific config
if [[ -f "bunfig.toml" ]]; then
  mv bunfig.toml bunfig.toml.bak
fi
cp "$CONFIG" bunfig.toml

# Run bun test
bun test "${ARGS[@]}"
EXIT_CODE=$?

# Restore original bunfig.toml
rm bunfig.toml
if [[ -f "bunfig.toml.bak" ]]; then
  mv bunfig.toml.bak bunfig.toml
fi

if [[ $EXIT_CODE -eq 0 ]]; then
  echo "✅ Done!"
fi
exit $EXIT_CODE
