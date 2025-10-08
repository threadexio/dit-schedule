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
    (python3.withPackages (p: with p; [
      beautifulsoup4
      requests
    ]))
  ];
}
