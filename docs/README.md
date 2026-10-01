# Documentation

Index of the documentation in this repo. Start here.

## Architecture

| Document | What it covers |
| --- | --- |
| [architecture.md](architecture.md) | How the app is put together: composition root, geometry, input, assets |
| [portability.md](portability.md) | The discipline that keeps widgets translatable to a non-DOM renderer, and how it is enforced |
| [animation.md](animation.md) | The animation descriptor format, the neutral timeline, easing registry and renderer adapters |
| [testing.md](testing.md) | What is tested where, and how to run each suite |

## Widgets

[widgets/README.md](widgets/README.md) is the widget catalogue - the shared vocabulary every
screen is built from, and the real deliverable of this port. Each widget has a page recording
what it does, its props, its animation parameters, which themes use it, and its fallback where
it relies on something a simple renderer lacks.

## Registries

| Document | What it covers |
| --- | --- |
| [devices.md](devices.md) | Canonical device slugs, screen resolutions and aspect classes |
| [frameworks.md](frameworks.md) | Candidate frameworks for implementing these mockups for real, and their capability gaps |

## Themes

One page per mockup set, describing its palette, fonts, layout system, input map and screen
inventory, alongside the reference material extracted from its upstream source.

| Theme | Page | Reference material |
| --- | --- | --- |
| Elementerial | [themes/elementerial.md](themes/elementerial.md) | [themes/elementerial/reference/](themes/elementerial/reference/) |
| PlayStation X | [themes/playstation-x.md](themes/playstation-x.md) | [themes/playstation-x/reference/](themes/playstation-x/reference/) |
| Vitro Launcher | [themes/vitrolauncher.md](themes/vitrolauncher.md) | [themes/vitrolauncher/reference/](themes/vitrolauncher/reference/) |
| NextUI | [themes/nextui.md](themes/nextui.md) | [themes/nextui/reference/](themes/nextui/reference/) |
| slot | [themes/slot.md](themes/slot.md) | [themes/slot/reference/](themes/slot/reference/) |
| SimpleOS | [themes/simpleos.md](themes/simpleos.md) | [themes/simpleos/reference/](themes/simpleos/reference/) |
| TortOS | [themes/tortos.md](themes/tortos.md) | [themes/tortos/reference/](themes/tortos/reference/) |
| NeoStation | [themes/neostation.md](themes/neostation.md) | [themes/neostation/reference/](themes/neostation/reference/) |
| DS Style | [themes/ds-style.md](themes/ds-style.md) | [themes/ds-style/reference/](themes/ds-style/reference/) |
| Wii Menu | [themes/wii-menu.md](themes/wii-menu.md) | [themes/wii-menu/reference/](themes/wii-menu/reference/) |
| spruceOS | [themes/spruceos.md](themes/spruceos.md) | [themes/spruceos/reference/](themes/spruceos/reference/) |
| Dreamcast BIOS | [themes/dreamcast-bios.md](themes/dreamcast-bios.md) | [themes/dreamcast-bios/reference/](themes/dreamcast-bios/reference/) |
| Example OS | [themes/example-cfw.md](themes/example-cfw.md) | none - it is a scaffold, not a reproduction |

Pages still carrying a status banner describe the original mockups; each is rewritten for the
React implementation as its theme is ported. All thirteen sets above are ported.

**[themes/example-cfw.md](themes/example-cfw.md) is the template for adding a theme.** It is
ported, and it documents what a theme is made of and how to start a new one.

## Porting notes

What the React implementation does differently from what it reproduces: every defect fixed, every
deliberate deviation, and how each was verified. For the four sets that had one, the comparison is
against the original vanilla-JS mockup; NextUI was built from firmware source directly, so its page
compares against that. SimpleOS has no source to read, so its page compares against the release
trailer and what was recovered from the binary. TortOS was built from its C source, so its page
compares against that and the reference frames the source repo ships. NeoStation was built from
its Flutter source, so its page compares against that and the frames from the project's website.
DS Style renders headlessly, so its page compares against frames the launcher drew itself. The
Wii Menu is closed, so its page compares against recordings of the console and the WM4K texture
pack. spruceOS's PyUI renders headlessly too, so its page compares against frames PyUI drew itself.
The Dreamcast BIOS is closed as well, but its textures, font and strings are decoded from the boot
ROM, so its page compares against the ROM and a recording of the menu on a console.

- [porting/elementerial.md](porting/elementerial.md)
- [porting/playstation-x.md](porting/playstation-x.md)
- [porting/vitrolauncher.md](porting/vitrolauncher.md)
- [porting/nextui.md](porting/nextui.md)
- [porting/slot.md](porting/slot.md)
- [porting/simpleos.md](porting/simpleos.md)
- [porting/tortos.md](porting/tortos.md)
- [porting/neostation.md](porting/neostation.md)
- [porting/ds-style.md](porting/ds-style.md)
- [porting/wii-menu.md](porting/wii-menu.md)
- [porting/spruceos.md](porting/spruceos.md)
- [porting/dreamcast-bios.md](porting/dreamcast-bios.md)
- [porting/example-cfw.md](porting/example-cfw.md)

All thirteen sets are ported, so this list is complete.
