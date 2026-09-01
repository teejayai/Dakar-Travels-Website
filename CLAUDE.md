# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev            # dev server (Turbopack) on :3000
npm run build          # production build — also the real typecheck gate
npm start              # serve the production build
npm run lint           # eslint (flat config, eslint-config-next)
npx tsc --noEmit       # typecheck without building
```

There is no test suite. Verify visually instead: build, `npx next start -p 3100`, and drive the page with Playwright. **Prefer a production build over `next dev` for screenshots** — the dev server has been observed full-reloading in a loop after the project directory moved, producing half-rendered captures. `rm -rf .next` if dev misbehaves.

## Architecture

A Next.js 16 App Router site: a landing page with a horizontally-scrolling strip of city landmarks, a `/cities` index of mood-filterable cards, and a statically-generated detail page per city. React 19, framer-motion, Tailwind v4. Three routes; nearly all the complexity is in the transitions.

### The two city lists must stay in sync

- `src/components/cities.ts` — `CITIES: { name, src }[]`, order mirrors the Figma strip left→right. Client-side only (strip + hero search). **No slug field**; slugs are derived as `name.toLowerCase()`.
- `src/components/cityData.ts` — `CITY_INFO: CityInfo[]` with the full record (`slug`, facts, `description`, optional `video`) plus `getCity(slug)`.

Contract: `CITIES[i].name.toLowerCase()` must equal `CITY_INFO[i].slug`, and `src` is duplicated across both. Break it and navigation 404s while the reverse-zoom `findIndex` silently returns -1.

Adding a city means editing both files **plus** the cities index: give it `moods` and `blurb` on `CityInfo` (the `Mood` union makes a typo a build error), and add its slug to `ORDER` and `PLACEMENT` in `CitiesGrid.tsx` — a slug missing from `ORDER` just won't render, and one missing from `PLACEMENT` throws.

### Shared-element zoom (the non-obvious part)

Clicking a landmark plays a FLIP transition into the detail hero, and Go Back plays it in reverse. Three `sessionStorage` keys carry the handoff:

| Key | Written by | Read by |
| --- | --- | --- |
| `landmark-zoom` | `LandmarkStrip` card `onClick` | `CityDetail` `useLayoutEffect` (reads, then removes) |
| `landmark-zoom-back` | `CityDetail` Go Back `<Link onClick>` | `consumeReturnState()` in `returnState.ts` |
| `strip-scroll` | `LandmarkStrip` card `onClick` | `LandmarkStrip` on mount, to restore scroll position |
| `city-origin` | `LandmarkStrip` card / `CityCard` `onClick` | `CityDetail` — the route Go Back returns to |
| `city-view` | `LandmarkStrip` card / `CityCard` `onClick` | `CityDetail`, to open on the view the card was showing |
| `cities-scroll` | `CityCard` `onClick` | `CitiesGrid` on mount |
| `cities-return` | `CityDetail` Go Back, only when `origin === "/cities"` | `CitiesGrid` on mount |

**Every one of these is one-shot, and that is load-bearing.** A payload left in
storage fires on some unrelated later navigation. Two guards exist because of it:
`landmark-zoom-back` is written **only** when Go Back is actually heading to `/`
(the strip is the only consumer), and the scroll restore needs `cities-return`
*and* `cities-scroll` — `CitiesGrid` clears both on every mount, so an offset
stored by a card click can never outlive the one Go Back it was written for.

Payload is a `getBoundingClientRect()` snapshot: `{ slug, x, y, w, h }`. The receiver measures its own target box and derives `s = from.w / to.width` plus centre deltas, then animates `initial` → identity.

Two things that look like bugs but are load-bearing:

- **`returnState.ts` is a one-shot channel with a 3s module-level cache.** Child effects (`LandmarkStrip`) run before the parent (`page.tsx`), so whoever reads first clears storage; the cache lets later consumers still agree that "we are returning" within the same paint.
- **`consumed` / `backConsumed` refs** guard against StrictMode's double effect run, which would otherwise wipe the payload before it is used. The `flip` tri-state matters too: `undefined` = not yet measured (rendered at `opacity: 0` to avoid a flash), `null` = no handoff, object = animate.

`CityDetail`'s `heroBoxRef` wraps a static box that is **never transformed** — it is the measurement anchor. Transforms go on an inner `motion.div`.

**Both heroes are gated on `ready` (`flip !== undefined`), not just the landmark.**
`animate` is not applied to the pre-hydration style, so a hero carrying only
`animate={{ opacity: 0 }}` paints once at full opacity before animating away —
which is exactly what made the video block flash a dark plate through every
zoom-in. `ready` holds both at 0 until the layout effect has read the handoff,
and `layout` on the wrapper waits too or the first commit animates the wrapper's
height from the illustration's to the video's. `CityVideo` has no background
colour for the same reason: there must be nothing dark to flash.

### Cities index (`/cities`)

`CitiesGrid` → `CityCard`, from Figma `36385:291662`. The content column is a
true 869px at `lg` (275·3 + 22·2), so it carries `lg:px-0` — horizontal padding
there would shrink the cards below their 275px spec width.

Responsive shape (the Figma frame only specifies the 1512 desktop case):

- **Cards fill their cell until `lg`**, where the 275px spec width kicks in.
  Phones get one column capped at 460px so a wide viewport does not stretch a
  card; `sm`/`md` get two that fill. The landmark placements are percentages of
  the well, so the art stays proportional at every width (verified: 0.678 /
  −0.189 / 1.192 of the well at 390, 768 and 1280 alike).
- **Below `xl` the chips and the view switcher share one sticky toolbar** that
  parks under the navbar (`top-[84px]`, `sm:top-[116px]` — tuned so there is no
  seam of scrolling content between the two bars). At `xl` it goes static and
  the switcher moves out to the Figma rail.
- **The card's mini switcher scales for touch below `lg`** — a 26px button in a
  30px pill with a 38px hit area, snapping back to Figma's 16px-in-18px at `lg`.
- **Two `ViewSwitcher` instances are mounted**, toolbar and rail, with only one
  ever visible. They need **different `layoutId`s** or framer tries to animate
  the pill between them. `ViewSwitcher`'s base class deliberately sets no flex
  direction — each caller passes `flex-row` or `flex-col`.
- The chips scroll with a right-edge mask until `xl`, not `lg`: the toolbar
  switcher costs ~78px, so they still overflow the 869px column at `lg`.

- **`ORDER` is deliberately its own list.** It is the Figma left→right card order, which is *not* `CITY_INFO`'s order (that one is locked to the landmark strip).
- **`PLACEMENT`** is each landmark instance's box inside its 267×164 well, read off the Figma node. All eight share the landmarks' native 376:406 ratio, so a width is enough.
- **The baseline fade is a committed export**, `public/landmarks/baseline-fade.svg` (Ellipse 42 — a 342×83 white oval with 34.7px of Gaussian blur). A hand-written CSS `filter: blur()` equivalent renders visibly weaker, so don't swap it back. Its canvas carries 34.7px of bleed on every side, which is why the box is inset by that much.
- **Filtering dims rather than unmounts**, so the grid never reflows between moods — same idea as the strip's search. The entrance (`whileInView`) and the dim (`animate`) live on **two nested elements on purpose**: on one element the in-view variant wins and the dim silently never lands.
- **Two switchers, one component.** The page-level vertical one (`36385:291974`) is `ViewSwitcher` reused verbatim, hanging off the column's right edge in a rail (Figma puts it at x=1373.78 of the 1512 frame, 4px below the first card row; the `min()` on its margin tucks it in rather than overflowing on narrower screens). It sets the view for the whole grid; each card's own 36×18 switcher overrides just that card, and flipping the page one clears the overrides so it always wins. Render **one** `ViewSwitcher` only — its `layoutId` pill cannot be mounted twice.
- Cards follow the same rule as `CityVideo` — a `<video>` is only created once motion view is opened — **and additionally gate on `useInView`**. The page switcher flips all eight at once, which without that gate pulls ~32 MB and decodes eight 1440p clips at the same time; with it, a phone fetches ~3 and off-screen cards pause. Do not drop the in-view check to "simplify" the play effect.

### City detail views

`CityDetail` holds a `view` state of `"illustration" | "motion"`, driven by `ViewSwitcher`. Both heroes stay mounted in the same cell and cross-fade; the inactive one is absolutely positioned and `inert`. `SWAP` is the single curve shared by the cross-fade, the wrapper's `layout` height animation, and the content column shift — keep them on one transition or the page jumps.

**Both hero hazes are sized as a share of their hero, not in fixed px.** They
were transcribed from the 1512 frame as 200px (video) and 260px (landmark) tall
— which is right at that width and covers the *entire* hero on a phone, where
the video block is ~150px and the landmark ~295px. They are now `h-[47%]` /
`h-[44%]` of their own box with `blur(clamp(16px,3.3vw,50px))`, which reproduces
the desktop values exactly (200px and 262px at 1512) while staying a
bottom-edge fade everywhere else. The landmark's haze lives *inside* `heroBoxRef`
and is absolutely positioned, so it does not affect the box the FLIP measures.

`CityVideo` only creates its `<video>` element once motion view is first opened (`requested` state) and pauses on exit. Do not make it eager: the block is always mounted for the cross-fade, so an eager `autoPlay` streams megabytes to visitors who are looking at the illustration.

### Videos

~10s loops in `public/videos/<slug>.mp4`, committed to the repo (a Vercel Blob setup was tried and deliberately reverted — it bills separately for storage and egress, while `/public` rides existing plan bandwidth). Encode with the recipe in the comment on `CityInfo.video`:

```bash
ffmpeg -ss 2 -t 10 -i <clip> -an -vf scale=1440:-2 -c:v libx264 -preset slow \
  -crf 22 -pix_fmt yuv420p -movflags +faststart public/videos/<slug>.mp4
