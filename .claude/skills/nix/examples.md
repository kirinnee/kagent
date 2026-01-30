# Nix Configuration Examples

Practical examples for common Nix flake configuration tasks using the modular nix/ folder structure.

## Adding Packages

### CLI Tool to Development

Add `ripgrep` (rg) and `fzf` to dev environment:

```nix
// nix/packages.nix
stable = with pkgs-stable; {
  inherit ripgrep fzf;
};

// nix/env.nix
dev = [ editor ripgrep fzf ];
```

### Language Runtime

Add Python to main runtime:

```nix
// nix/packages.nix
stable = with pkgs-stable; {
  inherit python312;
};

// nix/env.nix
main = [ runtime python312 ];
```

### Development Tools

Add Go development tools:

```nix
// nix/packages.nix
stable = with pkgs-stable; {
  inherit go gopls goimports;
};

// nix/env.nix
dev = [ editor go gopls goimports ];
```

### Multiple Packages at Once

```nix
// nix/packages.nix
stable = with pkgs-stable; {
  inherit jq ripgrep fzf bat fd exa;
};

// nix/env.nix
dev = [
  editor
  jq
  ripgrep
  fzf
  bat
  fd
  exa
];
```

## Creating Custom Shells

### Minimal Shell

```nix
// nix/shells.nix
{
  minimal = pkgs.mkShell {
    buildInputs = system;
    inherit shellHook;
  };
}

// Use: nix develop .#minimal
```

### Database Shell

```nix
// nix/packages.nix - add database packages
stable = with pkgs-stable; {
  inherit postgres redis;
};

// nix/env.nix - create database group
{
  database = [ postgres redis ];
}

// nix/shells.nix
{
  database = pkgs.mkShell {
    buildInputs = system ++ database;
    inherit shellHook;
    shellHook = ''
      ${checks.pre-commit-check.shellHook}
      echo "Database development environment"
    '';
  };
}
```

### Language-Specific Shell

```nix
// nix/packages.nix
stable = with pkgs-stable; {
  inherit python312 black ruff pytest;
};

// nix/env.nix
{
  python = [ python312 black ruff pytest ];
}

// nix/shells.nix
{
  python-dev = pkgs.mkShell {
    buildInputs = system ++ python ++ lint;
    shellHook = ''
      ${checks.pre-commit-check.shellHook}
      echo "Python $(python3.12 --version) environment"
      export PYTHONPATH=$(pwd)/src:$PYTHONPATH
    '';
  };
}
```

### Production Simulation Shell

```nix
// nix/shells.nix
{
  production = pkgs.mkShell {
    buildInputs = system ++ main;
    shellHook = ''
      echo "Production simulation (no dev tools)"
      export NODE_ENV=production
    '';
  };
}
```

## Adding Formatters

### Python Formatters

```nix
// nix/packages.nix
stable = with pkgs-stable; {
  inherit black ruff isort;
};

// nix/fmt.nix
{
  programs = {
    black.enable = true;
    ruff.enable = true;
  };
}
```

### Rust Formatter

```nix
// nix/packages.nix
stable = with pkgs-stable; {
  inherit rustfmt;
};

// nix/fmt.nix
{
  programs.rustfmt.enable = true;
}
```

### Custom Formatter Configuration

```nix
// nix/fmt.nix
{
  programs = {
    prettier = {
      enable = true;
      excludes = ["*.min.js" "dist/**"];
    };

    shfmt = {
      enable = true;
      indent = 2;
    };
  };
}
```

## Pre-commit Hooks

### Custom Linter Hook

```nix
// nix/packages.nix
stable = with pkgs-stable; {
  inherit eslint;
};

// nix/pre-commit.nix
hooks = {
  a-eslint = {
    enable = true;
    name = "ESLint";
    entry = "${packages.eslint}/bin/eslint --fix";
    files = "\\.(js|ts|jsx|tsx)$";
  };
}
```

### File Size Enforcer

```nix
// nix/pre-commit.nix
hooks = {
  a-file-size = {
    enable = true;
    name = "Check File Size";
    entry = "find . -type f -size +10M -not -path '*/node_modules/*' | grep . && exit 1 || exit 0";
    language = "system";
  };
}
```

### License Header Checker

```nix
// nix/packages.nix
stable = with pkgs-stable; {
  inherit reuse;
};

// nix/pre-commit.nix
hooks = {
  a-license = {
    enable = true;
    name = "Check License Headers";
    entry = "${packages.reuse}/bin/reuse lint";
    language = "system";
  };
}
```

### File Naming Convention

```nix
// nix/pre-commit.nix
hooks = {
  a-naming = {
    enable = true;
    name = "Check File Naming";
    entry = "find . -name '*.*' | grep -E '[A-Z]' | grep . && echo 'Files must be kebab-case' && exit 1 || exit 0";
    language = "system";
    excludes = ["node_modules/**"];
  };
}
```

### Secret Scanning

```nix
// nix/packages.nix
stable = with pkgs-stable; {
  inherit gitleaks;
};

// nix/pre-commit.nix
hooks = {
  a-secrets = {
    enable = true;
    name = "Secret Scan";
    entry = "${packages.gitleaks}/bin/gitleaks detect --source .";
    language = "system";
  };
}
```

## Environment Variables

### Node Environment

```nix
// nix/shells.nix
{
  default = pkgs.mkShell {
    buildInputs = system ++ main ++ lint ++ dev;
    shellHook = ''
      ${checks.pre-commit-check.shellHook}
      export NODE_ENV=development
      export npm_config_cache=$HOME/.npm-cache
    '';
  };
}
```

