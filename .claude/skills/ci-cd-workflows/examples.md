# CI/CD Workflow Patterns - Examples

## Example 1: Main CI Workflow

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:

jobs:
  precommit:
    name: Pre-Commit
    uses: ./.github/workflows/⚡reusable-precommit.yaml
    secrets: inherit
    with:
      atomi_platform: personal
      atomi_service: kagent

  test-unit:
    name: Unit Tests
    uses: ./.github/workflows/⚡reusable-test.yaml
    secrets: inherit
    with:
      atomi_platform: personal
      atomi_service: kagent
      test_dir: unit

  test-integration:
    name: Integration Tests
    uses: ./.github/workflows/⚡reusable-test.yaml
    secrets: inherit
    with:
      atomi_platform: personal
      atomi_service: kagent
      test_dir: int

  build:
    name: Build CLI
    uses: ./.github/workflows/⚡reusable-build.yaml
    secrets: inherit
    with:
      atomi_platform: personal
      atomi_service: kagent
```

## Example 2: Reusable Pre-Commit Workflow

```yaml
name: Reusable Pre-Commit

on:
  workflow_call:
    inputs:
      atomi_platform:
        required: true
        type: string
      atomi_service:
        required: true
        type: string

jobs:
  precommit:
    runs-on:
      - nscloud-ubuntu-22.04-amd64-4x-with-cache
      - nscloud-cache-size-50gb
      - nscloud-cache-tag-${{ inputs.atomi_platform }}-${{ inputs.atomi_service }}-nix-store-cache

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Nix
        uses: AtomiCloud/actions.setup-nix@v2

      - name: Run Pre-Commit
        run: nix develop .#ci -c ./scripts/ci/pre-commit.sh
```

## Example 3: Reusable Test Workflow

```yaml
name: Reusable Test

on:
  workflow_call:
    inputs:
      atomi_platform:
        required: true
        type: string
      atomi_service:
        required: true
        type: string
      test_dir:
        required: true
        type: string
        description: 'Test directory: unit or int'

jobs:
  test:
    runs-on:
      - nscloud-ubuntu-22.04-amd64-4x-with-cache
      - nscloud-cache-size-50gb
      - nscloud-cache-tag-${{ inputs.atomi_platform }}-${{ inputs.atomi_service }}-nix-store-cache

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Nix
        uses: AtomiCloud/actions.setup-nix@v2

      - name: Setup Bun Cache
        uses: AtomiCloud/actions.cache-bun@v1
        with:
          key: ${{ inputs.atomi_platform }}-${{ inputs.atomi_service }}-bun

      - name: Run Tests
        run: nix develop .#ci -c ./scripts/ci/test-${{ inputs.test_dir }}.sh

      - name: Upload coverage to Codecov
        if: always()
        uses: codecov/codecov-action@v5
        with:
          fail_ci_if_error: true
          verbose: true
          token: ${{ secrets.CODECOV_TOKEN }}
          files: coverage/${{ inputs.test_dir }}/lcov.info
          flags: ${{ inputs.test_dir }}
```

## Example 4: Reusable Build Workflow

```yaml
name: Reusable Build

on:
  workflow_call:
    inputs:
      atomi_platform:
        required: true
        type: string
      atomi_service:
        required: true
        type: string

jobs:
  build:
    runs-on:
      - nscloud-ubuntu-22.04-amd64-4x-with-cache
      - nscloud-cache-size-50gb
      - nscloud-cache-tag-${{ inputs.atomi_platform }}-${{ inputs.atomi_service }}-nix-store-cache

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Nix
        uses: AtomiCloud/actions.setup-nix@v2

      - name: Setup Bun Cache
        uses: AtomiCloud/actions.cache-bun@v1
        with:
          key: ${{ inputs.atomi_platform }}-${{ inputs.atomi_service }}-bun

      - name: Build
        run: nix develop .#ci -c ./scripts/ci/build.sh
```

## Example 5: Release Workflow

```yaml
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    runs-on:
      - nscloud-ubuntu-22.04-amd64-4x-with-cache
      - nscloud-cache-size-50gb
      - nscloud-cache-tag-personal-kagent-nix-store-cache

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Nix
        uses: AtomiCloud/actions.setup-nix@v2

      - name: Setup Bun Cache
        uses: AtomiCloud/actions.cache-bun@v1
        with:
          key: personal-kagent-bun

      - name: Release
        run: nix develop .#releaser -c ./scripts/ci/release.sh
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
```

## Example 6: Merge Gatekeeper Workflow

```yaml
name: Merge Gatekeeper

on:
  pull_request:
    branches: [main]

jobs:
  checks:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Ensure CI passed
        run: |
          gh api repos/{owner}/{repo}/actions/runs \
            --jq '.workflow_runs[] | select(.head_branch == "${{ github.head_ref }}") | .conclusion == "success"' | grep -q true

      - name: Comment on PR
        if: failure()
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: '❌ CI checks failed. Please fix before merging.'
            })
```

## Example 7: CI Scripts

### scripts/ci/pre-commit.sh

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

### scripts/ci/test-unit.sh

```bash
#!/usr/bin/env bash
set -eou pipefail

# CI unit test script with coverage
# Run via: nix develop .#ci -c ./scripts/ci/test-unit.sh

echo "⬇️ Installing Dependencies..."
bun install --frozen-lockfile
echo "✅ Done!"

./scripts/test.sh unit --cover
```

### scripts/ci/test-int.sh

```bash
#!/usr/bin/env bash
set -eou pipefail

# CI integration test script with coverage
# Run via: nix develop .#ci -c ./scripts/ci/test-int.sh

echo "⬇️ Installing Dependencies..."
bun install --frozen-lockfile
echo "✅ Done!"

./scripts/test.sh int --cover
```

### scripts/ci/build.sh

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

### scripts/ci/release.sh

```bash
#!/usr/bin/env bash
set -eou pipefail

echo "🔨 Building..."
bun run build

echo "📦 Publishing..."
bun publish
```

## Example 8: Local Testing

All CI scripts can be run locally using Nix:

```bash
# Test pre-commit locally
nix develop .#ci -c ./scripts/ci/pre-commit.sh

# Test unit tests locally
nix develop .#ci -c ./scripts/ci/test-unit.sh

# Test integration tests locally
nix develop .#ci -c ./scripts/ci/test-int.sh

# Test build locally
nix develop .#ci -c ./scripts/ci/build.sh
```

## Example 9: Multiple Platforms

```yaml
name: CI

on:
  push:

jobs:
  test:
    strategy:
      matrix:
        platform: [personal, work]
        service: [kagent, other-app]

    name: Test ${{ matrix.platform }}/${{ matrix.service }}
    uses: ./.github/workflows/⚡reusable-test.yaml
    secrets: inherit
    with:
      atomi_platform: ${{ matrix.platform }}
      atomi_service: ${{ matrix.service }}
      test_dir: unit
```

## Example 10: Conditional Jobs

```yaml
name: CI

on:
  push:

jobs:
  precommit:
    if: github.event_name == 'push'
    uses: ./.github/workflows/⚡reusable-precommit.yaml
    secrets: inherit
    with:
      atomi_platform: personal
      atomi_service: kagent
```
