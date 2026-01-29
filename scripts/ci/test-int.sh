#!/usr/bin/env bash
set -eou pipefail

# CI integration test script with coverage
# Run via: nix develop .#ci -c ./scripts/ci/test-int.sh

./scripts/test.sh int --cover
