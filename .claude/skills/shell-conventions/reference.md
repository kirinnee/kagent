# Shell Script Conventions - Reference

## Bash Strict Mode

### Required Header

All scripts must start with:

```bash
#!/usr/bin/env bash
set -eou pipefail
```

### Explanation

| Option                | Meaning                                                                                     |
| --------------------- | ------------------------------------------------------------------------------------------- |
| `#!/usr/bin/env bash` | Use bash from PATH (more portable than `/bin/bash`)                                         |
| `set -e`              | Exit immediately if a command exits with a non-zero status                                  |
| `set -o`              | Treat unset variables as an error when substituting                                         |
| `set -u`              | Same as `-o` (POSIX: error on undefined variables)                                          |
| `set -o pipefail`     | Return value of a pipeline is the status of the last command to exit with a non-zero status |

### Why This Matters

```bash
# Without strict mode - dangerous!
rm -rf $MY_DIR/dist  # If MY_DIR is empty, deletes /dist!

# With strict mode - safe!
set -u
rm -rf $MY_DIR/dist  # Error: MY_DIR: unbound variable
```

## POSIX Compatibility

### Prefer POSIX Over Bashisms

```bash
# ✅ POSIX compatible
var=$(command)
if [[ -f "$file" ]]; then

# ❌ Bash-specific (avoid when possible)
var=`command`
if [ -f "$file" ]; then
```

### Command Substitution

```bash
# ✅ Use $(command)
files=$(ls *.txt)

# ❌ Avoid backticks
files=`ls *.txt`
```

### Test Conditions

```bash
# ✅ Use [[ ]] for tests
if [[ -f "$file" ]]; then
if [[ $# -gt 0 ]]; then

# ❌ Avoid [ ] unless required by POSIX
if [ -f "$file" ]; then
```

## Linear and Procedural Style

### Avoid Functions

```bash
# ❌ BAD - Functions make scripts harder to follow
#!/usr/bin/env bash
set -eou pipefail

install_deps() {
  bun install
}

build() {
  bun run build
}

install_deps
build

# ✅ GOOD - Linear and readable
#!/usr/bin/env bash
set -eou pipefail

echo "⬇️ Installing Dependencies..."
bun install
echo "✅ Done!"

echo "🔨 Building..."
bun run build
echo "✅ Done!"
```

### When Functions Are Acceptable

Only use functions for:

- Repeated code blocks (3+ uses)
- Complex error handling that needs isolation
- Library-style scripts (not executable scripts)

## Echo Statements

### Emoji Prefix Convention

```bash
# Standard format: emoji + action + ellipsis
echo "⬇️ Installing Dependencies..."
echo "🔨 Building..."
echo "🧪 Running tests..."
echo "🧹 Cleaning..."
echo "🔍 Linting..."
echo "✅ Done!"
echo "❌ Error!"
```

### Emoji Reference

| Category | Emoji | Usage                            |
| -------- | ----- | -------------------------------- |
| Setup    | ⬇️    | Installing, downloading, cloning |
| Build    | 🔨    | Compiling, bundling, building    |
| Test     | 🧪    | Running tests, checking          |
| Clean    | 🧹    | Removing files, cleaning         |
| Lint     | 🔍    | Checking, validating, verifying  |
| Run      | ▶️    | Starting, launching, executing   |
| Deploy   | 🚀    | Deploying, publishing, releasing |
| Done     | ✅    | Completion message               |
| Error    | ❌    | Errors, failures                 |
| Info     | ℹ️    | Informational messages           |
| Warning  | ⚠️    | Warnings, cautions               |

### Pattern

```bash
echo "⚙️ Action in progress..."
command args
echo "✅ Done!"
```

## No Coloring

```bash
# ❌ BAD - No ANSI colors
echo "\033[0;32mSuccess!\033[0m"

# ✅ GOOD - Plain text with emojis
echo "✅ Success!"
```

Keep output simple and readable. Color adds complexity and isn't portable.

## Error Handling

### Check Required Commands

