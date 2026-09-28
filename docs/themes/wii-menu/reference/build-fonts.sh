#!/bin/sh
# Fetch M PLUS 1p, the stand-in for the Wii's own Rodin NTLG, and cut it down to Latin.
#
# The System Menu's font is not free to ship, and WM4K's redrawn atlases carry no metrics, so the
# closest free face was chosen by setting candidates beside captured text (see README.md). M PLUS 1p
# is OFL; its Japanese is dropped because the port's strings are all US English.
#
# Run in a container, from the repo root:
#
#   docker run --rm -v "$PWD":/repo -w /repo python:3.12-slim sh docs/themes/wii-menu/reference/build-fonts.sh
set -eu

apt-get update -qq > /dev/null && apt-get install -y -qq curl > /dev/null
pip -q install fonttools brotli

out=app/src/themes/wii-menu/assets/fonts
work=/tmp/mplus
mkdir -p "$out" "$work"
base=https://raw.githubusercontent.com/google/fonts/main/ofl/mplus1p
curl -sfL -o "$work/OFL.txt" "$base/OFL.txt"
for weight in Regular Medium Bold; do
  curl -sfL -o "$work/$weight.ttf" "$base/MPLUS1p-$weight.ttf"
  # Basic Latin, Latin-1, general punctuation, and the circled A the prompts use.
  pyftsubset "$work/$weight.ttf" --unicodes='U+0020-007E,U+00A0-00FF,U+2010-2027,U+24B6' \
    --flavor=woff2 --output-file="$out/MPLUS1p-$weight.woff2"
done
cp "$work/OFL.txt" "$out/OFL.txt"
ls -la "$out"
