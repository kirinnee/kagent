---
id: ci-cd
title: CI/CD Workflows
---

# CI/CD Workflows

This document describes the principles and patterns for CI/CD workflows in the workspace template.

## Architecture Overview

The CI/CD architecture is designed around three core principles:

1. **Local reproducibility** - All CI scripts must be runnable locally
2. **Separation of concerns** - GitHub Actions is just a task runner; logic lives in shell scripts
3. **Reusable patterns** - Abstract complexity into reusable workflows

## Three Workflow Types

| Workflow    | Trigger                          | Purpose                                    |
| ----------- | -------------------------------- | ------------------------------------------ |
| **CI**      | Every commit                     | Gates and checks that must pass regardless |
| **Release** | Merge to main (after CI success) | Semantic versioning, changelog, git tag    |
| **CD**      | New version (tag push)           | Deploy artifacts                           |

### CI Workflow

Runs on every commit to verify code quality. Example jobs might include:

- Pre-commit hooks (linting, formatting)
- Unit tests
- Integration tests
- Builds
- Docker builds (if applicable)
- Helm lint/packaging (if applicable)

### Release Workflow

Runs only after successful CI on main branch. Handles:

- Semantic versioning based on commit types
- Changelog generation
- Git tag creation
- GitHub release creation

### CD Workflow

Runs when a new version tag is pushed. Handles deployment:

- Docker image pushes
- Helm chart pushes
- Other deployment operations

## The Execution Pattern

```
Setup Nix -> Setup Caches -> nix develop -c ./scripts/ci/script.sh
```

**Why this pattern?**

- GitHub Actions is just a task runner
- Real logic lives in shell scripts
- Shell scripts run in Nix = **local reproducibility**
- You can run CI locally: `nix develop .#ci -c ./scripts/ci/script.sh`

### Example Execution

```yaml
- uses: AtomiCloud/actions.setup-nix@v2
- uses: actions/checkout@v4
- uses: AtomiCloud/actions.cache-nix-store@v1 # with LPSM namespacing
- run: nix develop .#ci -c ./scripts/ci/script.sh
```

## Reusable Workflow Conventions

### Naming

- Reusable workflows are named with `⚡` emoji prefix
- Format: `⚡reusable-{purpose}.yaml`
- Examples: `⚡reusable-precommit.yaml`, `⚡reusable-test.yaml`

### Separation of Responsibilities

**Caller workflow is responsible for:**

- Checkout (`actions/checkout@v4`)
- Setup Nix (`AtomiCloud/actions.setup-nix@v2`)
- Setup caches (language-specific + Nix store)

**Reusable workflow is responsible for:**

- Running the shell script from `scripts/ci/`

### Example: Reusable Workflow Structure

```yaml
# .github/workflows/⚡reusable-precommit.yaml
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
      - run: nix develop .#ci -c ./scripts/ci/pre-commit.sh
```

```yaml
# .github/workflows/ci.yaml (caller)
name: CI

on:
  push:

jobs:
  precommit:
    uses: ./.github/workflows/⚡reusable-precommit.yaml
    secrets: inherit
    with:
      atomi_platform: ${{ github.repository_owner }}
      atomi_service: ${{ github.event.repository.name }}
```

## Infrastructure and Caching

### NS-Cloud Runners

Runners with Nix store caching for persistent build artifacts.

### LPSM-Based Cache Namespacing

Cache keys MUST use LPSM naming: `{platform}-{service}-*`

```yaml
nscloud-cache-tag-${{ inputs.atomi_platform }}-${{ inputs.atomi_service }}-nix-store-cache
```

This ensures:

- Caches are isolated per service
- No cache conflicts between services
- Predictable cache key patterns

### AtomiCloud Cache Actions

| Action                              | Description          |
| ----------------------------------- | -------------------- |
| `AtomiCloud/actions.cache-bun@v1`   | Cache Bun packages   |
| `AtomiCloud/actions.cache-npm@v1`   | Cache npm packages   |
| `AtomiCloud/actions.cache-nuget@v1` | Cache NuGet packages |
| `AtomiCloud/actions.cache-go@v1`    | Cache Go modules     |
| `AtomiCloud/actions.cache-cargo@v1` | Cache Cargo packages |

### Required Inputs

All reusable workflows MUST accept:

- `atomi_platform` - Platform name for cache namespacing
- `atomi_service` - Service name for cache namespacing

## Local Reproducibility

All CI scripts MUST be runnable locally:

```bash
nix develop .#ci -c ./scripts/ci/script.sh
```

This allows developers to:

- Debug CI failures locally
- Run checks without pushing
- Verify changes before committing

## Directory Structure

```
.github/
└── workflows/
    ├── ci.yml                     # Main CI workflow
    ├── release.yml                # Release workflow
    ├── cd.yml                     # Deploy workflow
    ├── ⚡reusable-precommit.yaml  # Reusable pre-commit
    ├── ⚡reusable-test.yaml       # Reusable test (example)
    └── ⚡reusable-build.yaml      # Reusable build (example)

scripts/
└── ci/
    ├── pre-commit.sh              # CI: pre-commit hooks
    ├── test-unit.sh               # CI: unit tests
    ├── test-int.sh                # CI: integration tests
    ├── build.sh                   # CI: build
    ├── docker.sh                  # CI: docker build (example)
    └── helm.sh                    # CI: helm lint/pack (example)
```

## Summary

| Aspect                    | Pattern                                                |
| ------------------------- | ------------------------------------------------------ |
| **Workflow types**        | CI (every commit), Release (main merge), CD (tag push) |
| **Execution**             | Nix -> Caches -> shell script                          |
| **Reusable workflows**    | Named with `⚡`, caller handles setup/caches           |
| **Cache namespacing**     | `{platform}-{service}-nix-store-cache`                 |
| **Local reproducibility** | `nix develop .#ci -c ./scripts/ci/script.sh`           |
