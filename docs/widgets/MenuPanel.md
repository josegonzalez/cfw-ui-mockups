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
stays obvious what the menu is a menu *of*.

## Icons are masks

Row icons take the theme's foreground colour and invert on the selected row. An `<img>` cannot
be tinted, so they are drawn as masks over a solid fill.

## Fallback

Without masking the icons render as plain images in their own colour. The inversion is lost; the
row stays readable.

## Related

- [ListRow](ListRow.md) - the non-modal equivalent
