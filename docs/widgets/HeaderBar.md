# HeaderBar

A screen header: title on the left, something on the right, an optional rule beneath.

## Props

| Prop | Type | Notes |
| --- | --- | --- |
| `box` | `Box` | Resolved device pixels. The rule is drawn directly below it |
| `title` | `string` | |
| `titleAccent` | `string?` | A second half of the title in the accent colour |
| `leading` | `string?` | A glyph before the title, typically a back chevron |
| `titleFont` | `number` | |
| `color`, `accentColor` | `string` | |
| `bold` | `boolean?` | Defaults to true |
| `paddingX` | `number?` | |
| `ruleHeight`, `ruleColor`, `ruleInsetX` | | Omit `ruleHeight` for no rule |
| `right` | `ReactNode?` | A named slot |

## Why `titleAccent` is a prop

A wordmark split across two colours - "Example" in white, "OS" in the accent - is common enough
to be worth supporting, and the alternative is accepting markup as a prop. A typed string keeps
the shape translatable: a template system can model two runs of text with different colours, but
not arbitrary markup.

## The `right` slot

`right` is typed `ReactNode`, which is a named slot rather than a props spread. A slot is a child
widget subtree, which a template system models as a child node list. Typically it holds a
[Clock](Clock.md), a [StatusIndicators](StatusIndicators.md) cluster, or a plain count.

## The rule

Drawn as a separate absolutely-positioned element immediately below `box`, inset from both edges
by `ruleInsetX`. It is not a border, because the inset would then need the header to be padded
and that would move the title.

## Overflow

A title longer than the header ellipsises rather than pushing the right-hand slot off screen.

## Related

- [Clock](Clock.md), [StatusIndicators](StatusIndicators.md) - common `right` contents
