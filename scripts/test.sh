#!/usr/bin/env bash
set -eou pipefail

# Test runner with CLI-style flags
# Usage: ./scripts/test.sh [unit|int] [--cover] [--watch]
# Default: ./scripts/test.sh (no args) -> unit tests

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
    echo "Unknown flag: $1"
    echo "Usage: ./scripts/test.sh [unit|int] [--cover] [--watch]"
    exit 1
    ;;
  esac
done

# Build test command
TEST_CMD="bun test"

# Add coverage if requested
if [[ $COVER == true ]]; then
  TEST_CMD="$TEST_CMD --coverage"
fi

# Add watch if requested
if [[ $WATCH == true ]]; then
  TEST_CMD="$TEST_CMD --watch"
fi

# Determine test directory and coverage dir
case "$TEST_TYPE" in
unit)
  echo "🧪 Running unit tests..."
  TEST_DIR="test/unit"
  if [[ $COVER == true ]]; then
    COVERAGE_DIR="coverage/unit"
    mkdir -p "$COVERAGE_DIR"
    TEST_CMD="$TEST_CMD --coverage-reporter=text --coverage-reporter=lcov --coverage-dir=$COVERAGE_DIR"
  fi
  ;;
int)
  echo "🧪 Running integration tests..."
  TEST_DIR="test/int"
  if [[ $COVER == true ]]; then
    COVERAGE_DIR="coverage/int"
    mkdir -p "$COVERAGE_DIR"
    TEST_CMD="$TEST_CMD --coverage-reporter=text --coverage-reporter=lcov --coverage-dir=$COVERAGE_DIR"
  fi
  ;;
*)
  echo "❌ Unknown test type: $TEST_TYPE"
  echo "Usage: ./scripts/test.sh [unit|int] [--cover] [--watch]"
  exit 1
  ;;
esac

# Run tests
$TEST_CMD "$TEST_DIR"
echo "✅ Done!"
