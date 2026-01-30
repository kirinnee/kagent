{ pkgs, packages, env, shellHook }:
with env;
{
  default = pkgs.mkShell {
    buildInputs = system ++ main ++ lint ++ dev

      /*
        
      */
    ;
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
