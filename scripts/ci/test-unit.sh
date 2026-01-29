#!/usr/bin/env bash
set -eou pipefail

# CI unit test script with coverage
# Run via: nix develop .#ci -c ./scripts/ci/test-unit.sh

./scripts/test.sh unit --cover
