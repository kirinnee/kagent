---
id: semantic-release
title: Semantic Release
---

# Semantic Release

This document describes the semantic release workflow used in the workspace template.

## Overview

Automated versioning and package publishing using the `sg` (Semantic Generator) tool.

## sg (Semantic Generator)

`sg` is an all-in-one CLI that handles semantic release workflows.

### Features

- Auto-detects `atomi_release.yaml` configuration
- Syncs `.gitlint` with commit types
- Generates `CommitConventions.md`
- Runs semantic-release with ephemeral plugins

### Ephemeral Plugin Installation

**Key Feature:** `sg` installs plugins on-the-fly using the `-i` flag.

```bash
sg release -i npm
```

This means:

- No need to add semantic-release plugins to project dependencies
- Works for any language (Go, .NET, Bun, etc.)
- Plugin versions are managed in `atomi_release.yaml`

## Common sg Commands

### Sync Configuration

Sync `.gitlint` and generate `CommitConventions.md` from `atomi_release.yaml`:

```bash
sg sync
```

### Release

Create a new release:

```bash
sg release -i npm
```

The `-i npm` flag installs npm-based plugins on-the-fly.

## atomi_release.yaml

Configuration file that defines release behavior:

```yaml
gitlint: .gitlint

conventionMarkdown:
  path: docs/developer/CommitConventions.md
  template: |
    ---
    id: commit-conventions
    title: Commit Conventions
    ---
    var___convention_docs___

branches:
  - main

plugins:
  - module: '@semantic-release/changelog'
    version: 6.0.3
    config:
      changelogFile: Changelog.md
  - module: '@semantic-release/git'
    version: 10.0.1
    config:
      message: "release: ${nextRelease.version}\n\n${nextRelease.notes}"
      assets:
        - Changelog.md
        - CommitConventions.md
  - module: '@semantic-release/github'
    version: 10.3.5

types:
  # ... commit type definitions
```

### Plugin Configuration

Plugins are defined with specific versions in `atomi_release.yaml`:

| Plugin                        | Purpose                  |
| ----------------------------- | ------------------------ |
| `@semantic-release/changelog` | Generate Changelog.md    |
| `@semantic-release/git`       | Commit changelog and tag |
| `@semantic-release/github`    | Create GitHub release    |

## Release Workflow

1. **Commit**: Push commits with conventional commit messages
2. **CI Pass**: All CI checks must pass
3. **Merge**: Merge to main branch
4. **Release**: Release workflow runs `sg release -i npm`
5. **Version**: Semantic version is determined by commit types
6. **Changelog**: Changelog.md is updated
7. **Tag**: Git tag is created
8. **GitHub Release**: Release is created on GitHub

## Versioning

Version is determined by commit types since last release:

| Commit Type                      | Release                        |
| -------------------------------- | ------------------------------ |
| `feat` + `breaking: true` or `!` | major (X.0.0)                  |
| `feat`                           | minor (x.Y.0)                  |
| `fix`                            | patch (x.y.Z)                  |
| Others                           | no release (unless configured) |

## Summary

| Aspect              | Pattern                                 |
| ------------------- | --------------------------------------- |
| **Tool**            | `sg` (Semantic Generator)               |
| **Config**          | `atomi_release.yaml`                    |
| **Plugins**         | Ephemeral via `-i npm` flag             |
| **Generated**       | `CommitConventions.md`, `.gitlint` sync |
| **Release command** | `sg release -i npm`                     |
