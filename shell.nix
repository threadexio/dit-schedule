{
  pkgs ? import <nixpkgs> {}
}:
with pkgs;

mkShell {
  packages = [
    bun
    vscode-langservers-extracted
    typescript-language-server
    dprint
  ];
}
