# Kagent - Bun CLI Framework with OOP Architecture

## Project Overview

Kagent is a CLI framework built with Bun and Commander.js, following strict OOP architecture principles. All code uses stateless methods with dependency injection, separating pure code (lib) from impure operations (adapters).

## Core Principles

### Stateless OOP with DI

- **Stateless Methods**: All methods must be stateless - no mutable instance state
- **Dependency Injection**: Pass dependencies via constructors only
- **Structures vs Objects**:
  - Structures = pure data, no methods (in `src/lib/structures.ts`)
  - Objects = have methods, receive dependencies via DI, take structures as params

### pls Task Runner

- All commands use `pls <command>` (pls is the task binary)
- Task definitions live in `Taskfile.yaml`, not `pls.yaml`
- See `Taskfile.yaml` for available commands

### Nix Controls Everything

- All binaries and dependencies managed via Nix
- No npm-installed CLI tools (use Nix packages)
- `pls lint` calls `pre-commit run --all`
- The flake exports the built CLI binary as `packages.kagent`

## Project Structure

```
src/
├── cli.ts              # CLI entry point using Commander.js
├── lib/                # Pure code: structures, interfaces, classes
│   ├── structures.ts   # Pure data structures
│   ├── interfaces.ts   # Interfaces for impure dependencies
│   ├── services.ts     # Stateless service classes
│   └── index.ts        # Library exports
└── adapters/           # Impure/stateful operations
    ├── console.adapter.ts
    ├── filesystem.adapter.ts
    ├── environment.adapter.ts
    ├── process.adapter.ts
    └── index.ts

test/
├── unit/               # Unit tests for lib/ only (fast, pure)
└── int/                # Integration tests (end-to-end)

scripts/                # Shell scripts for common tasks
```

## Testing Strategy

### Unit Tests (`test/unit/`)

- Test only `src/lib/` code (pure, fast)
- Mock all dependencies (adapters)
- Target: 100% coverage of `src/lib/`
- Run with: `bun test test/unit/` or `pls test`

### Integration Tests (`test/int/`)

- End-to-end tests with real dependencies
- Target: 80%+ overall coverage
- Run with: `bun test test/int/` or `pls test:int`

### Test Format: Arrange-Act-Assert

All tests follow this exact format:

```typescript
describe("Service", () => {
  it("should do something", () => {
    // Arrange - object construction, `subject` setup, `input`s, `expected`
    const subject = new Service(mockDep);
    const input = { ... };
    const expected = { ... };

    // Act - perform action => actual = subject.method(input)
    const actual = subject.method(input);

    // Assert - actual.should.deep.equal(expected)
    actual.should.deep.equal(expected);
  });
});
```

## Shell Script Conventions

All shell scripts in `scripts/` follow these rules:

- Use bash shebang: `#!/usr/bin/env bash`
- Enable strict mode: `set -eou pipefail`
- POSIX-compatible as much as possible
- Emoji-prefixed echo statements before/after each task
- Linear and procedural (avoid functions)
- No coloring (keep simple)

Example:

```bash
#!/usr/bin/env bash
set -eou pipefail

echo "⬇️ Installing Dependencies..."
bun install
echo "✅ Done!"
```

## Available Commands

```bash
# Setup
pls setup          # Install dependencies

# Development
pls dev            # Run CLI in development mode
pls run            # Alias for dev

# Building
pls build          # Build standalone binary in dist/

# Linting
pls lint           # Run pre-commit hooks (includes typecheck)

# Testing
pls test           # Run all tests (unit + int)
pls test:unit      # Run unit tests only
pls test:int       # Run integration tests only
pls test:cover     # Run all tests with coverage
pls test:unit:cover  # Run unit tests with coverage
pls test:int:cover  # Run integration tests with coverage
pls test:unit:watch  # Run unit tests in watch mode
pls test:int:watch  # Run integration tests in watch mode

# Cleaning
pls clean          # Remove build artifacts and dependencies
```

## Coverage Reports

Two separate coverage reports are generated:

1. **Unit Coverage** (`src/lib/` only) - Target 100%
2. **Integration Coverage** (all src) - Target 80%+

CI generates both reports separately.

## Task Completion

**`pls lint` must pass for any task to be considered complete.**

No task is done until pre-commit hooks pass. This ensures:

- Code is formatted correctly
- Linting passes
- No secrets are committed
- Shell scripts are valid
- All other quality checks pass

### Dead Code Check (Required for ALL tasks)

After completing any task that modifies `src/`, run:

```bash
pls deadcode
```

For each finding:

1. **Verify** using TypeScript LSP ("Find All References") or grep (`rg "\.methodName\s*\(" src/`)
2. **Trace call chain** from `src/cli.ts` entry point
3. **Decide**:
   - No calls in `src/` → DEAD (remove it)
   - Only called by tests → DEAD (remove it + tests)
   - Called by live `src/` code → FALSE POSITIVE (document call chain)

**Document in evidence:**

```
## methodName (ServiceName) - path/to/file.ts:123
Verification: grep "\.methodName\s*\(" src/
Call chain: cli.ts → command() → service.methodName()
Verdict: FALSE POSITIVE - called from CLI
```

Remove all confirmed dead code before marking task complete.
