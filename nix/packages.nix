{ pkgs, atomi, pkgs-2511, pkgs-unstable, self }:
let
  all = {
    atomipkgs = (
      with atomi;
      rec {
        /*

          */

        inherit
          /*

          */
          atomiutils
          sg
          pls;
      }
    );
    nix-unstable = (
      with pkgs-unstable;
      { }
    );
    nix-2511 = (
      with pkgs-2511;
      {

        inherit
          # standard
          git
          infisical

          treefmt
          gitlint
          shellcheck
          biome
          lcov

          # language
          bun
          ;
      }
    );

    # Build the CLI package - exported as packages.kagent per spec
    kagent = pkgs-2511.stdenv.mkDerivation {
      name = "kagent";
      version = "0.1.0";
      src = self;

      nativeBuildInputs = [ pkgs-2511.bun ];

      buildPhase = ''
        echo "🔨 Building CLI binary..."
        echo "Source directory contents:"
        ls -la
        echo ""
        bun install --frozen-lockfile
        bun build ./src/cli.ts --compile --outfile kagent
      '';

      installPhase = ''
        echo "📦 Installing binary..."
        mkdir -p $out/bin
        cp kagent $out/bin/kagent
        chmod +x $out/bin/kagent
      '';

      doCheck = false;
    };
  };
in
with all;
nix-2511 //
nix-unstable //
atomipkgs //
{ inherit kagent; }
