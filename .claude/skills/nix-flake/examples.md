# Nix Flake Structure - Examples

## Example 1: Minimal flake.nix

```nix
{
  description = "My CLI tool";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystemMap (system:
      let
        pkgs = import nixpkgs { inherit system; };
      in {
        packages.default = pkgs.stdenv.mkDerivation {
          pname = "mytool";
          version = "1.0.0";
          src = ./.;
          buildPhase = "echo 'Building...'";
          installPhase = "mkdir -p $out/bin && echo 'echo hello' > $out/bin/mytool && chmod +x $out/bin/mytool";
        };
      });
}
```

## Example 2: flake.nix with Modular Imports

```nix
{
  description = "Kagent CLI Framework";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
    treefmt-nix.url = "github:numtide/treefmt-nix";
  };

  outputs = { self, nixpkgs, flake-utils, treefmt-nix }:
    flake-utils.lib.eachDefaultSystemMap (system:
      let
        pkgs = import nixpkgs { inherit system; };

        # Import from nix/ directory
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

## Example 3: nix/packages.nix - Bun CLI

```nix
{ pkgs }:
{
  kagent = pkgs.stdenv.mkDerivation {
    pname = "kagent";
    version = "0.1.0";
    src = ./.;

    nativeBuildInputs = [ pkgs.bun ];

    buildPhase = ''
      bun build --compile --outfile dist/kagent src/cli.ts
    '';

    installPhase = ''
      mkdir -p $out/bin
      cp dist/kagent $out/bin/kagent
      chmod +x $out/bin/kagent
    '';
  };
}
```

## Example 4: nix/packages.nix - TypeScript CLI

```nix
{ pkgs }:
{
  mycli = pkgs.stdenv.mkDerivation {
    pname = "mycli";
    version = "1.0.0";
    src = ./.;

    nativeBuildInputs = [ pkgs.nodejs pkgs.bun ];

    buildPhase = ''
      bun install
      bun run build
    '';

    installPhase = ''
      mkdir -p $out/bin
      cp dist/cli.js $out/bin/mycli
      chmod +x $out/bin/mycli

      # Add node shebang
      echo '#!/usr/bin/env node' | cat - dist/cli.js > temp
      mv temp $out/bin/mycli
    '';
  };
}
```

## Example 5: nix/env.nix - Full Environment

```nix
{ pkgs }:
{
  system = with pkgs; [
    git
    bash
    coreutils
    findutils
  ];

  dev = with pkgs; [
    bun
    nodejs_20
  ];

  main = with pkgs; [
    # Runtime dependencies
  ];

  lint = with pkgs; [
    pre-commit
    treefmt
    nixpkgs-fmt
    prettier
  ];

  releaser = with pkgs; [
    semgrep
    release-cli
  ];
}
```

## Example 6: nix/shells.nix - Multiple Shells

```nix
{ pkgs, env, packages, treefmt-nix }:
let
  inherit (pkgs) mkShell;
in
{
  default = mkShell {
    buildInputs = env.system ++ env.dev ++ env.main ++ env.lint;

    shellHook = ''
      echo "🚀 Kagent Development Environment"
      echo ""
      echo "Available commands:"
      echo "  pls setup    - Install dependencies"
      echo "  pls build    - Build the CLI"
      echo "  pls test     - Run all tests"
      echo "  pls lint     - Run linters"
      echo ""
    '';
  };

  ci = mkShell {
    buildInputs = env.system ++ env.dev ++ env.main;
  };

  releaser = mkShell {
    buildInputs = env.system ++ env.dev ++ env.releaser;
  };
}
```

## Example 7: nix/pre-commit.nix

```nix
{ pkgs }:
{
  hooks = {
    treefmt = {
      enable = true;
      name = "treefmt";
      entry = "${pkgs.treefmt}/bin/treefmt";
      files = "\\.nix$";
    };

    prettier = {
      enable = true;
      name = "prettier";
      entry = "${pkgs.prettier}/bin/prettier --write";
      files = "\\.(ts|js|json|md|yml|yaml)$";
    };

    shellcheck = {
      enable = true;
      name = "shellcheck";
      entry = "${pkgs.shellcheck}/bin/shellcheck";
      files = "\\.sh$";
    };
  };

  settings = {
    # Hook-specific settings
  };
}
```

## Example 8: nix/fmt.nix

```nix
{ pkgs, treefmt-nix }:
treefmt-nix.lib.mkWrapper pkgs {
  projectRootFile = "flake.nix";

  programs = {
    nixpkgs-fmt.enable = true;
    prettier.enable = true;
    shfmt.enable = true;
  };

  settings = {
    formatter = {
      nix = {
        command = "nixpkgs-fmt";
        includes = ["*.nix"];
      };
      js = {
        command = "prettier";
        includes = ["*.ts" "*.js" "*.json"];
      };
      sh = {
        command = "shfmt";
        includes = ["*.sh"];
      };
    };
  };
}
```

## Example 9: Using the Flake

```bash
# Enter development shell
nix develop

# Build the package
nix build .#kagent

# Run the built package
nix run .#kagent -- --version

# Run a command in CI shell
nix develop .#ci -c ./scripts/ci/build.sh

# Update flake inputs
nix flake update

# Check everything
nix flake check
```

## Example 10: CI Integration

```yaml
# .github/workflows/ci.yml
name: CI

on: push

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install Nix
        uses: cachix/install-nix-action@v25

      - name: Build
        run: nix build .#kagent

      - name: Test
        run: nix develop .#ci -c ./scripts/ci/test.sh
```
