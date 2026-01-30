# Taskfile Conventions - Reference

## Overview

This project uses the `pls` task runner (the `task` binary, aliased as `pls`) with specific conventions for organizing tasks. Balance simple commands directly in Taskfile with complex logic in shell scripts.

## Taskfile Version

Use Taskfile version 3:

```yaml
version: '3'
```

## When to Inline vs Shell Scripts

### Inline in Taskfile (1-2 lines)

Simple commands that don't need logic:

| Task    | Command                    | Reason         |
| ------- | -------------------------- | -------------- |
| `setup` | `bun install`              | Single command |
| `build` | `bun build --compile ...`  | Single command |
| `clean` | `rm -rf dist node_modules` | Simple rm      |
| `lint`  | `pre-commit run --all`     | Single command |
| `dev`   | `bun run src/cli.ts`       | Single command |

### Use Shell Scripts (complex logic)

Tasks with multiple steps, conditions, or flags:

| Task       | Reason                            |
| ---------- | --------------------------------- |
| Tests      | Multiple flags, different configs |
| CI scripts | Multiple steps, verification      |
| Release    | Complex deployment logic          |

## Main Taskfile.yaml Structure

```yaml
version: '3'

tasks:
  setup:
    desc: 'Install dependencies'
    cmds:
      - echo "⬇️ Installing Dependencies..."
      - bun install
      - echo "✅ Done!"

  dev:
    desc: 'Run CLI in development mode'
    cmds:
      - echo "🚀 Running CLI in development mode..."
      - bun run src/cli.ts {{.ARGS}}

  build:
    desc: 'Build standalone binary'
    cmds:
      - echo "🔨 Building standalone binary..."
      - bun build --compile --outfile dist/kagent src/cli.ts
      - echo "✅ Done!"

  clean:
    desc: 'Clean build artifacts and dependencies'
    cmds:
      - echo "🧹 Cleaning build artifacts and dependencies..."
      - rm -rf dist node_modules coverage
      - echo "✅ Done!"

  lint:
    desc: 'Run pre-commit hooks'
    cmds:
      - echo "🔍 Running pre-commit hooks..."
      - pre-commit run --all
      - echo "✅ Done!"

includes:
  test: tasks/test.tasks.yaml
```

## Sub-Task Files

### tasks/test.tasks.yaml

```yaml
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

  unit:cover:
    desc: 'Run unit tests with coverage'
    cmds:
      - ./scripts/test.sh unit --cover

  int:cover:
    desc: 'Run integration tests with coverage'
    cmds:
      - ./scripts/test.sh int --cover
```

## Task Naming Conventions

- Use lowercase with hyphens for multi-word: `test:cover`
- Use colons to namespace: `test:unit`, `test:int`
- Aliases allowed for shortcuts

## Special Variables

| Variable        | Description                                 |
| --------------- | ------------------------------------------- |
| `{{.ARGS}}`     | Pass additional arguments from command line |
| `{{.TASK}}`     | Current task name                           |
| `{{.CLI_ARGS}}` | All remaining arguments after `--`          |

## Invoking Tasks

### From Command Line

```bash
# User invokes with pls
pls setup
pls build
pls test:unit:cover

# With arguments
pls dev hello --verbose
```

### From Taskfile

```yaml
# Taskfile invokes shell scripts directly
- ./scripts/test.sh unit --cover

# Or calls other tasks
- task: test:unit
```

## Directory Structure

```
Taskfile.yaml              # Main tasks: setup, dev, build, clean, lint, test
tasks/
├── test.tasks.yaml        # All test variants
└── (future: release.tasks.yaml, docs.tasks.yaml, etc.)

scripts/                   # Complex shell scripts
├── test.sh
└── ci/
    ├── build.sh
    ├── test-unit.sh
    └── test-int.sh
```

## Task Dependencies

### Calling Other Tasks

```yaml
version: '3'

tasks:
  all:
    desc: 'Run lint, test, and build'
    cmds:
      - task: lint
      - task: test
      - task: build

  lint:
    desc: 'Run linters'
    cmds:
      - pre-commit run --all

  test:
    desc: 'Run tests'
    cmds:
      - bun test

  build:
    desc: 'Build project'
    cmds:
      - bun run build
```

### Task Variables

```yaml
version: '3'

tasks:
  default:
    desc: 'Run with default args'
    cmds:
      - echo "Running with {{.DEFAULT_ARGS}}"
    vars:
      DEFAULT_ARGS: '{{.ARGS | default "--default"}}'
```

## Task Aliases

```yaml
version: '3'

tasks:
  t:
    desc: 'Alias for test'
    cmds:
      - task: test

  b:
    desc: 'Alias for build'
    cmds:
      - task: build
```

## Conditional Tasks

```yaml
version: '3'

tasks:
  test:
    desc: 'Run tests'
    cmds:
      - {{if eq .OS "linux"}}echo "Linux"{{else}}echo "Not Linux"{{end}}
      - bun test
```

## Environment Variables

```yaml
version: '3'

tasks:
  build:
    desc: 'Build with NODE_ENV=production'
    cmds:
      - bun run build
    env:
      NODE_ENV: production
```

## Task Summary

```bash
$ pls --list
Task                Description
─────────────────────────────────────────────────────
setup               Install dependencies
dev                 Run CLI in development mode
build               Build standalone binary
clean               Clean build artifacts and dependencies
lint                Run pre-commit hooks

test:unit           Run unit tests only
test:int            Run integration tests only
test:unit:cover     Run unit tests with coverage
test:int:cover      Run integration tests with coverage
```

## Best Practices

1. **Simple tasks inline** - 1-2 line commands go in Taskfile
2. **Complex logic in scripts** - Use shell scripts for 3+ lines
3. **Emoji output** - Add echo statements before/after commands
4. **Clear descriptions** - Every task needs a desc
5. **Namespace related tasks** - Use `:` for grouping
6. **Pass args via shell scripts** - Don't use Taskfile vars for script args
