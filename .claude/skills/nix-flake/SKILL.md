---
name: nix-flake
description: Nix flake structure (packages, env, shells, pre-commit, fmt). Use when setting up or modifying Nix flakes.
---

# Nix Flake Structure

## Overview

Nix flake structure for consistent development environments, package builds, and CI/CD integration.

## When to Use

- Setting up new Nix flakes
- Adding packages to the flake
- Configuring development shells
- Setting up pre-commit hooks or formatters

## Instructions

### Step 1: Understand the Flake Structure

A typical Nix flake has these files:

```
flake.nix              # Main flake with inputs and outputs
nix/
├── packages.nix       # Package definitions (CLI binary via stdenv.mkDerivation)
├── env.nix            # Environment package groups (system, dev, main, lint, releaser)
├── shells.nix         # Shell definitions (default, ci, releaser)
├── pre-commit.nix     # Pre-commit hooks configuration
└── fmt.nix            # Formatter configuration using treefmt-nix
```

### Step 2: Configure Packages

The `packages` output uses the project name (e.g., `packages.kagent`):

```nix
# In nix/packages.nix
{
  kagent = pkgs.stdenv.mkDerivation {
    pname = "kagent";
    version = "0.1.0";
    src = ./.;
    buildPhase = ''
      bun build ./src/cli.ts --outfile ./dist/kagent
    '';
    installPhase = ''
      mkdir -p $out/bin
      cp ./dist/kagent $out/bin/kagent
      chmod +x $out/bin/kagent
    '';
  };
}
```

### Step 3: Define Shell Environments

```nix
# In nix/shells.nix
{
  default = mkShell { ... };  # Full dev shell
  ci = mkShell { ... };       # CI shell (minimal)
  releaser = mkShell { ... }; # Release shell
}
```

### Step 4: Shell Usage

```bash
nix develop              # Enter default shell
nix develop .#ci         # Enter CI shell
nix build .#kagent       # Build the CLI package
```

## Environment Package Groups

In `nix/env.nix`:

- **system**: Base system packages (git, bash, etc.)
- **dev**: Development tools (bun, nodejs, etc.)
- **main**: Runtime dependencies
- **lint**: Linting tools (pre-commit, treefmt, etc.)
- **releaser**: Release tools

## CI Integration

All CI scripts run within Nix shell:

```bash
nix develop .#ci -c ./scripts/ci/script.sh
```

## Checklist

- [ ] `flake.nix` imports from `nix/` directory
- [ ] `packages.{PROJECT_NAME}` exports the built CLI
- [ ] `env.nix` defines package groups
- [ ] `shells.nix` defines default, ci, releaser shells
- [ ] `pre-commit.nix` configured for hooks
- [ ] `fmt.nix` configured for treefmt
- [ ] All binaries managed via Nix (no npm-installed CLI tools)
