# Comparing views

Every static screen is tagged with what it is for and what it is built from, so the same view can
be lined up across sets - the idea behind the [Game UI Database](https://www.gameuidatabase.com/),
applied to handheld firmware. Not every set has every view, but where two do, the views page
puts them side by side.

## Where it lives

| Piece | File |
| --- | --- |
| The vocabulary | `app/src/themes/taxonomy.ts` |
| Each screen's tags | the theme's `manifest.ts`, as `types` and `elements` on every entry |
| Lookups over the tags | `app/src/themes/views.ts` |
| The views page | `app/src/gallery/ViewsPage.tsx`, at `#views`, `#views/type/<slug>` and `#views/element/<slug>` |
| A tile on it | `app/src/gallery/LazyStill.tsx` |

The views page has a sidebar of facets and a wall of tiles for the one picked. Each tile is the
screen's own route with motion settled, sound off and the bezel dropped, scaled down. It is the
same build the screen's page renders, so the two cannot drift. A tile mounts only when it scrolls
near the viewport, because the largest comparison holds dozens of full screens.

There are three other ways in:

- The landing page's "Compare by view" tab: a matrix of every set against every screen type,
  built by `coverage()` in `app/src/themes/views.ts`. A column header opens that type's
  comparison, and a filled cell opens the first screen of that type the comparison shows for
  that set. Its "Compare by UI element" link opens the views index for the element facet.
- The viewer bar's tag chips, which link each of a screen's types and elements to its comparison.
- The viewer bar's "Same view in" row, which jumps to the first screen of each other set that
  shares this screen's primary type, on the same device where that set has it.

## Tagging rules

- **Tag what is drawn.** Read the view's porting notes and its render code, not its title. A
  screen titled "Options" that changes settings is `settings`.
- **The first type is the primary one.** "Same view in" matches on it alone, so a settings page
  that happens to explain itself is still a settings page.
- **Every static screen has a type.** Elements may be empty: a game running with nothing drawn
  over it has no element the vocabulary names, and the nearest term would put it in a comparison
  it does not belong in.
- **A screen is tagged the same on every device.** Tags are keyed by screen slug, never by device.
- **A variant takes its screen's tags.** A palette or background variant is the same view in other
  colours. Add `appearance` only to a screen whose job is choosing how things look.
- **The live build carries no tags.** It is every screen at once (`LIVE_TAGS`).

## Screen types

What a screen is for.

| Slug | Label | Meaning |
| --- | --- | --- |
| `boot` | Boot | What draws before the menu does: splash, power-on, warnings |
| `home` | Home | The top-level menu the firmware returns to |
| `system-list` | System list | Choosing a console or platform |
| `game-list` | Game list | The games in one system, folder or view mode |
| `game-details` | Game details | One game: metadata, synopsis, artwork |
| `collection` | Collection | Favourites, recents, history and other curated lists |
| `search` | Search | Finding a game or file by name or filter |
| `settings` | Settings | Where options are changed |
| `network` | Network | Wi-Fi, Bluetooth and online services |
| `date-time` | Date and time | Setting the clock or calendar |
| `controls` | Controls | Button mapping and input settings |
| `appearance` | Appearance | Themes, palettes, colours and backgrounds |
| `achievements` | Achievements | Achievement lists, unlocks and accounts |
| `gameplay` | Gameplay | The game itself, with the firmware out of the way |
| `in-game-menu` | In-game menu | The menu drawn over a running game |
| `save-states` | Save states | Saving, loading and browsing save slots |
| `game-switcher` | Game switcher | Jumping between recently played games |
| `file-manager` | File manager | Files, memory cards and stored data |
| `media-player` | Media player | Music, images and text outside a game |
| `loading` | Loading | Launching a game, scanning or working |
| `empty-state` | Empty state | What shows when there is nothing to show |
| `setup` | Setup | First-run wizards and onboarding |
| `about` | About | System information, versions and credits |
| `help` | Help | Explanations of the firmware itself |
| `apps` | Apps | Tools, channels and programs that are not games |
| `messages` | Messages | Notes, letters and message boards |
| `overlay` | Overlay | A HUD drawn over another screen: volume, brightness |
| `power` | Power | Shutdown, sleep and battery |

## UI elements

What a screen is built from. These line up with the widget vocabulary in
[widgets/README.md](widgets/README.md) only loosely: an element is what a reader sees, while a
widget is how this repo draws it.

| Slug | Label | Meaning |
| --- | --- | --- |
| `list` | List | Rows of items in one column |
| `grid` | Grid | Items in rows and columns |
| `carousel` | Carousel | Items scrolling along one axis with the focus centred |
| `shelf` | Shelf | Physical-looking objects lined up to pick from |
| `tabs` | Tabs | Sibling pages switched with a strip of labels |
| `popup-menu` | Popup menu | A short menu over the screen it acts on |
| `dialog` | Dialog | A question that blocks until it is answered |
| `toast` | Toast | A brief notice that goes away on its own |
| `keyboard` | Keyboard | On-screen text entry |
| `hint-bar` | Hint bar | A legend of what each button does here |
| `status-bar` | Status bar | Clock, battery or connectivity indicators |
| `slider` | Slider | A value picked along a track |
| `toggle` | Toggle | An on or off switch |
| `stepper` | Stepper | A value changed in place, one step left or right |
| `progress-bar` | Progress bar | How far a task has got |
| `artwork-panel` | Artwork panel | Box art, screenshots or video for the focus |
| `page-indicator` | Page indicator | Dots or numbers showing the page |
| `text-block` | Text block | Body copy or a readout of values to read |
| `logo` | Logo | A wordmark or emblem as the subject of the screen |

## Adding a term

Add it to `SCREEN_TYPES` or `UI_ELEMENTS` with a label and a one-line meaning, add its row to the
table above, and tag at least one screen with it. `taxonomy.test.ts` fails on a term that is
unused or undocumented, so the vocabulary cannot grow a word nothing means. Prefer widening an
existing term's meaning over adding a near-synonym: the comparison only works if every set's
settings screen says `settings`.
