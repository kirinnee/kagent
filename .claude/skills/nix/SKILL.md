---
name: nix
description: Use for ALL Nix flake configuration questions. This includes file structure (flake.nix, nix/, .envrc), adding/removing packages or binaries, PATH configuration, development shells, pre-commit hooks, formatters, linters, enforcers, environment variables, adding registries, and how the Nix template structure works. Use when user asks about nix, flake, packages, binaries, shells, PATH, formatting, linting, git hooks, or registries.
---

# Nix Flake Configuration Skill

This skill provides step-by-step instructions for working with the modular Nix flake architecture using the nix/ folder structure.

## When to Use

- User asks about Nix files (flake.nix, nix/\*.nix, .envrc)
- User wants to add or remove packages or binaries
- User asks about PATH configuration
- User asks about development shells and their purposes
- User asks about formatters, linters, or code quality tools
- User asks about pre-commit hooks or git hooks
- User wants to export environment variables or modify PATH
- User asks how to add a package registry
- User asks "what does this file do?" or "how do I add X?"
- User mentions "nix", "flake", "shell", "package", "binary", "PATH", "formatter", "linter", "hook", "registry"

## Instructions

### Step 1: Reference Documentation

All detailed information is in the Nix documentation:

- **[nix.md](../../../docs/developer/standard/nix.md)** - Complete guide covering:
  - File structure and purposes
  - How to add/remove packages
  - Environment groups and shells
  - Formatters and pre-commit hooks
  - Adding registries
  - PATH and environment variables via .envrc

### Step 2: Quick Reference

| Question             | Answer                                                       |
| -------------------- | ------------------------------------------------------------ |
| Add package?         | Edit `nix/packages.nix` → `nix/env.nix` → `nix flake update` |
| Add binary to PATH?  | Edit `.envrc` → `PATH_add bin` (canonical)                   |
| Export env var?      | Edit `.envrc` → `export VAR=value`                           |
| Add formatter?       | Edit `nix/packages.nix` → `nix/fmt.nix`                      |
| Add pre-commit hook? | Edit `nix/packages.nix` → `nix/pre-commit.nix`               |
| Add registry?        | Edit `flake.nix` inputs → `nix/packages.nix`                 |
| Create shell?        | Edit `nix/shells.nix`                                        |
| Run specific shell?  | `nix develop .#shellname`                                    |

### Step 3: File Structure Overview

```
nix/
├── packages.nix   # Aggregate packages from registries
├── env.nix        # Group packages: system, dev, main, lint, releaser
├── shells.nix     # Define dev environments by composing groups
├── fmt.nix        # Configure formatters via treefmt
└── pre-commit.nix # Configure git hooks

flake.nix          # Main flake - orchestrates everything
.envrc             # Direnv - watches files, loads shell, set PATH/exports
```

**Key flow**: `packages.nix` → `env.nix` → `shells.nix` (aggregate → group → compose)

### Step 4: Adding Packages or Binaries

**To add a package**:

1. Add to registry in `nix/packages.nix`:

```nix
stable = with pkgs-stable; {
  inherit jq;
};
```

2. Add to environment group in `nix/env.nix`:

```nix
dev = [ jq ];  // Only in default shell
```

3. Apply: `nix flake update`

**To add a binary to PATH** (canonical method):
Edit `.envrc`:

```bash
PATH_add bin              # Add relative path (e.g., ./bin)
PATH_add /custom/bin/path  # Add absolute path
```

### Step 5: Adding a Registry

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

### Step 6: Environment Variables and PATH

**Preferred: Use `.envrc`** (loaded by direnv):

```bash
# .envrc
watch_file "./nix/*.nix" "./flake.nix"
use flake

# Add to PATH (canonical way - prevents accidentally replacing PATH)
PATH_add bin                        # Add ./bin to PATH
PATH_add ${packages.my-tool}/bin    # Add package binary to PATH
PATH_add /custom/path               # Add absolute path to PATH

# Export environment variables
export NODE_ENV=development
export API_KEY=secret
export PROJECT_DIR=$(pwd)
```

**Alternative: In `nix/shells.nix`** (for shell-specific vars):

```nix
{
  default = pkgs.mkShell {
    buildInputs = system ++ main ++ lint ++ dev;
    shellHook = ''
      ${checks.pre-commit-check.shellHook}
      export NODE_ENV=development
    '';
  };
}
```

### Step 7: Common Operations

| Action         | Files                        | Commands             |
| -------------- | ---------------------------- | -------------------- |
| Add package    | packages.nix, env.nix        | `nix flake update`   |
| Add to PATH    | .envrc                       | `direnv reload`      |
| Export env var | .envrc                       | `direnv reload`      |
| Add registry   | flake.nix, packages.nix      | `nix flake update`   |
| Add formatter  | packages.nix, fmt.nix        | `nix flake update`   |
| Add hook       | packages.nix, pre-commit.nix | `nix flake update`   |
| Create shell   | shells.nix                   | `nix develop .#name` |

## Reference

See **[nix.md](../../../docs/developer/standard/nix.md)** for complete documentation.
