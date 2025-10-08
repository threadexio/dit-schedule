{
  pkgs ? import <nixpkgs> {}
}:
with pkgs;

mkShell {
  packages = [
    nodejs
    nodePackages.npm
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
