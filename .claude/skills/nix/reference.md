# Nix Flake Configuration Reference

Complete technical reference for the modular Nix flake architecture using the nix/ folder structure.

## File Structure

```
nix/
├── packages.nix   # Package aggregation from registries
├── env.nix        # Environment group definitions
├── shells.nix     # Development shell definitions
├── fmt.nix        # Treefmt formatter configuration
└── pre-commit.nix # Pre-commit hooks configuration

flake.nix          # Main flake configuration
.envrc             # Direnv configuration
```

## File-by-File Reference

### flake.nix

**Purpose**: Central orchestrator for the entire Nix configuration.

**Inputs** (typically include):

- `nixpkgs` - Official Nix packages (can have multiple: stable, unstable)
- Custom registries - Organization-specific packages
- `treefmt-nix` - Treefmt module for formatting
- `pre-commit-hooks` - Pre-commit hooks framework
- `flake-utils` - System utility functions

**Outputs**:

```nix
{
  packages    # All aggregated packages
  devShells   # default, ci, releaser, custom
  formatter   # Treefmt wrapper
  checks      # pre-commit-check, format
}
```

**Structure**:

```nix
{
  description = "Project description";

  inputs = {
    nixpkgs.url = "nixpkgs/nixos-25.11";
    treefmt-nix.url = "github:numtide/treefmt-nix";
    pre-commit-hooks.url = "github:cachix/pre-commit-hooks.nix";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, treefmt-nix, pre-commit-hooks, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};

        # Import modules
        packages = import ./nix/packages.nix { inherit pkgs; };
        env = import ./nix/env.nix { inherit packages; };
        shells = import ./nix/shells.nix { inherit pkgs env; };
        formatter = import ./nix/fmt.nix { inherit treefmt-nix pkgs; };
        pre-commit = import ./nix/pre-commit.nix { inherit packages formatter pre-commit-hooks; };
      in
      {
        inherit packages devShells formatter checks;
      }
    );
}
```

### nix/packages.nix

**Purpose**: Aggregate packages from multiple registries into a unified namespace.

**Structure**:

```nix
{ pkgs, pkgs-stable, pkgs-unstable, custom-registry }:
let
  all = {
    # Custom registry
    custom = with custom-registry; {
      inherit tool1 tool2;
    };

    # Unstable packages
    unstable = with pkgs-unstable; {
      inherit new-package;
    };

    # Stable packages
    stable = with pkgs-stable; {
      inherit git nodejs python3;
    };
  };
in
with all;
stable // unstable // custom
```

**Common Package Sources**:

| Source                   | Purpose                      |
| ------------------------ | ---------------------------- |
| `nixpkgs/nixos-XX.XX`    | Stable release (e.g., 25.11) |
| `nixpkgs/nixos-unstable` | Latest packages              |
| Custom registries        | Organization-specific tools  |

### nix/env.nix

**Purpose**: Organize packages into functional groups for different use cases.

**Common Groups**:

```nix
{ pkgs, packages }:
with packages;
{
  system = [ core-utils ];      # Core utilities
  dev = [ editor debugger ];    # Development tools
  main = [ runtime runtime-lib ];  # Runtime dependencies
  lint = [ formatter linter ];  # Code quality tools
  releaser = [ release-tool ];  # Release management
}
```

**Group Reference**:

| Group      | Typical Purpose               | Typically In        |
| ---------- | ----------------------------- | ------------------- |
| `system`   | Core utilities, always needed | All shells          |
| `dev`      | Editors, debuggers, dev tools | default shell only  |
| `main`     | Runtime dependencies          | All shells          |
| `lint`     | Formatters, linters           | All shells          |
| `releaser` | Release tools                 | releaser shell only |

**Why Groups?**

- **CI shell** doesn't need interactive editors or debuggers
- **Releaser shell** needs release tools but not full dev suite
- **Default shell** has everything for active development
- Enables flexible shell composition

