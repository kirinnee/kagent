# Nix Flake Structure - Reference

## Flake Architecture

A Nix flake provides reproducible development environments and package builds. The flake.nix file imports modular files from the nix/ directory.

## Directory Structure

```
flake.nix              # Main entry point, imports nix/ files
nix/
├── packages.nix       # Package definitions (e.g., CLI binary)
├── env.nix            # Environment package groups
├── shells.nix         # Shell definitions (default, ci, releaser)
├── pre-commit.nix     # Pre-commit hooks configuration
└── fmt.nix            # Formatter configuration (treefmt-nix)
```

## flake.nix

The main flake file imports and exports everything:

```nix
{
  description = "Project description";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
    treefmt-nix.url = "github:numtide/treefmt-nix";
  };

  outputs = { self, nixpkgs, flake-utils, treefmt-nix }:
    flake-utils.lib.eachDefaultSystemMap (system:
      let
        pkgs = import nixpkgs { inherit system; };
        inherit (import ./nix/packages.nix { inherit pkgs; }) packages;
        inherit (import ./nix/env.nix { inherit pkgs; }) env;
        inherit (import ./nix/shells.nix {
          inherit pkgs env packages treefmt-nix;
        }) shells;
        inherit (import ./nix/pre-commit.nix { inherit pkgs; }) pre-commit;
        inherit (import ./nix/fmt.nix {
          inherit pkgs treefmt-nix;
        }) fmt;
      in {
        inherit packages fmt;

        devShells = {
          default = shells.default;
          ci = shells.ci;
          releaser = shells.releaser;
        };
      });
}
```

## nix/packages.nix

Defines buildable packages:

```nix
{ pkgs }:
{
  # Project name as the key
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

## nix/env.nix

Package groups for different purposes:

```nix
{ pkgs }:
{
  # Base system packages
  system = with pkgs; [
    git
    bash
    coreutils
  ];

  # Development tools
  dev = with pkgs; [
    bun
    nodejs
  ];

  # Runtime dependencies
  main = with pkgs; [
    # Runtime-only packages
  ];

  # Linting tools
  lint = with pkgs; [
    pre-commit
    treefmt
    # Formatters and linters
  ];

  # Release tools
  releaser = with pkgs; [
    semgrep
    # Release-specific tools
  ];
}
```

## nix/shells.nix

Shell definitions:

```nix
{ pkgs, env, packages, treefmt-nix }:
let
  inherit (pkgs) mkShell;
in
{
  # Default development shell (full tooling)
  default = mkShell {
    buildInputs = env.system ++ env.dev ++ env.main ++ env.lint;
    shellHook = ''
      echo "🚀 Kagent development shell"
      echo "Run 'pls help' for available commands"
    '';
  };

  # CI shell (minimal, only what's needed for CI)
  ci = mkShell {
    buildInputs = env.system ++ env.dev ++ env.main;
  };

  # Release shell
  releaser = mkShell {
    buildInputs = env.system ++ env.dev ++ env.releaser;
  };
}
```

## nix/pre-commit.nix

Pre-commit hooks configuration:

```nix
{ pkgs }:
{
  hooks = {
    # Format hook
    treefmt = {
      enable = true;
      name = "treefmt";
      entry = "${pkgs.treefmt}/bin/treefmt";
      files = "\\.nix$";
    };

    # Other hooks...
  };

  settings = {
    # Hook settings
  };
}
```

## nix/fmt.nix

Treefmt formatter configuration:

```nix
{ pkgs, treefmt-nix }:
treefmt-nix.lib.mkWrapper pkgs {
  projectRootFile = "flake.nix";

  programs = {
    nixpkgs-fmt.enable = true;
    prettier.enable = true;
    # Add other formatters
  };

  settings = {
    formatter = {
      nix = {
        command = "nixpkgs-fmt";
        includes = ["*.nix"];
      };
    };
  };
}
```

## Usage

### Entering Shells

```bash
# Default shell (full development)
nix develop

# CI shell (minimal)
nix develop .#ci

# Release shell
nix develop .#releaser

# Run a command in a shell
nix develop .#ci -c ./scripts/ci/build.sh
```

### Building Packages

```bash
# Build the package
nix build .#kagent

# Build and run
nix run .#kagent -- --version
```

## Best Practices

1. **All binaries via Nix** - No npm-installed CLI tools
2. **Modular imports** - Keep flake.nix clean, import from nix/
3. **Minimal CI shell** - Only include what CI needs
4. **Full dev shell** - Include everything for local development
5. **Package naming** - Use project name as key in packages

## Common Commands

```bash
# Update flake inputs
nix flake update

# Check flake
nix flake check

# Show flake info
nix flake show

# Clean old generations
nix-collect-garbage -d
```
