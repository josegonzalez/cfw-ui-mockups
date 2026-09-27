#!/bin/sh
# Render DS Style's reference frames with the launcher itself.
#
# DS Style's `--render` path draws a frame and returns before it touches the framebuffer or input
# (`source/dsstyle.c:598-605`), so a plain Linux build renders headlessly. Every frame here is the
# real renderer's output for one still of the port, posed with `--events` from Home or Settings
# against a fixture ROM tree that mirrors the port's sample library (`app/src/themes/ds-style/library.ts`).
#
# Run from the repo root, in a container:
#
#   docker run --rm -v <rg-sp-ds-style>:/src:ro -v "$PWD":/repo -w /repo gcc:14 \
#     sh docs/themes/ds-style/reference/render-reference.sh
#
# `--demo` pins the clock at 12:34 PM and the battery at 75% (`ui.h:116, 143`). `--screen list`
# and its siblings are never used: with `--demo` they swap in the source's fake five-game list
# (`dsstyle.c:594, 603`) instead of browsing the fixture, so every browser still is reached by
# pressing through from Home instead.
set -eu

here=docs/themes/ds-style/reference
work=/tmp/ds-style-render
rm -rf "$work"
mkdir -p "$work"
rm -f "$here"/render/*.png

gcc -O2 -std=c11 -D_DEFAULT_SOURCE -o "$work/dsstyle" /src/source/dsstyle.c -lm

# The fixture: the same systems and file names as the port's library. The files are empty - the
# launcher only reads names and extensions to list them.
roms="$work/Roms"
while IFS='|' read -r system file; do
  case "$system" in ''|'#'*) continue ;; esac
  mkdir -p "$roms/$system"
  : > "$roms/$system/$file"
done < "$here/fixture.txt"

# A fresh copy of the launcher's own assets and state for every frame, so no frame's settings
# leak into the next.
fresh() {
  rm -rf "$work/base"
  cp -r /src/device/Roms/APPS/DSStyle "$work/base"
  mkdir -p "$work/base/state"
  printf '%s\n' "$roms/GBA/Garden Quest.gba" "$roms/SFC/Super Metroid.sfc" > "$work/base/state/recent.txt"
  printf '%s\n' "$roms/GBA/Pocket Rally.gba" "$roms/GB/Tetris.gb" > "$work/base/state/favourites.txt"
}

# One still per line: slug|screen|events|environment|flags.
while IFS='|' read -r slug screen events env flags; do
  case "$slug" in ''|'#'*) continue ;; esac
  fresh
  # shellcheck disable=SC2086
  env $env "$work/dsstyle" --preview --demo --base "$work/base" --roms "$roms" \
    --screen "$screen" ${events:+--events "$events"} $flags --render "$work/$slug.bmp" > /dev/null 2> "$work/$slug.log"
  # PNG without timestamps, so a rerun is byte-identical when nothing changed.
  convert "$work/$slug.bmp" -strip -define png:exclude-chunks=date,time "$here/render/$slug.png"
done < "$here/stills.txt"

echo "rendered $(ls "$here/render" | wc -l) frames"
