#!/bin/sh
# Render spruceOS's reference frames with PyUI itself.
#
# PyUI is pysdl2, so it draws with SDL's offscreen video driver and software renderer in a plain
# Linux container. `harness.py` runs it unmodified for one device and one still, feeding the
# buttons from `stills.txt` and saving the last frame PyUI presents, against the sample card that
# `make-fixture.py` builds from `fixture.txt`.
#
# Run from the repo root, in a container:
#
#   docker run --rm -v <spruceOS>:/src:ro -v "$PWD":/repo -w /repo python:3.12-slim \
#     sh docs/themes/spruceos/reference/render-reference.sh [repo-device ...]
#
# With no devices it renders every device whose frames are committed, all of them for every still.
# Only the stills the port carries on each device are kept (`app/src/themes/spruceos/manifest.ts`);
# README.md says how the rest are told apart. Any device in the table below may be named.
#
# The clock is libfaketime's, starting at 12:34:00 and running: PyUI waits on elapsed time in
# places, so a frozen clock hangs it, and a still takes seconds, so the minute never changes.
set -eu

here=docs/themes/spruceos/reference

apt-get update -qq > /dev/null
apt-get install -y -qq libsdl2-2.0-0 libsdl2-ttf-2.0-0 libsdl2-image-2.0-0 libsdl2-gfx-1.0-0 \
  libsdl2-mixer-2.0-0 gcc linux-libc-dev faketime > /dev/null
# Pillow is pinned because the fixture's box art is drawn with its bundled default font.
pip -q install pysdl2==0.9.17 pillow==12.3.0 psutil==7.2.2 pyserial==3.5 evdev==2.0.0

# This repo's device slug, and the name PyUI is started with (`mainui.py:63-117`).
pyui_name() {
  case "$1" in
    miyoo-a30) echo MIYOO_A30 ;;
    miyoo-flip) echo MIYOO_FLIP ;;
    miyoo-mini) echo MIYOO_MINI ;;
    miyoo-mini-plus) echo MIYOO_MINI_PLUS ;;
    miyoo-mini-v4) echo MIYOO_MINI_V4 ;;
    miyoo-mini-flip) echo MIYOO_MINI_FLIP ;;
    trimui-brick) echo TRIMUI_BRICK ;;
    trimui-brick-pro) echo TRIMUI_BRICK_PRO ;;
    trimui-smart-pro) echo TRIMUI_SMART_PRO ;;
    trimui-smart-pro-s) echo TRIMUI_SMART_PRO_S ;;
    rg35xx | rg40xx) echo ANBERNIC_RGXX640480 ;;
    rg34xx) echo ANBERNIC_RGXX720480 ;;
    rg28xx) echo ANBERNIC_RG28XX ;;
    rg-cubexx) echo ANBERNIC_RGCUBEXX ;;
    miniloong-pocket1) echo MINILOONG_POCKET1 ;;
    *) echo "unknown device: $1" >&2; exit 1 ;;
  esac
}

devices=${*:-miyoo-a30 miyoo-flip miyoo-mini miyoo-mini-v4 trimui-brick trimui-smart-pro rg35xx rg34xx rg28xx rg-cubexx miniloong-pocket1}

export FIXTURE=/tmp/spruceos-fixture
rm -rf "$FIXTURE"
python "$here/make-fixture.py" "$FIXTURE"

ft=$(ls /usr/lib/*/faketime/libfaketime.so.1)
logs=/tmp/spruceos-logs
mkdir -p "$logs"

for device in $devices; do
  name=$(pyui_name "$device")
  # Absolute, because PyUI runs from its own directory.
  out="$PWD/$here/render/$device"
  rm -rf "$out"
  mkdir -p "$out"
  # Every view PyUI builds on the way to each still, so the port's rows are PyUI's own.
  export VIEW_LOG="$out/views.jsonl"
  # One still per line: slug|buttons|environment|overrides. The harness rebuilds the card for every still,
  # so no still's settings leak into the next.
  grep -v '^#' "$here/stills.txt" | grep . | while IFS='|' read -r slug events env overrides; do
    for o in $overrides; do
      case "$o" in "$device="*) events=${o#*=} ;; esac
    done
    # shellcheck disable=SC2086
    if ! env $env LD_PRELOAD="$ft" FAKETIME="@2026-09-30 12:34:00" timeout 90 \
      python "$here/harness.py" "$name" "$events" "$out/$slug.png" > "$logs/$device-$slug.log" 2>&1; then
      echo "failed: $device $slug (see $logs/$device-$slug.log)" >&2
      exit 1
    fi
  done
  echo "$device: $(ls "$out" | wc -l) frames"
done
