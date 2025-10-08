{
  pkgs ? import <nixpkgs> {}
}:
with pkgs;

mkShell {
  packages = [
    bun
    nodePackages.prettier
    vscode-langservers-extracted
    typescript-language-server
    vue-language-server
  ];
}
