# GlassPanel

A frosted stadium that samples the moving background beneath it. Vitro Launcher's entire chrome is
made of these: the status pill, the nav pill, and the backing of every focused settings row.

## Props

| Prop | Meaning |
| --- | --- |
| `box` | Resolved pixels. Omit to fill the parent, which the nav pill and settings rows do. |
| `shape` | `stadium` (default) is a full-height pill; `rounded` takes an explicit `radius`. |
| `radius` | Corner radius for `rounded`. Defaults to a fifth of the short edge. |
| `light` | Dark-on-light, which changes the shadow and the solid fill. |
| `transparent` | The launcher's own Transparency setting. |
| `inkRgb` | `--fg-rgb`, for the outline the solid variant draws. |

## Two ways to stop being glass

These are different and the distinction is the interesting part of the widget.

**`transparent={false}`** is the user's own choice. Vitro ships a Transparency setting, and the
look for it - a gray gradient stadium with a hairline outline - is authored in the launcher's own
stylesheet. Turning it off is a correct rendering of a configured app, not a degradation.

**Fallback render mode** is the renderer saying it has no `backdrop-filter` to give. It borrows the
same solid look, which makes this the happiest kind of fallback: designed upstream by the app's own
author rather than invented here to fill a gap.

Both land on the same pixels, so a screenshot cannot tell them apart - but the reasons are not
interchangeable, and a renderer that implements this widget needs to honour the first even when it
can do the second.

## Why it is a widget rather than a class

The blur is the only web-only capability in this theme, and confining it to one component means
the fallback is one branch in one file rather than a `.no-transparency` rule threaded through
every piece of chrome. That was how the original did it, and it is why the setting and the
capability were impossible to tell apart there.