### nix/shells.nix

**Purpose**: Define development environments for different workflows.

**Structure**:

```nix
{ pkgs, packages, env, shellHook }:
with env;
{
  default = pkgs.mkShell {
    buildInputs = system ++ main ++ lint ++ dev;
    inherit shellHook;
  };

  ci = pkgs.mkShell {
    buildInputs = system ++ main ++ lint;
    inherit shellHook;
  };

  releaser = pkgs.mkShell {
    buildInputs = system ++ main ++ lint ++ releaser;
    inherit shellHook;
  };
}
```

**Shell Patterns**:

| Shell      | Groups                          | Use Case               |
| ---------- | ------------------------------- | ---------------------- |
| `default`  | system + main + lint + dev      | Full local development |
| `ci`       | system + main + lint            | CI/CD pipelines        |
| `releaser` | system + main + lint + releaser | Release management     |
| `minimal`  | system                          | Bare minimum           |

### nix/fmt.nix

**Purpose**: Configure multi-language code formatting via treefmt.

**Structure**:

```nix
{ treefmt-nix, pkgs, ... }:
let
  fmt = {
    projectRootFile = "flake.nix";

    programs = {
      nixpkgs-fmt.enable = true;    # Nix files
      prettier.enable = true;        # JS/TS, JSON, MD
      shfmt.enable = true;           # Shell scripts
      actionlint.enable = true;      # GitHub Actions
    };
  };
in
(treefmt-nix.lib.evalModule pkgs fmt).config.build.wrapper
```

**Common Formatters**:

| Formatter   | Language          | Files                   |
| ----------- | ----------------- | ----------------------- |
| nixpkgs-fmt | Nix               | `*.nix`                 |
| prettier    | JS/TS/JSON/MD/CSS | `*.{js,ts,json,md,css}` |
| shfmt       | Shell             | `*.sh`                  |
| black       | Python            | `*.py`                  |
| rustfmt     | Rust              | `*.rs`                  |

**Usage**:

```bash
treefmt                    # Format all files
treefmt --fail-on-change   # Check if formatting needed
treefmt ./nix/             # Format specific directory
```

### nix/pre-commit.nix

**Purpose**: Configure git pre-commit hooks for code quality and security.

**Structure**:

```nix
{ packages, formatter, pre-commit-lib }:
pre-commit-lib.run {
  src = ./.;
  hooks = {
    treefmt = { enable = true; package = formatter; };
    my-linter = { enable = true; entry = "..."; files = ".*ext$"; };
  };
}
```

**Hook Types**:

| Type      | Purpose             | Example                   |
| --------- | ------------------- | ------------------------- |
| Formatter | Runs treefmt        | `treefmt` hook            |
| Linter    | Checks file quality | `eslint`, `shellcheck`    |
| Enforcer  | Validates policies  | File permissions, secrets |

**Hook Configuration Options**:

```nix
{
  enable = true;                    # Enable/disable hook
  name = "Display Name";           # Display name
  entry = "command";               # Command to run
  files = "pattern";               # File pattern (regex)
  excludes = ["pattern"];          # Exclusion patterns
  language = "system";             # Language: system, bash, node, etc.
}
```

### .envrc

**Purpose**: Direnv configuration for automatic shell loading.

**Structure**:

```bash
watch_file "./nix/*.nix" "./flake.nix"
use flake
# Optional: setup-command
```

**Components**:

1. `watch_file` - Monitors files for changes and auto-reloads
2. `use flake` - Loads the default dev shell
3. Optional commands - Run after shell loads

**Direnv Commands**:

```bash
direnv allow      # Allow .envrc to load
direnv reload     # Manually reload
direnv status     # Check status
```

## Package Registries

### Nixpkgs Stable

**URL pattern**: `nixpkgs/nixos-XX.XX`

**Purpose**: Stable, tested packages

**Example**: `nixpkgs/nixos-25.11`

### Nixpkgs Unstable

