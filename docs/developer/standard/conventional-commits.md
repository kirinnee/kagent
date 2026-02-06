---
id: conventional-commits
title: Conventional Commits
---

# Conventional Commits

This document describes the commit conventions used in the workspace template.

## Overview

We follow [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) for structured commit messages.

## Format

```
type(scope): description
```

### Examples

```
feat(api): add new user endpoint
fix(auth): resolve token expiration issue
docs(readme): update installation instructions
ci(github): add workflow cache configuration
```

## Commit Types

Each repository has its own commit types and scopes defined in `atomi_release.yaml`. The specific types available vary by project.

**Important**: Always refer to your project's generated `CommitConventions.md` for:

- Available types
- Available scopes for each type
- Release behavior (which types trigger releases)

## VAE Format (Verb-Application-Example)

Some commit types have VAE guidance in `atomi_release.yaml`:

```yaml
vae:
  verb: add # The action verb
  application: <scope>, <title> # What it applies to
  example: 'feat: new withdraw api' # Example
```

This helps writers understand how to structure commits effectively.

## Finding Your Commit Conventions

Each project generates `CommitConventions.md` from its `atomi_release.yaml` configuration using the `sg` tool. This file contains:

1. All available commit types
2. Available scopes for each type
3. Release behavior (major/minor/patch/no-release)
4. VAE examples for applicable types

To generate or view your conventions:

```bash
# View the generated file
cat docs/developer/CommitConventions.md

# Regenerate (if needed)
sg sync
```

## Release Behavior

Different commit types trigger different release levels:

- **major**: Breaking changes
- **minor**: New features, non-breaking changes
- **patch**: Bug fixes
- **no-release**: Changes that don't trigger a release

The specific behavior is defined in your project's `atomi_release.yaml` and reflected in `CommitConventions.md`.

## Common Types (Examples)

**Note:** These are common examples. Your project may have different types.

| Type       | Purpose               | Release    |
| ---------- | --------------------- | ---------- |
| `feat`     | New feature           | minor      |
| `fix`      | Bug fix               | patch      |
| `docs`     | Documentation changes | no-release |
| `ci`       | CI configuration      | no-release |
| `refactor` | Code refactoring      | minor      |
| `test`     | Adding/updating tests | minor      |
| `build`    | Build system changes  | no-release |

## Breaking Changes

To indicate a breaking change, add `!` after the type/scope or add `BREAKING CHANGE:` footer:

```
feat(api)!: remove deprecated endpoint

or

feat(api): add new endpoint

BREAKING CHANGE: This changes the API contract
```

## Summary

| Aspect            | Pattern                                      |
| ----------------- | -------------------------------------------- |
| **Format**        | `type(scope): description`                   |
| **Configuration** | `atomi_release.yaml`                         |
| **Reference**     | `docs/developer/CommitConventions.md`        |
| **Release**       | Type-specific (major/minor/patch/no-release) |
| **Breaking**      | Add `!` or `BREAKING CHANGE:` footer         |
