---
name: ci-cd-workflows
description: CI/CD workflow patterns (reusable workflows, shell scripts, caching, codecov). Use when creating or modifying GitHub Actions workflows.
---

# CI/CD Workflow Patterns

## Overview

CI/CD architecture using reusable workflows, Nix shells, and shell scripts for local reproducibility.

## When to Use

- Creating new CI workflows
- Modifying existing workflows
- Setting up Codecov integration
- Configuring cache runners

## Instructions

### Step 1: Workflow Directory Structure

```
.github/
└── workflows/
    ├── ci.yml                     # Main CI - imports reusable workflows
    ├── release.yml                # Release - imports reusable workflows
    ├── ⚡reusable-precommit.yaml  # Reusable pre-commit workflow
    ├── ⚡reusable-test.yaml       # Reusable test workflow (NEW)
    └── ⚡reusable-build.yaml      # Reusable build workflow (NEW)
```

### Step 2: CI Process Flow

```
Setup Nix (Atomic Environment) → Setup Caches (namespace) → Run shell script → Done
```

- Use Namespace cache runners for Nix store persistence
- Caller handles setup/caches, reusable workflow runs the shell script
- No reusable GitHub actions - contain everything in shell scripts for local reproducibility

### Step 3: Reusable Workflow Conventions

- Named with `⚡` emoji prefix (e.g., `⚡reusable-test.yaml`)
- Accept `atomi_platform` and `atomi_service` inputs for cache namespacing
- Caller is responsible for:
  - Checkout
  - Setup Nix (`AtomiCloud/actions.setup-nix@v2`)
  - Setup caches (using appropriate AtomiCloud cache action)
- Reusable workflow runs the appropriate shell script from `scripts/`

### Step 4: Cache Runner Pattern

```yaml
runs-on:
  - nscloud-ubuntu-22.04-amd64-4x-with-cache
  - nscloud-cache-size-50gb
  - nscloud-cache-tag-${{ inputs.atomi_platform }}-${{ inputs.atomi_service }}-nix-store-cache
```

### Step 5: AtomiCloud Cache Actions

| Action                              | Description          | Use When          |
| ----------------------------------- | -------------------- | ----------------- |
| `AtomiCloud/actions.cache-bun@v1`   | Cache Bun Packages   | Project uses Bun  |
| `AtomiCloud/actions.cache-npm@v1`   | Cache NPM Packages   | Project uses npm  |
| `AtomiCloud/actions.cache-nuget@v1` | Cache Nuget Packages | Project uses .NET |
| `AtomiCloud/actions.cache-go@v1`    | Cache Go Modules     | Project uses Go   |
| `AtomiCloud/actions.cache-cargo@v1` | Cache Cargo Packages | Project uses Rust |

### Step 6: Codecov Integration

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

### Step 7: Local Reproducibility

All CI scripts MUST run within Nix shell and be reproducible locally:

```bash
nix develop .#ci -c ./scripts/ci/script.sh
```

## Shell Script Organization

```
scripts/
├── setup.sh          # Install dependencies
├── build.sh          # Build CLI
├── clean.sh          # Clean artifacts
├── test.sh           # Run tests (with args for unit/int/coverage)
├── test-unit.sh      # Run unit tests only
├── test-int.sh       # Run integration tests only
├── test-coverage.sh  # Run coverage report
├── lint.sh           # Run pre-commit (includes typecheck)
├── dev.sh            # Run CLI in dev mode
└── ci/
    ├── pre-commit.sh     # CI: pre-commit hook runner
    ├── test-unit.sh      # CI: unit tests with coverage upload
    ├── test-int.sh       # CI: integration tests with coverage upload
    └── build.sh          # CI: build and verify binary
```

## Main CI Workflow Template

```yaml
name: CI

on:
  push:

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

## Checklist

- [ ] Reusable workflows named with `⚡` emoji prefix
- [ ] CI uses `nscloud` cache runners with namespace tags
- [ ] All CI scripts run via `nix develop .#ci -c ./scripts/ci/script.sh`
- [ ] Codecov integration uses `v5` with separate `flags` for unit/int
- [ ] Coverage format: `coverage/{test_dir}/lcov.info`
- [ ] No lint workflow - handled by precommit reusable workflow
