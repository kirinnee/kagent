# Nix Flake Configuration Guide

Complete guide to Nix flake-based projects using the modular nix/ folder structure. This document explains the architecture, how to modify configurations, and common operations.

## Overview

This Nix configuration uses a **modular flake architecture** with separate files for each concern. The structure separates package management, environment grouping, shell composition, formatting, and git hooks into distinct, focused modules.

## Quick Reference

```
nix/
├── packages.nix   # Aggregate packages from registries
├── env.nix        # Group packages by purpose
├── shells.nix     # Define dev environments
├── fmt.nix        # Configure formatters
└── pre-commit.nix # Configure git hooks

flake.nix          # Main flake (orchestrator)
.envrc             # Direnv (auto-load shell, PATH, env vars)
```

## File Structure

### flake.nix - The Orchestrator

**Purpose**: Central coordinator that defines inputs (package registries) and exports outputs (packages, shells, checks).

**Key Concepts**:

- **Inputs**: Where packages come from (nixpkgs stable, unstable, custom registries)
- **Outputs**: What gets exported (packages, devShells, formatter, checks)
- **Wiring**: Connects all the nix/ modules together

### nix/packages.nix - Package Registry

**Purpose**: Combine packages from multiple registries into one unified namespace.

**Typical Registries**:

| Registry               | Purpose                     |
| ---------------------- | --------------------------- |
| nixpkgs/nixos-XX.XX    | Stable release              |
| nixpkgs/nixos-unstable | Latest packages             |
| Custom registries      | Organization-specific tools |

### nix/env.nix - Environment Groups

**Purpose**: Organize packages into functional groups so different shells can include only what they need.

**Common Groups**:

| Group      | Purpose              | Included In Shells |
| ---------- | -------------------- | ------------------ |
| `system`   | Core utilities       | All shells         |
| `dev`      | Development tools    | default only       |
| `main`     | Runtime dependencies | All shells         |
| `lint`     | Code quality tools   | All shells         |
| `releaser` | Release management   | releaser only      |

**Why Groups?**

- **CI shell** doesn't need interactive tools (editors, debuggers)
- **Releaser shell** needs release tools but not full dev suite
- **Default shell** has everything for active development
- Enables flexible shell composition

### nix/shells.nix - Development Environments

**Purpose**: Define development environments by composing environment groups.

**Common Shells**:

| Shell      | Groups                          | Use Case               |
| ---------- | ------------------------------- | ---------------------- |
| `default`  | system + main + lint + dev      | Full local development |
| `ci`       | system + main + lint            | CI/CD pipelines        |
| `releaser` | system + main + lint + releaser | Release management     |
| `minimal`  | system                          | Bare minimum           |

### nix/fmt.nix - Formatters

**Purpose**: Configure multi-language code formatting via treefmt.

**Common Formatters**:

| Formatter   | Language              |
| ----------- | --------------------- |
| nixpkgs-fmt | Nix                   |
| prettier    | JS/TS, JSON, Markdown |
| shfmt       | Shell scripts         |
| actionlint  | GitHub Actions        |
| black       | Python                |
| rustfmt     | Rust                  |

### nix/pre-commit.nix - Git Hooks

**Purpose**: Configure git pre-commit hooks for code quality and security.

**Hook Types**:

| Type      | Purpose             | Example                   |
| --------- | ------------------- | ------------------------- |
| Formatter | Runs treefmt        | Formats all files         |
| Linter    | Checks file quality | eslint, shellcheck        |
| Enforcer  | Validates policies  | File permissions, secrets |

### .envrc - Direnv (PATH and Environment Variables)

**Purpose**: Automatically load the development shell, set PATH, and export environment variables.

**Preferred for**: PATH modifications and environment variables (instead of nix/shells.nix)

**Canonical way to add to PATH** - Use `PATH_add` (from direnv-stdlib):

```bash
watch_file "./nix/*.nix" "./flake.nix"
use flake

# Add to PATH (canonical - prevents accidentally replacing PATH)
PATH_add bin                        # Add ./bin to PATH
PATH_add ${packages.my-tool}/bin    # Add package binary to PATH
PATH_add /custom/path               # Add absolute path to PATH

# Export environment variables
export NODE_ENV=development
export API_KEY=secret
```

**Why `PATH_add` instead of `export PATH=...`?**

