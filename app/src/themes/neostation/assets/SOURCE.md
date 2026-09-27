# Where these came from

`gamepad/`, `icons/`, `logos/`, `emulators/` and `brand/` are copied unchanged from
[misobadev/neostation-frontend](https://github.com/misobadev/neostation-frontend) at `d9bece5`,
`assets/images/`, under that repo's GPLv3 licence (`LICENSE-neostation.md`).

`fonts/Anta-Regular.ttf` is Anta from [google/fonts](https://github.com/google/fonts) `ofl/anta`,
under the SIL Open Font License (`fonts/OFL.txt`). NeoStation fetches it at runtime through
`google_fonts`, so it is not in the app's repo.

`fonts/MaterialSymbols{Rounded,Outlined}-subset.woff2` are Google's Material Symbols variable fonts
([google/material-design-icons](https://github.com/google/material-design-icons) `variablefont/`,
Apache License 2.0), pinned at FILL 1, weight 400, grade 0, optical size 24 and cut down to the 191
glyphs NeoStation's source names, by `docs/themes/neostation/reference/subset-symbols.py`.
