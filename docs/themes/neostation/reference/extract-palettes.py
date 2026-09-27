#!/usr/bin/env python3
"""Generate the NeoStation palette module from the source's own theme files.

NeoStation's 14 built-in themes are compiled Dart (`lib/themes/<id>_theme.dart`), each the same 25
`const Color _name = Color(0xAARRGGBB)` declarations, a `ColorScheme.dark` or `ColorScheme.light`,
and a `CornerRadii` tier. Transcribing 350 colours by hand is how a port drifts from its source, so
they are read out of the files instead.

Usage, from the repo root:
    python3 docs/themes/neostation/reference/extract-palettes.py \\
        <neostation-frontend>/lib/themes > app/src/themes/neostation/palettes.ts
"""
import re
import sys
from pathlib import Path

# `ThemeProvider.availableThemes` and `themeDisplayNames` (`lib/providers/theme_provider.dart:49-80`),
# in the provider's own order.
THEMES = [
    ("dark", "Dark"),
    ("light", "Light"),
    ("oled", "OLED"),
    ("valentine", "Valentine"),
    ("dracula", "Dracula"),
    ("nord", "Nord"),
    ("coffee", "Coffee"),
    ("tokyo_night", "Tokyo Night"),
    ("retro", "Retro"),
    ("abyss", "Abyss"),
    ("cyberpunk", "Cyberpunk"),
    ("aqua", "Aqua"),
    ("palenight", "Palenight"),
    ("horizon", "Horizon"),
]

# The Dart constant, and the key it takes here.
KEYS = [
    ("_primaryColor", "primary"),
    ("_onPrimaryColor", "onPrimary"),
    ("_secondaryColor", "secondary"),
    ("_onSecondaryColor", "onSecondary"),
    ("_tertiaryColor", "tertiary"),
    ("_onTertiaryColor", "onTertiary"),
    ("_tertiaryFixedColor", "tertiaryFixed"),
    ("_onTertiaryFixedColor", "onTertiaryFixed"),
    ("_surfaceColor", "surface"),
    ("_onSurfaceColor", "onSurface"),
    ("_outlineColor", "outline"),
    ("_shadowColor", "shadow"),
    ("_backgroundColor", "background"),
    ("_batteryFull", "batteryFull"),
    ("_batteryMedium", "batteryMedium"),
    ("_batteryLow", "batteryLow"),
    ("_batteryPower", "batteryPower"),
    ("_errorColor", "error"),
    ("_onErrorColor", "onError"),
    ("_warningColor", "warning"),
    ("_onWarningColor", "onWarning"),
    ("_successColor", "success"),
    ("_onSuccessColor", "onSuccess"),
    ("_infoColor", "info"),
    ("_onInfoColor", "onInfo"),
]

COLOR = re.compile(r"^const Color (_\w+) = Color\(0x([0-9A-Fa-f]{8})\);", re.M)


def css(argb: str) -> str:
    a = int(argb[0:2], 16)
    rgb = argb[2:].lower()
    return f"#{rgb}" if a == 255 else f"#{rgb}{argb[0:2].lower()}"


def main() -> None:
    root = Path(sys.argv[1])
    out = [
        "/**",
        " * NeoStation's 14 built-in themes, generated from the source's `lib/themes/*_theme.dart` by",
        " * `docs/themes/neostation/reference/extract-palettes.py`. Do not edit by hand.",
        " */",
        "import type { NeoPalette } from './palette'",
        "",
        "export const PALETTES = {",
    ]
    for tid, name in THEMES:
        src = (root / f"{tid}_theme.dart").read_text()
        colors = dict(COLOR.findall(src))
        missing = [d for d, _ in KEYS if d not in colors]
        if missing:
            raise SystemExit(f"{tid}: missing {missing}")
        tier = re.search(r"CornerRadii\.(\w+)\(\)", src).group(1)
        dark = "ColorScheme.dark(" in src
        out.append(f"  {tid}: {{")
        out.append(f"    id: '{tid}',")
        out.append(f"    name: '{name}',")
        out.append(f"    dark: {'true' if dark else 'false'},")
        out.append(f"    radius: '{tier}',")
        for dart, key in KEYS:
            out.append(f"    {key}: '{css(colors[dart])}',")
        out.append("  },")
    out.append("} as const satisfies Record<string, NeoPalette>")
    out.append("")
    out.append("export type ThemeId = keyof typeof PALETTES")
    print("\n".join(out))


if __name__ == "__main__":
    main()
