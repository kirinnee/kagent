---
name: taskfile-conventions
description: Taskfile conventions (balance direct commands vs shell scripts, sub-task imports). Use when creating or modifying Taskfile.yaml and sub-task files in tasks/.
---

# Taskfile Conventions

## Overview

This project uses the `pls` task runner (the `task` binary, aliased as `pls`) with specific conventions for organizing tasks. Balance simple commands directly in Taskfile with complex logic in shell scripts.

**Important**: Taskfiles should NOT include echo statements. The task runner automatically displays the task being executed and its commands, making echo redundant. Only shell scripts should have echo statements for progress feedback.

## When to Use

- Creating or modifying `Taskfile.yaml`
- Creating sub-task files in `tasks/`
- Adding new task commands
- Organizing complex workflows

## Instructions

### Step 1: Balance Taskfile vs Shell Scripts

**Direct in Taskfile (no script needed)**

- `setup` - Install dependencies (1-2 lines)
- `build` - Build project (1-2 lines)
- `lint` - Run pre-commit (1-2 lines)
- `clean` - Clean artifacts (1-2 lines)
- `dev` - Run CLI in development (1-2 lines)

**Shell Scripts (complex logic)**

- Tests (with multiple flags and options)
- CI scripts (with artifact uploads, different environments)
- Any command requiring 3+ lines or conditional logic

### Step 2: Main Taskfile.yaml Structure

Simple commands (1-2 lines) should be inlined directly:

```yaml
version: '3'

tasks:
  setup:
    desc: 'Install dependencies'
    cmds:
      - bun install

  dev:
    desc: 'Run CLI in development mode'
    cmds:
      - bun run src/cli.ts {{.ARGS}}

  build:
    desc: 'Build standalone binary'
    cmds:
      - bun build --compile --outfile dist/kagent src/cli.ts

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

### Step 3: Simple Command Pattern

The simplest approach is to inline commands directly:

```yaml
dev:
  desc: 'Run CLI in development mode'
  cmds:
    - bun run src/cli.ts {{.ARGS}}
```

This is preferred for all 1-2 line commands.

### Step 4: Sub-Task Files

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

### Step 5: Task Naming

- Use lowercase with hyphens for multi-word tasks: `test:cover`
- Use colons to namespace related tasks: `test:unit`, `test:int`
- Aliases are allowed for common shortcuts

### Step 6: Invoking Tasks

- All commands use `pls <command>` (pls is the task binary, aliased from task)
- Users invoke: `pls setup`, `pls test`, `pls test:unit:cover`
- Taskfiles invoke shell scripts: `./scripts/test.sh unit --cover`

## Common Task Patterns

### Simple Command (in Taskfile) - Preferred

```yaml
dev:
  desc: 'Run CLI in development mode'
  cmds:
    - bun run src/cli.ts {{.ARGS}}
```

### Sub-Task Import

```yaml
includes:
  test: tasks/test.tasks.yaml
  release: tasks/release.tasks.yaml
```

## Directory Structure

```
Taskfile.yaml              # Main tasks: setup, dev, build, clean, lint, test
tasks/
├── test.tasks.yaml        # All test variants
└── (future: release.tasks.yaml, docs.tasks.yaml, etc.)
```

## Checklist

- [ ] Taskfiles do NOT include echo statements (task runner shows output)
- [ ] Simple commands (1-2 lines) stay in Taskfile directly
- [ ] Complex logic goes to shell scripts in `scripts/`
- [ ] Related tasks grouped in sub-task files under `tasks/`
- [ ] All tasks use `pls <command>` for invocation
- [ ] Task descriptions are clear and concise
- [ ] Shell scripts follow shell-conventions skill (they DO include echo statements)