```

~3–5 MB each. Audio is stripped (the hero is muted); 1440p keeps retina headroom for the ~1000px block; `+faststart` lets playback begin mid-download. Cities without a `video` fall back to a mock frame.

## Conventions

- **Figma is the source of truth, and node ids are cited in comments** (`580:3915` strip geometry, `648:9831` hero mask, `36350:289714` video block). When changing layout, pull the node with the Figma MCP rather than eyeballing it. Specs are transcribed as exact pixel values, often as ratios of the 1512px frame so they scale.
- **Design tokens live in `src/app/globals.css`** — raw Figma hex in `:root`, mapped through `@theme inline` to `--color-*`. That mapping is what makes `text-headline`, `text-muted`, `text-green-ink`, `border-hairline` valid utilities. Tailwind v4, no `tailwind.config.js`. Non-token gradients are inline `style` objects.
- **`DetailIcons.tsx` recomposes layered Figma exports** from `public/icons/detail/` with absolutely-positioned plain `<img>` tags and percentage insets, straight from Figma's generated output. It looks machine-written because it is — don't "clean it up" into single SVGs; the layering is the artwork.
- `EASE = [0.22, 1, 0.36, 1]` is redeclared per file rather than shared. `rise(delay)` in `CityDetail` is the standard entrance, spread as `{...rise(0.3)}` with delays laddering 0.15 → 0.6.
- `CARD` in `CityDetail` is the glass panel class every content section composes with.
- **Mobile Safari zooms the page on input focus below 16px** — the hero search input's base font size must stay `text-[16px]`; only change it at `sm:` and up.
- `LandmarkStrip` runs a hand-rolled rAF scroller (no scroll-snap): wheel, pointer-drag with fling, and an `onClickCapture` that swallows the click when a drag moved. Search filtering dims non-matches and glides the matching group to centre.
- `next.config.ts` enables `dangerouslyAllowSVG` with a CSP sandbox because landmarks are SVGs served through `next/image`.
- The `prefers-reduced-motion` block in `globals.css` clamps CSS animations only — framer-motion JS animations are unaffected by it.

## Repo notes

The project lives at `/Users/apple/Projects/Dakar Travels Website`. Deploys to Vercel (project `dakar-travels`); remote is `github.com/teejayai/Dakar-Travels-Website`.