- `PATH_add` automatically prepends to PATH (won't accidentally replace entire PATH)
- Built-in direnv function designed for this purpose
- Safer and more idiomatic

**Why .envrc?** - Loaded automatically by direnv, easier to modify than nix files, applies to all operations in the directory.

## Data Flow

```
Registries (nixpkgs, unstable, custom)
           ↓
    packages.nix (aggregate)
           ↓
       env.nix (group)
           ↓
     shells.nix (compose)
           ↓
    flake.nix (export)
```

## Common Operations

### Adding a Package

**Example**: Add `jq` to development environment

```nix
// Step 1: nix/packages.nix - Add to registry
stable = with pkgs-stable; {
  inherit git jq;
};

// Step 2: nix/env.nix - Add to group
dev = [ editor git jq ];

// Step 3: Apply
nix flake update
```

### Removing a Package

```nix
// Step 1: nix/packages.nix - Remove from inherit
// Step 2: nix/env.nix - Remove from group
// Step 3: nix flake update
```

### Adding a Formatter

```nix
// Step 1: nix/packages.nix - Add package
stable = with pkgs-stable; {
  inherit black ruff;
};

// Step 2: nix/fmt.nix - Enable
programs = {
  nixpkgs-fmt.enable = true;
  prettier.enable = true;
  black.enable = true;
  ruff.enable = true;
};
```

### Adding a Pre-commit Hook

```nix
// nix/pre-commit.nix
hooks = {
  my-linter = {
    enable = true;
    name = "My Linter";
    entry = "${packages.my-linter}/bin/my-linter";
    files = ".*ext$";
  };
}
```

### Creating a Custom Shell

```nix
// nix/shells.nix
{
  database = pkgs.mkShell {
    buildInputs = system ++ [ postgres redis ];
    inherit shellHook;
  };
}

// Use: nix develop .#database
```

### Adding a Registry

**Step 1**: Add registry to `flake.nix` inputs:

```nix
inputs = {
  nixpkgs.url = "nixpkgs/nixos-25.11";
  my-registry.url = "github:myorg/nix-registry";
};
```

**Step 2**: Pass to modules in outputs:

```nix
outputs = { self, nixpkgs, my-registry, ... }:
  let
    packages = import ./nix/packages.nix {
      inherit pkgs;
      inherit (my-registry) packages;
    };
```

**Step 3**: Use in `nix/packages.nix`:

```nix
{ pkgs, pkgs-stable, packages }:
let
  all = {
    stable = with pkgs-stable; { inherit git; };
    myOrg = with packages; { inherit tool1 tool2; };
  };
in
with all;
stable // myOrg
```

### Modifying PATH

**Preferred: Use `.envrc` with `PATH_add`** (canonical direnv method):

```bash
# .envrc
watch_file "./nix/*.nix" "./flake.nix"
use flake

# Add to PATH (canonical - safer than export PATH=...)
PATH_add bin                        # Add ./bin to PATH
PATH_add ${packages.my-tool}/bin    # Add package binary to PATH
PATH_add /custom/bin/path           # Add absolute path to PATH
```

Then: `direnv reload`

### Exporting Environment Variables

**Preferred: Use `.envrc`**:

```bash
# .envrc
watch_file "./nix/*.nix" "./flake.nix"
use flake

# Export environment variables
export NODE_ENV=development
export API_KEY=secret
export PROJECT_DIR=$(pwd)
export DATABASE_URL=postgresql://localhost/mydb
```

Then: `direnv reload`

**Alternative: In `nix/shells.nix`** (for shell-specific vars only):

```nix
// nix/shells.nix
{
  default = pkgs.mkShell {
    buildInputs = system ++ main ++ lint ++ dev;
    shellHook = ''
      ${checks.pre-commit-check.shellHook}
      export SHELL_SPECIFIC_VAR=value
    '';
  };
}
```

## Usage Commands

| Action          | Command                        |
| --------------- | ------------------------------ |
| Enter shell     | `nix develop` or `cd` (direnv) |
| Specific shell  | `nix develop .#ci`             |
| Format code     | `treefmt`                      |
| Update packages | `nix flake update`             |
| Search packages | `nix search nixpkgs name`      |
| Show flake info | `nix flake show`               |
| Reload direnv   | `direnv reload`                |

## Environment Groups Explained

Groups determine which shells receive which packages:

| Group      | In These Shells | Contains                              |
| ---------- | --------------- | ------------------------------------- |
| `system`   | all             | Core utilities, always needed         |
| `dev`      | default         | Editors, debuggers, interactive tools |
| `main`     | all             | Runtime dependencies, libraries       |
| `lint`     | all             | Formatters, linters                   |
| `releaser` | releaser        | Release automation tools              |

## Shell Patterns

### Full Development Shell

```nix
default = pkgs.mkShell {
  buildInputs = system ++ main ++ lint ++ dev;
};
```

### CI Shell

```nix
ci = pkgs.mkShell {
  buildInputs = system ++ main ++ lint;
  // No dev group - no interactive tools
};
```

### Minimal Shell

```nix
minimal = pkgs.mkShell {
  buildInputs = system;
  // Just core utilities
};
```

## Registry Examples

### Nixpkgs Stable

```nix
inputs = {
  nixpkgs.url = "nixpkgs/nixos-25.11";
};
```

### Nixpkgs Unstable

```nix
inputs = {
  nixpkgs-unstable.url = "nixpkgs/nixos-unstable";
};
```

### Custom Registry (GitHub)

```nix
inputs = {
  my-org.url = "github:myorg/nix-registry/main";
};
```

### Custom Registry (Specific Commit)

```nix
inputs = {
  my-org.url = "github:myorg/nix-registry/a1b2c3d";
};
```

### Custom Registry (Local Path)

```nix
inputs = {
  local-registry.url = "path:../nix-registry";
};
```

## For Implementation Help

When you need help implementing Nix changes, use the **nix skill** which provides step-by-step instructions and examples.

See also:

- **Skill**: `.claude/skills/nix/SKILL.md` - Step-by-step implementation guide
- **Reference**: `.claude/skills/nix/reference.md` - Complete technical reference
- **Examples**: `.claude/skills/nix/examples.md` - Concrete examples

## Key Concepts

### Modularity

Each file has a single responsibility:

- `packages.nix` = what packages exist
- `env.nix` = how packages are grouped
- `shells.nix` = what shells include which groups
- `fmt.nix` = how files are formatted
- `pre-commit.nix` = what runs before commits
- `.envrc` = PATH and environment variables

### Composability

Shells compose groups, groups contain packages:

```nix
// Define once
env = { dev = [ editor linter ]; };

// Use in multiple shells
default = system ++ main ++ dev;
ci = system ++ main;  // No dev group
```

### Separation of Concerns

- **Package source** (where it comes from) vs **group** (what it's for) vs **shell** (when it's available)
- **Formatter** (how to format) vs **hook** (when to run)
- **Definition** (in nix/) vs **orchestration** (in flake.nix)
- **Environment** (in .envrc) vs **shell inputs** (in shells.nix)
