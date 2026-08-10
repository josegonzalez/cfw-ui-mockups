# The legacy archive

`legacy/` holds the original vanilla-JS mockups the React application was ported from: 95 HTML
screens across four sets, their theme engines, their stylesheets, the shared device frame and
navigation helper, and the original gallery.

It is kept because it renders. Every page still opens and boots exactly as it did before the
move, which makes it a live before-and-after reference rather than a memory of one.

## What is in it

```
legacy/
  index.html            the original hand-maintained gallery
  shared/
    device-frame.css    the bezel, screen clip and button cluster
    nav.js              the shared focus helper, used by example-cfw only
  elementerial/         engine, stylesheets, assets, 36 screens across 4 devices
  playstation-x/        engine, stylesheet, assets, 48 screens across 4 devices
  vitrolauncher/        engine, stylesheet, assets, 8 screens across 2 devices
  example-cfw/          2 screens, the only set authored as plain markup
```

## Why the whole tree moved

Each set resolves its assets at runtime from `../assets/` relative to the screen, and each
screen loads `../../shared/device-frame.css`. Moving the theme directories and `shared/`
together into `legacy/` keeps every one of those relative paths correct, so not a single
reference needed rewriting. Verified: 742 resource references across 95 files all resolve, and
a representative screen from each set still boots with no console errors and no broken images.

The one exception was the gallery's link to the PlayStation X README, which moved to
`docs/themes/playstation-x.md`. That link was repointed.

## Assets are duplicated, not shared

`legacy/<set>/assets/` and `app/src/themes/<set>/assets/` are independent copies, about 14 MB
each way. This is deliberate. Sharing one copy would mean the archive depended on a path inside
the application, so any later reorganisation of the app would silently break the reference that
exists to validate it.

## Reference material moved out

Each set's `reference/` directory and its README are documentation, not archive, so they live
under `docs/`:

| Was | Now |
| --- | --- |
| `<set>/reference/` | `docs/themes/<set>/reference/` |
| `<set>/README.md` | `docs/themes/<set>.md` |

The porting-notes comment blocks inside the legacy HTML files still say `../reference/
source-notes.md`. Those are prose inside comments, not loaded resources, so nothing breaks -
but read them as pointing at `docs/themes/<set>/reference/source-notes.md`. They were left
alone rather than rewritten across 90 files, because the archive is more useful unmodified.

## Using it

Legacy screens are plain HTML and still open directly over `file://`, with the one caveat they
always had: they load Tailwind from a CDN for two body utility classes, so without network
access the page centring is off. Nothing else depends on it.

The dev server also serves them, which is what makes the Playwright fidelity gate a same-origin
comparison. `app/vite.config.ts` opens `fs.allow` to the repository root for exactly this
reason.

## When it can go

Once every screen has a React implementation whose visual diff against its legacy counterpart
is clean and reviewed, the archive has done its job. That decision is deliberately not being
made here.