**URL**: `nixpkgs/nixos-unstable`

**Purpose**: Latest package versions

### Custom Registries

**Purpose**: Organization-specific packages

**Structure**: Typically a GitHub repository with flake outputs

## Adding Packages

### Step 1: Add to Registry

```nix
// nix/packages.nix
stable = with pkgs-stable; {
  inherit existing-packages new-package;
};
```

### Step 2: Add to Environment Group

```nix
// nix/env.nix
{
  dev = [ tool1 tool2 new-package ];
}
```

### Step 3: Apply

```bash
nix flake update
direnv reload  # If using direnv
```

## Adding Formatters

### Step 1: Add Package

```nix
// nix/packages.nix
stable = with pkgs-stable; {
  inherit black;
};
```

### Step 2: Configure in fmt.nix

```nix
// nix/fmt.nix
programs = {
  black.enable = true;
};
```

### Step 3: Exclude Files (Optional)

```nix
programs.black.excludes = ["*.generated.ts"];
```

## Adding Pre-commit Hooks

### Formatter Hook

```nix
hooks = {
  my-fmt = {
    enable = true;
    package = formatter;  // Uses treefmt
    excludes = ["*.log"];
  };
}
```

### Linter Hook

```nix
hooks = {
  my-linter = {
    enable = true;
    name = "My Linter";
    entry = "${packages.my-linter}/bin/my-linter --arg";
    files = "\\.(ext|EXT)$";
  };
}
```

### Enforcer Hook

```nix
hooks = {
  my-enforcer = {
    enable = true;
    name = "Check File Size";
    entry = "find . -type f -size +10M | grep . && exit 1 || exit 0";
    language = "system";
  };
}
```

## Environment Variables

### Adding to Shell Hook

```nix
// nix/shells.nix
{
  default = pkgs.mkShell {
    buildInputs = system ++ main ++ lint ++ dev;
    shellHook = ''
      ${checks.pre-commit-check.shellHook}

      export MY_VAR="value"
      export TOOL_PATH="${packages.my-tool}/bin"
      export PROJECT_ROOT=$(pwd)
    '';
  };
}
```

### Available Variables

| Variable Type | Example                  | Description            |
| ------------- | ------------------------ | ---------------------- |
| Package path  | `${packages.nodejs}/bin` | Path to package binary |
| Shell var     | `$(pwd)`, `${USER}`      | Standard bash          |

## Creating Custom Shells

### Basic Shell

```nix
{
  minimal = pkgs.mkShell {
    buildInputs = system;
    inherit shellHook;
  };
}
```

### With Specific Groups

```nix
{
  database = pkgs.mkShell {
    buildInputs = system ++ dev ++ [ postgres redis ];
    inherit shellHook;
  };
}
```

### With Custom Hook

```nix
{
  custom = pkgs.mkShell {
    buildInputs = system ++ main;
    shellHook = ''
      ${checks.pre-commit-check.shellHook}
      echo "Custom environment"
      export CUSTOM_VAR=value
    '';
  };
}
```

## Usage Commands

| Action               | Command                                |
| -------------------- | -------------------------------------- |
| Enter default shell  | `nix develop` or `cd` (direnv)         |
| Enter specific shell | `nix develop .#ci`                     |
| Run command in shell | `nix develop .#ci --command run-tests` |
| Format code          | `treefmt`                              |
| Check formatting     | `treefmt --fail-on-change`             |
| Update packages      | `nix flake update`                     |
| Search packages      | `nix search nixpkgs package-name`      |
| Show flake info      | `nix flake show`                       |

## Environment Groups Best Practices

| Group      | Should Include                        |
| ---------- | ------------------------------------- |
| `system`   | Core utilities, always needed         |
| `dev`      | Editors, debuggers, interactive tools |
| `main`     | Runtime dependencies, libraries       |
| `lint`     | Formatters, linters, checkers         |
| `releaser` | Release automation tools              |

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
