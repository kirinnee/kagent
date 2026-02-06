---
id: linting
title: Linting
---

# Linting

This document describes the linting conventions used in the workspace template.

## Overview

Pre-commit based linting for code quality and consistency. All linting is executed through pre-commit hooks that run in Nix shells.

## Running Linting

```bash
# Run all linters
pls lint

# Equivalent to
pre-commit run --all
```

## Pre-Commit Principles

### Single Command

All linting is executed via a single command:

```bash
pre-commit run --all
```

This runs all configured hooks against all files.

### Nix-Based Hooks

Pre-commit hooks run in Nix shells, ensuring:

- Consistent tool versions across environments
- No local installation required
- Reproducible linting results

### What's Included

The specific hooks vary by project, but typically include:

- Linters (language-specific)
- Formatters (code style)
- Type checkers
- Security scanners
- Custom validation hooks

## Common Pre-Commit Hooks (Examples)

**Note:** These are examples. Your project may have different hooks.

| Hook                       | Purpose                      |
| -------------------------- | ---------------------------- |
| `trim-trailing-whitespace` | Remove trailing whitespace   |
| `end-of-file-fixer`        | Ensure newline at EOF        |
| `check-yaml`               | Validate YAML syntax         |
| `check-json`               | Validate JSON syntax         |
| `check-toml`               | Validate TOML syntax         |
| Language-specific          | Go, TypeScript, Python, etc. |

## Configuration

Pre-commit hooks are configured in `.pre-commit-config.yaml` at the project root.

## Running Individual Hooks

```bash
# Run a specific hook
pre-commit run trailing-whitespace --all

# Run hooks for specific files
pre-commit run --files path/to/file
```

## CI Integration

Linting runs in CI via the pre-commit reusable workflow:

```yaml
- run: nix develop .#ci -c ./scripts/ci/pre-commit.sh
```

The shell script simply calls `pre-commit run --all`.

## Summary

| Aspect            | Pattern                            |
| ----------------- | ---------------------------------- |
| **Command**       | `pre-commit run --all`             |
| **Alias**         | `pls lint`                         |
| **Environment**   | Nix shell                          |
| **Configuration** | `.pre-commit-config.yaml`          |
| **CI**            | Run via `scripts/ci/pre-commit.sh` |
