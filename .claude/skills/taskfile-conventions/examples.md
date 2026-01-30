# Taskfile Conventions - Examples

## Example 1: Main Taskfile.yaml

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

  test:
    desc: 'Run all tests (unit + int)'
    cmds:
      - task: test:test

includes:
  test: tasks/test.tasks.yaml
```

## Example 2: Test Sub-Tasks

```yaml
# tasks/test.tasks.yaml
version: '3'

tasks:
  test:
    desc: 'Run all tests (unit + int)'
    cmds:
      - ./scripts/test.sh unit
      - ./scripts/test.sh int

  cover:
    desc: 'Run full coverage (unit:cover + int:cover)'
    cmds:
      - ./scripts/test.sh unit --cover
      - ./scripts/test.sh int --cover

  unit:
    desc: 'Run unit tests only'
    cmds:
      - ./scripts/test.sh unit

  int:
    desc: 'Run integration tests only'
    cmds:
      - ./scripts/test.sh int

  unit:watch:
    desc: 'Run unit tests in watch mode'
    cmds:
      - ./scripts/test.sh unit --watch

  int:watch:
    desc: 'Run integration tests in watch mode'
    cmds:
      - ./scripts/test.sh int --watch

  unit:cover:
    desc: 'Run unit tests with coverage'
    cmds:
      - ./scripts/test.sh unit --cover

  int:cover:
    desc: 'Run integration tests with coverage'
    cmds:
      - ./scripts/test.sh int --cover
```

## Example 3: Task with Arguments

```yaml
version: '3'

tasks:
  dev:
    desc: 'Run CLI in development mode'
    cmds:
      - echo "🚀 Running CLI in development mode..."
      - bun run src/cli.ts {{.ARGS}}
# Usage:
# pls dev
# pls dev hello --verbose
# pls dev --help
```

## Example 4: Task Dependencies

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
      - echo "🔍 Running linters..."
      - pre-commit run --all
      - echo "✅ Done!"

  test:
    desc: 'Run tests'
    cmds:
      - echo "🧪 Running tests..."
      - bun test
      - echo "✅ Done!"

  build:
    desc: 'Build project'
    cmds:
      - echo "🔨 Building..."
      - bun run build
      - echo "✅ Done!"
```

## Example 5: Environment Variables

```yaml
version: '3'

tasks:
  build:prod:
    desc: 'Build for production'
    cmds:
      - echo "🔨 Building for production..."
      - bun run build
    env:
      NODE_ENV: production

  build:dev:
    desc: 'Build for development'
    cmds:
      - echo "🔨 Building for development..."
      - bun run build
    env:
      NODE_ENV: development
```

## Example 6: Conditional Tasks

```yaml
version: '3'

tasks:
  test:
    desc: 'Run tests based on OS'
    cmds:
      - {{if eq .OS "linux"}}echo "Running on Linux"{{end}}
      - {{if eq .OS "darwin"}}echo "Running on macOS"{{end}}
      - {{if eq .OS "windows"}}echo "Running on Windows"{{end}}
      - bun test
```

## Example 7: Task Variables

```yaml
version: '3'

tasks:
  default:
    desc: 'Run with default args if none provided'
    cmds:
      - echo "Running with: {{.ARGS}}"
      - bun test {{.ARGS}}

# Usage:
# pls                 # Runs: bun test
# pls test/unit       # Runs: bun test test/unit
# pls -- --coverage   # Runs: bun test --coverage
```

## Example 8: Aliases

```yaml
version: '3'

tasks:
  t:
    desc: 'Alias for test'
    cmds:
      - task: test:run

  b:
    desc: 'Alias for build'
    cmds:
      - task: build:run

  l:
    desc: 'Alias for lint'
    cmds:
      - task: lint:run
```

## Example 9: Release Sub-Tasks

```yaml
# tasks/release.tasks.yaml
version: '3'

tasks:
  patch:
    desc: 'Release patch version'
    cmds:
      - ./scripts/release.sh patch

  minor:
    desc: 'Release minor version'
    cmds:
      - ./scripts/release.sh minor

  major:
    desc: 'Release major version'
    cmds:
      - ./scripts/release.sh major
```

## Example 10: Complete Taskfile with Includes

```yaml
# Taskfile.yaml
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

  test:
    desc: 'Run all tests (unit + int)'
    cmds:
      - task: test:test

includes:
  test: tasks/test.tasks.yaml
  release: tasks/release.tasks.yaml
# Usage:
# pls setup
# pls dev
# pls build
# pls clean
# pls lint
# pls test
# pls test:unit:cover
# pls release:patch
```

## Example 11: Shell Script Integration

```yaml
# Taskfile.yaml
version: '3'

tasks:
  # Simple - inline
  setup:
    desc: 'Install dependencies'
    cmds:
      - echo "⬇️ Installing Dependencies..."
      - bun install
      - echo "✅ Done!"

  # Complex - shell script
  test:
    desc: 'Run tests with coverage'
    cmds:
      - ./scripts/test.sh {{.ARGS}}

includes:
  test: tasks/test.tasks.yaml
```

```bash
# scripts/test.sh
#!/usr/bin/env bash
set -eou pipefail

TEST_TYPE="${1:-unit}"
shift || true

case "$TEST_TYPE" in
unit)
  echo "🧪 Running unit tests..."
  ;;
int)
  echo "🧪 Running integration tests..."
  ;;
*)
  echo "❌ Unknown test type: $TEST_TYPE"
  exit 1
  ;;
esac

TEST_DIR="test/$TEST_TYPE"
CONFIG="bun.config.$TEST_TYPE.ts"

bun test --config "$CONFIG" "$TEST_DIR" "$@"
echo "✅ Done!"
```