### Go Environment

```nix
// nix/shells.nix
{
  default = pkgs.mkShell {
    buildInputs = system ++ main ++ lint ++ dev;
    shellHook = ''
      ${checks.pre-commit-check.shellHook}
      export GOPATH=$(pwd)/.go
      export PATH=$GOPATH/bin:$PATH
      export GO111MODULE=on
    '';
  };
}
```

### Package Path Variables

```nix
// nix/shells.nix
{
  default = pkgs.mkShell {
    buildInputs = system ++ main ++ lint ++ dev;
    shellHook = ''
      ${checks.pre-commit-check.shellHook}

      # Use package paths
      export NODE_PATH="${packages.nodejs}/bin/node"
      export TOOL_PATH="${packages.my-tool}/bin"

      # Add to PATH
      export PATH=${packages.custom-tool}/bin:$PATH
    '';
  };
}
```

## Conditional Package Inclusion

### System-Specific Packages

```nix
// nix/packages.nix
{ pkgs, pkgs-stable, pkgs-unstable, custom-registry, system }:
let
  all = {
    stable = with pkgs-stable; {
      inherit git nodejs;
    };

    // macOS-only
    darwin = with pkgs; {
      inherit cocoapods;
    };

    // Linux-only
    linux = with pkgs; {
      inherit systemd;
    };
  };
in
with all;
stable ++
(if pkgs.system == "aarch64-darwin" || pkgs.system == "x86_64-darwin" then darwin else []) ++
(if pkgs.system == "x86_64-linux" then linux else [])
```

### Feature-Flagged Packages

```nix
// nix/packages.nix
{ pkgs, pkgs-stable, enableFeature ? false }:
let
  basePackages = with pkgs-stable; {
    inherit git nodejs;
  };

  featurePackages = with pkgs-stable; {
    inherit special-tool;
  };
in
basePackages // (if enableFeature then featurePackages else {})
```

## Advanced Shell Compositions

### Testing Shell

```nix
// nix/env.nix
{
  test = [ pytest jest ];
}

// nix/shells.nix
{
  test = pkgs.mkShell {
    buildInputs = system ++ main ++ test;
    shellHook = ''
      ${checks.pre-commit-check.shellHook}
      echo "Test environment"
      alias test-all="pytest && jest"
    '';
  };
}
```

### Multi-Stage Build Shell

```nix
// nix/shells.nix
{
  build = pkgs.mkShell {
    buildInputs = dev ++ lint;
    shellHook = ''
      echo "Build environment - no runtime deps"
    '';
  };

  runtime = pkgs.mkShell {
    buildInputs = system ++ main;
    shellHook = ''
      echo "Runtime environment - production deps only"
    '';
  };
}
```

### Shell With Aliases

```nix
// nix/shells.nix
{
  default = pkgs.mkShell {
    buildInputs = system ++ main ++ lint ++ dev;
    shellHook = ''
      ${checks.pre-commit-check.shellHook}
      alias fmt="treefmt"
      alias test="pytest"
      alias lint="treefmt --fail-on-change"
      echo "Development environment ready"
      echo "Available commands: fmt, test, lint"
    '';
  };
}
```

## Complete Example: Adding a Language Stack

Add complete TypeScript development stack:

```nix
// nix/packages.nix
stable = with pkgs-stable; {
  inherit nodejs_20 pnpm biome;
};

// nix/env.nix
{
  node = [ nodejs_20 pnpm ];
  ts = [ biome ];
}

// nix/fmt.nix
{
  programs.biome.enable = true;
}

// nix/pre-commit.nix
hooks = {
  a-biome-check = {
    enable = true;
    name = "Biome Check";
    entry = "${packages.biome}/bin/biome check --write";
    files = "\\.(ts|tsx|js|jsx)$";
  };
}

// nix/shells.nix
{
  typescript = pkgs.mkShell {
    buildInputs = system ++ node ++ ts ++ lint;
    shellHook = ''
      ${checks.pre-commit-check.shellHook}
      export NODE_ENV=development
      echo "TypeScript development environment ready"
      alias format="biome format --write ."
      alias check="biome check ."
    '';
  };
}
```

## Working with Multiple Registries

### Using Stable and Unstable

```nix
// nix/packages.nix
{ pkgs, pkgs-stable, pkgs-unstable }:
let
  all = {
    stable = with pkgs-stable; {
      inherit git nodejs;
    };

    unstable = with pkgs-unstable; {
      inherit latest-tool;
    };
  };
in
with all;
stable // unstable
```

### Custom Registry

```nix
// flake.nix inputs
inputs = {
  my-registry.url = "github:myorg/nix-registry";
};

// nix/packages.nix
{ pkgs, pkgs-stable, my-registry }:
let
  all = {
    stable = with pkgs-stable; {
      inherit git;
    };

    myOrg = with my-registry; {
      inherit internal-tool;
    };
  };
in
with all;
stable // myOrg
```

## Quick Reference

| Task              | Files to Edit                      |
| ----------------- | ---------------------------------- |
| Add CLI tool      | packages.nix, env.nix              |
| Add runtime       | packages.nix, env.nix (main group) |
| Add formatter     | packages.nix, fmt.nix              |
| Add linter hook   | packages.nix, pre-commit.nix       |
| Add enforcer hook | pre-commit.nix                     |
| Add env variable  | shells.nix                         |
| Create shell      | shells.nix                         |
| Use package path  | shells.nix (${packages.xxx})       |
