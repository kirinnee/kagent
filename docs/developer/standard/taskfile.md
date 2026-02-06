---
id: taskfile
title: Taskfile Conventions
---

# Taskfile Conventions

This document describes the conventions for Taskfile usage in the workspace template.

## Overview

This project uses the `pls` task runner (the `task` binary, aliased as `pls`) with specific conventions for organizing tasks.

**Important**: Taskfiles should NOT include echo statements. The task runner automatically displays the task being executed and its commands, making echo redundant. Only shell scripts should have echo statements for progress feedback.

## Core Principle: Balance Simplicity vs Complexity

- **Simple (1-2 lines)** → inline in Taskfile
- **Complex (3+ lines, conditionals)** → shell script

## Key Rules

1. Use `pls` alias (task binary)
2. NO echo in Taskfile (task runner shows output)
3. Shell scripts DO have echo (for progress)
4. Sub-tasks in `tasks/` directory

## Main Taskfile.yaml Structure

Simple commands (1-2 lines) should be inlined directly:

```yaml
version: '3'

tasks:
  setup:
    desc: 'Install dependencies'
    cmds:
      - bun install

  dev:
    desc: 'Run in development mode'
    cmds:
      - bun run src/cli.ts {{.ARGS}}

  build:
    desc: 'Build project'
    cmds:
      - bun run build

  clean:
    desc: 'Clean build artifacts and dependencies'
    cmds:
      - rm -rf dist node_modules coverage

  lint:
    desc: 'Run pre-commit hooks'
    cmds:
      - pre-commit run --all

includes:
  test: tasks/test.tasks.yaml
```

## Simple Command Pattern

The simplest approach is to inline commands directly:

```yaml
dev:
  desc: 'Run in development mode'
  cmds:
    - bun run src/cli.ts {{.ARGS}}
```

This is preferred for all 1-2 line commands.

## Sub-Task Files

Import complex workflows from `tasks/` directory:

```yaml
# tasks/test.tasks.yaml
version: '3'

tasks:
  unit:
    desc: 'Run unit tests only'
    cmds:
      - ./scripts/test.sh unit

  int:
    desc: 'Run integration tests only'
    cmds:
      - ./scripts/test.sh int

  cover:
    desc: 'Run tests with coverage'
    cmds:
      - ./scripts/test.sh unit --cover
      - ./scripts/test.sh int --cover
```

## Task Naming

- Use lowercase with hyphens for multi-word tasks: `test:cover`
- Use colons to namespace related tasks: `test:unit`, `test:int`
- Aliases are allowed for common shortcuts

## Invoking Tasks

- All commands use `pls <command>` (pls is the task binary, aliased from task)
- Users invoke: `pls setup`, `pls test`, `pls test:unit:cover`
- Taskfiles invoke shell scripts: `./scripts/test.sh unit --cover`

## Directory Structure

```
Taskfile.yaml              # Main tasks: setup, dev, build, clean, lint, test
tasks/
├── test.tasks.yaml        # All test variants
└── (future: release.tasks.yaml, docs.tasks.yaml, etc.)
```

## Summary

| Aspect              | Pattern                                |
| ------------------- | -------------------------------------- |
| **Task runner**     | `pls` (aliased from `task`)            |
| **Inline**          | 1-2 line commands directly in Taskfile |
| **Shell script**    | 3+ lines or conditional logic          |
| **Echo statements** | NO in Taskfile, YES in shell scripts   |
| **Sub-tasks**       | Organized in `tasks/` directory        |
| **Namespace**       | Use colons (`test:unit`, `test:int`)   |
