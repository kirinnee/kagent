#!/usr/bin/env bash
set -eou pipefail

# CI test script with coverage and threshold check
# Requires TEST_TYPE environment variable (unit or int)
# Requires COVERAGE_TARGET percentage (e.g. 100)
# Run via: nix develop .#ci -c 'TEST_TYPE=unit COVERAGE_TARGET=100 ./scripts/ci/test.sh'
#          nix develop .#ci -c 'TEST_TYPE=int COVERAGE_TARGET=80 ./scripts/ci/test.sh'

if [[ ${TEST_TYPE:-} != "unit" && ${TEST_TYPE:-} != "int" ]]; then
  echo "❌ TEST_TYPE must be 'unit' or 'int'"
  exit 1
fi

if [[ -z ${COVERAGE_TARGET:-} ]]; then
  echo "❌ COVERAGE_TARGET is required"
  exit 1
fi

echo "⬇️ Installing Dependencies..."
bun install --frozen-lockfile
echo "✅ Done!"

echo "🧪 Running tests with coverage ($TEST_TYPE)..."
./scripts/test.sh "$TEST_TYPE" --cover
echo "✅ Tests passed"

echo "📈 Checking coverage threshold (${COVERAGE_TARGET}%)..."
LCOV_FILE="coverage/$TEST_TYPE/lcov.info"
if [[ ! -f $LCOV_FILE ]]; then
  echo "❌ Coverage file not found: $LCOV_FILE"
  exit 1
fi

lcov --summary "$LCOV_FILE" --fail-under-lines "$COVERAGE_TARGET"
echo "✅ Coverage meets target"

echo "✅ Done!"
