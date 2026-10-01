# Dreamcast BIOS reference material

Where each file here came from. Everything was fetched and cut in a container, never on the host.

| File | Source |
| --- | --- |
| `extract-assets.py` | Decodes the boot ROM's textures, system font, English strings, sounds and models into `app/src/themes/dreamcast-bios/assets/` and `strings-en.txt`. Run it on your own `dc_boot.bin`; the command is at the top of the script |
| `bios_models.py` | Finds and decodes the ROM's Ninja chunk models and their motions; `extract-assets.py` imports it |
| `bios_sound.py` | Decodes the boot sound and renders the menu's sequences; `extract-assets.py` imports it |
| `strings-en.txt` | The English string table, as the script reads it out of the ROM, one string a line |
| `source-notes.md` | Every measured value, and every ROM offset, with where it came from |
| `frames/*.png` | Frames of the recording, its 4:3 picture cut out of the 16:9 video and scaled to 640x480 |

## The recording

`c69qVhS_WOU` on YouTube: the menu on a real console set to English, from power-on through every
screen, 1080p60, the console's 4:3 picture pillarboxed at x 248-1688. It was fetched with `yt-dlp`
(format 312, and format 140 for its audio, which places each sound) and cut with `ffmpeg`, seeking
after the input so each frame is the one at that time:

```
ffmpeg -i full1080.mp4 -ss <time> -frames:v 1 -vf "crop=1440:1080:248:0,scale=640:480:flags=area" <frame>.png
```

Seeking before the input lands on the nearest keyframe in this file, a second or two away, so every
time here is one read with the command above.

## Frames

| Frame | Time |
| --- | --- |
| `boot-wordmark.png`, `boot-logo.png` | 2.5s, 7.0s |
| `boot-clock.png`, `boot-clock-set.png` | 11.5s, 28.5s |
| `main.png` | 33.5s |
| `no-disc.png` | 37.5s |
| `music-empty.png` | 45.5s |
| `music-disc-playing.png`, `music-disc.png` | 267.0s, 275.0s |
| `settings-language.png`, `settings.png`, `settings-clock.png` | 58.5s, 69.5s, 72.5s |
| `settings-sound.png`, `settings-other.png` | 78.5s, 85.5s |
| `settings-vmu-clock.png`, `settings-vmu-done.png` | 95.5s, 98.5s |
| `file-cards.png`, `file-list.png`, `file-all-menu.png` | 104.5s, 111.5s, 121.5s |
| `file-menu.png`, `file-delete.png`, `file-deleted.png` | 129.5s, 132.5s, 134.5s |
| `cards-back.png` | 141.5s |
| `zoom-text.png` | 69.5s, the Language row cut from the 1080p picture and doubled |

The recording carries the console's own interface; the frames are kept only as the reference each
still is compared with.

## Other sources

- [KallistiOS `dc/biosfont.h`](https://github.com/KallistiOS/KallistiOS/blob/master/kernel/arch/dreamcast/include/dc/biosfont.h):
  the system font's layout.
- [dreamcast.wiki/BIOS](https://dreamcast.wiki/BIOS): BIOS versions and hashes.
- [madsonweb/SegaDreamcastBiosTextToPTBR](https://github.com/madsonweb/SegaDreamcastBiosTextToPTBR):
  where the string tables are.
- The US Dreamcast manual, pages 9-24 ([manualslib 318214](https://www.manualslib.com/manual/318214/Sega-Dreamcast.html)):
  what each screen's buttons do.
- The issue's own link, a dreamcast-talk.com thread, sits behind a challenge page and could not be
  read. Its title, "Dreamcast BIOS based custom menu concept", describes a menu in the BIOS's style
  rather than the BIOS, so it is not used.
