# MenuPanel

A modal settings menu over a dimmed screen.

## Entries

```ts
| { kind: 'group'; key; label }
| { kind: 'row';   key; label; icon?; value?; toggle?; on?; button? }
```

A discriminated union rather than an open shape: a settings menu is a closed set of control
types, and leaving it open invites a row no renderer knows how to draw.

Group headers are **not cursor stops**. `selectedIndex` counts rows only, which is what the
sources do - stopping on a heading you cannot activate reads as a broken cursor.

## Drawn over, not instead of

The menu sits above whatever view was showing, with the list still visible through the shade. It
stays obvious what the menu is a menu *of*. Which view that is belongs to the screen, not to this
widget: pass it as data rather than tracking navigation history.

## Sized to whole entries

`fitMenu` takes as many entries as fit in `maxHeight` and sizes the panel to exactly those. The
engines scroll their menus; a mockup shows a fixed window instead, and a row sliced through the
middle reads as a rendering fault rather than as "there is more below".

## Colours

`MenuColors` names every colour the panel draws with, including three that are easy to leave
hardcoded and then cannot be themed: `valueFg` for a row's current value - themes accent this
rather than muting it - and `buttonBorder` / `buttonSelectedBg` / `buttonSelectedFg` for a
bordered button row. Some of those are deliberately scheme-independent in a source; that is the
theme's decision to state, not this widget's to assume.

## Icons are masks

Row icons take the theme's foreground colour and invert on the selected row. An `<img>` cannot
be tinted, so they are drawn as masks over a solid fill.

## Fallback

Without masking the icons render as plain images in their own colour. The inversion is lost; the
row stays readable.

## Related

- [ListRow](ListRow.md) - the non-modal equivalent
