---
name: shell-conventions
description: Shell script conventions (bash, emojis, linear). Use when writing or modifying shell scripts in scripts/.
---

# Shell Script Conventions

## Overview

Shell scripts in this project follow strict conventions for consistency, safety, and simplicity.

## When to Use

- Writing new shell scripts in `scripts/`
- Modifying existing shell scripts
- Reviewing shell script code

## Instructions

### Step 1: Use Required Header

All scripts must start with:

```bash
#!/usr/bin/env bash
set -eou pipefail
```

- `#!/usr/bin/env bash` - Use bash via env for portability
- `set -e` - Exit on error
- `set -o` - Error on undefined variables
- `set -u` - Same as -o (undefined variables)
- `set -pipefail` - Catch errors in pipes

### Step 2: Follow Style Guidelines

**Linear and Procedural**

- Avoid functions - keep scripts linear and readable
- Execute commands sequentially
- Use comments for section separation

**POSIX-Compatible**

- Prefer POSIX-compliant syntax over bash-specific features
- Use `$(command)` for command substitution, not backticks
- Use `[[ ]]` for tests, not `[ ]`

**No Coloring**

- Keep output simple and readable
- Avoid ANSI color codes

**Emoji-Prefixed Echo Statements**

- Use emoji prefixes before/after each major task
- Format: `echo "⚙️ Doing something..."`
- Follow with: `echo "✅ Done!"`

## Template

```bash
#!/usr/bin/env bash
set -eou pipefail

echo "⚙️ Setting up..."
bun install

echo "🔨 Building..."
bun run build

echo "✅ Done!"
```

## Common Emojis

| Purpose       | Emoji |
| ------------- | ----- |
| Setup/Install | ⬇️    |
| Building      | 🔨    |
| Testing       | 🧪    |
| Linting       | 🔍    |
| Cleaning      | 🧹    |
| Running       | ▶️    |
| Done/Success  | ✅    |
| Warning/Info  | ℹ️    |
| Error         | ❌    |

## File Location

All shell scripts live in `scripts/` at the project root and are invoked via `pls <command>` defined in `Taskfile.yaml`.
