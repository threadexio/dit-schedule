{
  pkgs ? import <nixpkgs> {}
}:
with pkgs;

mkShell {
  packages = [
    (python3.withPackages (p: with p; [
      arrow
      ics
    ]))
  ];
}