```bash
# Check if a command exists
if ! command -v bun &> /dev/null; then
  echo "❌ bun is required but not installed"
  exit 1
fi
```

### Check Required Files

```bash
# Check if a file exists
if [[ ! -f "$CONFIG_FILE" ]]; then
  echo "❌ Config file not found: $CONFIG_FILE"
  exit 1
fi
```

### Handle Cleanup on Exit

```bash
# Cleanup function
cleanup() {
  rm -rf /tmp/temp-file
}

# Trap exit signals
trap cleanup EXIT
```

## Variable Handling

### Always Quote Variables

```bash
# ✅ GOOD - Quoted
rm -rf "$DIR"

# ❌ BAD - Unquoted (breaks on spaces)
rm -rf $DIR
```

### Use Uppercase for Constants

```bash
# Constants
readonly PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly BUILD_DIR="$PROJECT_ROOT/dist"

# Variables
test_type="${1:-unit}"
```

### Default Values

```bash
# Use ${VAR:-default} for defaults
TEST_TYPE="${1:-unit}"

# Use ${VAR:+default} for "if set"
EXTRA_FLAGS="${VERBOSE:+--verbose}"
```

## File Operations

### Create Directory If Not Exists

```bash
# Create parent directories as needed
mkdir -p "$BUILD_DIR"
```

### Remove Files Safely

```bash
# Always quote to avoid accidental deletions
rm -rf "$BUILD_DIR"

# Check before removing important files
if [[ -d "$BUILD_DIR" ]]; then
  echo "🧹 Removing $BUILD_DIR..."
  rm -rf "$BUILD_DIR"
fi
```

## Loops and Iteration

### Iterate Over Files

```bash
# ✅ POSIX compatible
for file in *.txt; do
  echo "Processing: $file"
done

# ✅ Find with xargs
find . -name "*.tmp" | xargs rm
```

## Conditional Logic

### If-Else

```bash
if [[ "$TEST_TYPE" == "unit" ]]; then
  echo "🧪 Running unit tests..."
  bun test test/unit
elif [[ "$TEST_TYPE" == "int" ]]; then
  echo "🧪 Running integration tests..."
  bun test test/int
else
  echo "❌ Unknown test type: $TEST_TYPE"
  exit 1
fi
```

### Case Statements

```bash
case "$TEST_TYPE" in
  unit)
    echo "🧪 Running unit tests..."
    TEST_DIR="test/unit"
    ;;
  int)
    echo "🧪 Running integration tests..."
    TEST_DIR="test/int"
    ;;
  *)
    echo "❌ Unknown test type: $TEST_TYPE"
    exit 1
    ;;
esac
```

## Argument Parsing

### Positional Arguments

```bash
# First argument with default
TEST_TYPE="${1:-unit}"

# Second argument with default
OUTPUT_DIR="${2:-./output}"

# Shift to process remaining args
shift || true
remaining_args="$@"
```

### Flag Parsing

```bash
# Simple flag parsing
COVER=false
WATCH=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --cover)
      COVER=true
      shift
      ;;
    --watch)
      WATCH=true
      shift
      ;;
    *)
      echo "❌ Unknown flag: $1"
      exit 1
      ;;
  esac
done
```

## Exit Codes

### Standard Exit Codes

| Code | Meaning                        |
| ---- | ------------------------------ |
| 0    | Success                        |
| 1    | General error                  |
| 2    | Misuse of shell command        |
| 126  | Command invoked cannot execute |
| 127  | Command not found              |
| 128  | Invalid exit argument          |
| 130  | Ctrl+C interrupt               |
| 255  | Exit status out of range       |

### Explicit Exit

```bash
# Explicit success
exit 0

# Explicit error
echo "❌ Build failed"
exit 1
```

With `set -e`, scripts auto-exit on error, but explicit exits make intent clear.

## Script Template

```bash
#!/usr/bin/env bash
set -eou pipefail

# Description of what this script does

echo "⚙️ Step 1..."
command_1
echo "✅ Done!"

echo "⚙️ Step 2..."
command_2
echo "✅ Done!"
```
