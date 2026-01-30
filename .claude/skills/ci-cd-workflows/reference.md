# CI/CD Workflow Patterns - Reference

## Architecture Principles

1. **Local Reproducibility** - All CI scripts must run locally via `nix develop .#ci -c ./scripts/ci/script.sh`
2. **Reusable Workflows** - Named with `⚡` emoji prefix (e.g., `⚡reusable-test.yaml`)
3. **Namespace Cache Runners** - Use nscloud with cache tags for Nix store persistence
4. **No Reusable GitHub Actions** - Keep everything in shell scripts for portability

## Directory Structure

```
.github/
└── workflows/
    ├── ci.yml                     # Main CI workflow
    ├── release.yml                # Release workflow
    ├── ⚡reusable-precommit.yaml  # Pre-commit reusable
    ├── ⚡reusable-test.yaml       # Test reusable
    └── ⚡reusable-build.yaml      # Build reusable

scripts/
├── ci/
│   ├── pre-commit.sh             # CI: Run pre-commit
│   ├── test-unit.sh              # CI: Unit tests with coverage
│   ├── test-int.sh               # CI: Integration tests with coverage
│   └── build.sh                  # CI: Build and verify binary
└── ...
```

## CI Process Flow

```
Setup Nix (Atomic Environment) → Setup Caches (namespace) → Run shell script → Done
```

## Reusable Workflow Convention

### Naming

- Reusable workflows start with `⚡` emoji
- Format: `⚡reusable-{purpose}.yaml`

### Inputs

All reusable workflows accept:

| Input            | Type   | Description                                    |
| ---------------- | ------ | ---------------------------------------------- |
| `atomi_platform` | string | Platform identifier (e.g., "personal", "work") |
| `atomi_service`  | string | Service name (e.g., "kagent", "myapp")         |
| `{specific}`     | varies | Workflow-specific inputs                       |

### Caller Responsibilities

The caller workflow must:

1. Checkout code
2. Setup Nix (`AtomiCloud/actions.setup-nix@v2`)
3. Setup appropriate caches using AtomiCloud actions

### Reusable Workflow Responsibilities

The reusable workflow:

1. Runs the appropriate shell script from `scripts/ci/`
2. Uploads artifacts if needed (coverage, etc.)

## Cache Runners

### Format

```yaml
runs-on:
  - nscloud-ubuntu-22.04-amd64-4x-with-cache
  - nscloud-cache-size-50gb
  - nscloud-cache-tag-${{ inputs.atomi_platform }}-${{ inputs.atomi_service }}-nix-store-cache
```

### Examples

```yaml
# For personal/kagent project
runs-on:
  - nscloud-ubuntu-22.04-amd64-4x-with-cache
  - nscloud-cache-size-50gb
  - nscloud-cache-tag-personal-kagent-nix-store-cache
```

## AtomiCloud Cache Actions

| Action                              | Use When          |
| ----------------------------------- | ----------------- |
| `AtomiCloud/actions.cache-bun@v1`   | Project uses Bun  |
| `AtomiCloud/actions.cache-npm@v1`   | Project uses npm  |
| `AtomiCloud/actions.cache-nuget@v1` | Project uses .NET |
| `AtomiCloud/actions.cache-go@v1`    | Project uses Go   |
| `AtomiCloud/actions.cache-cargo@v1` | Project uses Rust |

## Codecov Integration

### Upload Coverage

```yaml
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

### Coverage Format

Separate coverage files by test type:

```
coverage/
├── unit/
│   └── lcov.info      # Unit test coverage
└── int/
    └── lcov.info      # Integration test coverage
```

## Reusable Workflow Templates

### Pre-Commit

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

### Test

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
        # Values: unit or int

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

      - name: Upload coverage
        if: always()
        uses: codecov/codecov-action@v5
        with:
          fail_ci_if_error: true
          verbose: true
          token: ${{ secrets.CODECOV_TOKEN }}
          files: coverage/${{ inputs.test_dir }}/lcov.info
          flags: ${{ inputs.test_dir }}
```

### Build

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

## CI Script Templates

### pre-commit.sh

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

### test-unit.sh

```bash
#!/usr/bin/env bash
set -eou pipefail

echo "⬇️ Installing Dependencies..."
bun install --frozen-lockfile
echo "✅ Done!"

./scripts/test.sh unit --cover
```

### test-int.sh

```bash
#!/usr/bin/env bash
set -eou pipefail

echo "⬇️ Installing Dependencies..."
bun install --frozen-lockfile
echo "✅ Done!"

./scripts/test.sh int --cover
```

### build.sh

```bash
#!/usr/bin/env bash
set -eou pipefail

echo "⬇️ Installing Dependencies..."
bun install --frozen-lockfile
echo "✅ Done!"

echo "🔨 Building CLI..."
./scripts/build.sh

echo "🔍 Verifying binary..."
test -f dist/kagent && ./dist/kagent --version

echo "🔦 Verifying Nix build..."
nix build .#kagent
echo "✅ Done!"
```
