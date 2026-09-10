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

A Next.js 16 App Router site: a landing page with a horizontally-scrolling strip of city landmarks, a `/cities` index of mood-filterable cards, a statically-generated detail page per city, and an `/about` page. React 19, framer-motion, Tailwind v4. Four routes; nearly all the complexity is in the transitions.

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

### About us (`/about`)

`About` (Figma `36565:75440`), a plain scroll page between the shared `Navbar`
and `Footer` — the design's nav pill and 1424×433 footer band **are** those two
components, so nothing there is re-cut.

- **The illustration band is `SkyBand`, rebuilt from its layers** — Figma
  `36570:75642` is a two-variant component set (day `36570:75643` / evening
  `36570:75703`), and hovering the band cross-fades between them while the plane
  keeps flying. It shipped once as a single flat export; that cannot animate,
  because the plane is baked into the sky. So: both gradients in CSS (**the
  evening one has to stay an SVG** — Figma skews its gradient ellipse ~45° and
  `radial-gradient()` cannot say that), the design's own cloud rasters as image
  fills, and the plane as a transparent cutout.
- **The band is only a 1.9:1 letterbox at `lg`.** That ratio is a ~190px strip
  on a phone, so below `lg` it is `aspect-[5/4]` / `sm:aspect-[16/9]` and takes
  the page's own gutter (`px-4` / `sm:px-6`, from `About`) instead of running
  edge to edge. Every layer inside therefore keeps its own aspect rather than
  stretching with the box: the clouds are `object-cover`, and the plane is
  `object-contain` — a no-op at `lg`, where its box already *is* the art's
  2.966:1, and what keeps it undistorted and still centred on the frame's 58.7%
  of the band anywhere else. Do not add a fixed `height` back onto the plane.
- **The bottom edge is dissolved twice, and both are load-bearing.** The page's
  blurred `#fafafa` plate can only *cover* a hard edge — against the evening
  sky a 16px-blurred rectangle reads as a second edge of its own — so below `lg`
  `SkyBand` also fades its own sky to `--background`, and that gradient must
  reach the colour **before** the last pixel (`to-background to-[86%]`): landing
  on the edge still leaves the row above it darker, which is the step it was
  meant to remove. It is `lg:hidden`, because at the frame's width the plate is
  enough and the composition there is matched to Figma's render to 0.75/255.
  Measured: zero row-to-row delta across the join at 390, 768 and 1512, in both
  variants.
- The band's **top corners carry a 20px radius**; at `lg` the bottom stays
  square because that edge dissolves into the page, and below `lg` — where it
  sits in the gutter as a card — all four are rounded, which costs nothing since
  the sky is already `#fafafa` by the time it reaches them. The root box's
  `overflow-hidden` is what clips both skies and the plane to it.
- **The plane's two liveries live inside the one box that the loop moves.** The
  variants place the plane identically and only relight it, so the hover is a
  cross-fade of two stacked images — position is shared by construction and
  cannot drift, which is what "the plane stays in sync" means here. Do not
  animate the two planes separately.
- **The plane cutout was keyed, not exported.** Figma renders that group over
  the canvas' slate backdrop, so every export comes back opaque:
  `plane-day.webp` is that render with the flat backdrop keyed out and
  unpremultiplied, and `plane-evening.webp` carries the *day* matte (identical
  geometry). Composited back at `left:0 / top:295` it matches Figma's own band
  render to a mean 0.6/255 — that is how the placement was fixed, and how to
  re-check it if the asset is ever re-cut. The rebuilt day sky matches to 0.75.
- **The loop wraps off-screen.** `OFF_LEFT`/`OFF_RIGHT` are the first x where
  the plane *art* (9.6%–97% of its box, not the whole box) is fully outside the
  frame, so the reset is never visible; the first pass starts from `PARKED`, the
  position the Figma frame draws, so an arriving visitor gets a sky with a plane
  in it rather than an empty one. `useReducedMotion` parks it there instead.
- Do not try to rebuild the plane from the node's ~60 path SVGs: the frame's own
  PNG/SVG export comes back **blank** via MCP for the day *instance*, while the
  variant symbols and their groups render.
- The band's bottom edge is dissolved by `Rectangle 34624285` — a `#fafafa`
  plate (1890×413 at y=1067, `blur(37.8px)`) sized as a share of the band and
  painted above it but below the text, which is why Our Story starts flush with
  the band bottom (1156 → 1157) and still reads as a 60px gap.
- **Card geometry is transcribed as ratios of each 382px well**, not px: the
  baseline fade reuses `public/landmarks/baseline-fade.svg` (byte-identical to
  this frame's Ellipse 42 export), the team cards get the 660×209 version at
  `public/about/team-fade.svg`, and every fade box is inset by its own Gaussian
  bleed (34.7px / 65.14px) exactly as the strip's is.
- The 60px illustrations in `public/icons/about/` each carry **different**
  transparent bleed, so `WellIcon` takes a per-icon `[w,h,left,top]` leaf spec
  read off the node's insets — one shared size would crop them.
- **Hovering a value card is one `rest`/`hover` label**, set on a wrapper inside
  the article (the entrance owns the article's own `initial`, and the two would
  otherwise fight over it). The label reaches the number, the ground haze and
  the illustration through variant propagation, so nothing needs its own
  listener. `whileTap` gives touch the same beat. Each icon in `ICON_MOTION`
  moves as its subject would — the bike rolls, the balloon lifts, the boat rocks
  — on a `repeatType: "mirror"` loop, because a one-shot nudge reads as a glitch
  when the pointer rests. The 60px slot never moves: the leaf inside it does, so
  an icon can travel past its box without the well reflowing. Reduced motion
  keeps the lift and drops the loops.
- Portraits are colour originals greyed by `mix-blend-luminosity` over the
  well's white gradient, which is how the design does it; they are positioned by
  the photo box's own share of the well (card 3 is a much larger, higher crop).
- **Hovering a portrait opens a colour lens** (`PortraitReveal`, after
  entityq.com): a second, *unblended* copy of the same file — so no extra bytes
  — masked to a disc that follows the pointer, ringed by a hairline outline. The
  native cursor is left alone — the ring rides with it, it does not replace it. The disc is a share of
  the well (`78/382`), so it is the same size relative to the card at every
  width, and the mask's feather ends exactly where the ring is drawn. **The ring
  is a sibling of the masked photo, not a child** — inside it, the card's bottom
  dissolve would eat the cursor near the caption. `pointerType !== "mouse"`
  returns early: a tap would strand the lens.
- **The photographs dissolve; the ellipse only glows.** Ellipse 42 is
  reproduced exactly as the node specifies (`top 57.19%`, `2.069 × 1.116` of the
  well, Figma's own `stdDeviation 32.5722`) — but white paint, however soft,
  cannot hide a cut-out's edge: the shoulder silhouette stays legible under it,
  in Figma's own render too. So each portrait carries a `mask-image` that takes
  it to nothing between `FADE_FROM` and `FADE_TO` **of the well**, with the
  stops solved per card from the same `box` numbers (each photo sits in the well
  differently, so shared stops would land in the wrong place). That leaves no
  edge to cover. It reads ~+12/255 lighter than the node through the shoulder
  zone and matches it above 62% of the well; re-measure against `36565:75499`
  rather than adjusting by eye.

### Touch and tablet on `/about`

Every hover-only affordance on this page has a **second, explicit route** for
touch, gated on `useCoarsePointer()` from `src/components/useMediaQuery.ts`
(`(hover: none), (any-pointer: coarse)`). The hook is a `useSyncExternalStore`
`matchMedia` read whose **server snapshot is always `false`** — so the desktop
composition is the pre-hydration paint and anything behind the hook must be an
enhancement, never the only way to reach something.

- **Both touch controls are `IconSwitcher`** — the cities page's view switcher
  (`36339:288858`) generalised: the same 33.78px glass pill, 25.78px buttons and
  `layoutId` pill sliding between them, icons only. Geometry is transcribed
  there rather than imported from `ViewSwitcher`, which stays typed to
  `CityView` and owns the cities page; what is shared is the shape, in one file
  so the two cannot drift. Every instance is touch-only, so its 44px `::after`
  target has no `lg:` escape hatch. New 19.33px line icons in
  `public/icons/about/`: `sun` / `moon`, `monochrome` / `colour`.
- **`SkyBand` gets a sun ⇄ moon switcher** on coarse pointers; the mouse path is
  `onPointerEnter/Leave` filtered to `pointerType === "mouse"` so a stylus
  cannot leave the sky stuck at dusk. `role="img"` moved off the root onto an
  `sr-only` span — a `role="img"` container hides the switcher from assistive
  tech. Its inset is `bottom-[16%]`, a share of the band: the page's `#fafafa`
  dissolve plate covers the band from 86.3% down and a fixed inset washes out at
  tablet widths, where the band is twice as tall.
- **The plane loop is gated on `useInView`.** A 34s crossing running behind
  three screenfuls of cards is pure battery.
- **`PortraitReveal` cross-fades the whole portrait on touch** instead of the
  lens (a lens needs a pointer to be somewhere; a tap would strand it), driven
  by a mono ⇄ colour switcher in the well's top-left corner — top-left because
  the bottom of the well is the dissolve, and anything in it is washed out by
  Ellipse 42. Each card's switcher needs its **own** `layoutId` (keyed on the
  photo), or framer animates the pill between cards. The masked
  colour layer must be set to `maskImage: "none"` on coarse, **not** left
  `undefined`: dropping the key leaves whatever framer last committed, and
  pre-hydration that is the zero-radius disc, so the reveal silently does
  nothing.
- **The value-card icon loops run from `whileInView` on coarse pointers**, on
  the leaf only. The *card* never lifts on touch — three cards lifting and
  dropping as a phone scrolls reads as jitter.
- **`rise()` takes a `reduce` flag** and the page calls it as `enter(d)`. The
  `prefers-reduced-motion` block in `globals.css` clamps CSS animations only,
  and every entrance here is a framer one.

### Contact modal

`ContactModal` (Figma `36579:78597`) exports `ContactProvider` + `useContact()`;
the provider is mounted once in `app/layout.tsx`, so the navbar pill and the
About CTA open **one** dialog from any route and the page underneath keeps its
scroll.

- The frame is a 981px panel (415px details column, then a 514px form at
  `x=444, y=34`) with the 36×36 close button 10px off its right edge, over a
  `rgba(0,0,0,0.09)` scrim with a 5.45px backdrop blur. Verified: the panel
  renders 981×696 at (243,102) on the 1512 frame, and every element lands within
  1px of the node (the button 3px, from the "hoping" block being 2px taller).
- **The desktop composition starts at `min-[1080px]`, not `lg`.** Those absolute
  offsets need a full 981px panel; at 1024 the scrim's padding leaves 976 and
  the form is clipped. Below that everything stacks in flow.
- **Field headers are `#2e2e2e`, the panel title keeps the grey gradient**
  (`36586:78886` / `78894` / `78915` vs `78880`). Name and Email are real
  headers with a `#cbcbcb` hint line under them that the input borrows as its
  placeholder — an 82px block: header 41, 10, hint 21, 10, rule. `HEADER` sets
  no `leading`: each header passes the frame's own block height (41 / 32 / 38),
  because two `leading-*` utilities on one element is a cascade coin-flip and
  that silently cost 9px in the chips' position.
- **Destination chips are multi-select** — a set, not a radio group, which is
  why each chip carries `aria-pressed` rather than the group carrying a value.
  A new pick is folded back into `CITIES` order, so the shortlist reads in the
  strip's order rather than in click order.
- **A `<legend>` is not a flex item.** The destination group was a
  `fieldset`/`legend` and the chips rode 23px high because the legend sits
  outside the flex flow — it is a `role="group"` + `aria-labelledby` pair now.
- The details column reuses the footer's two brand blobs at this frame's
  positions; the 93px CSS blur is right because a Figma layer blur of X renders
  as `blur(X/2)` and these canvases bleed 185.5px.
**Three presentations, one dialog.** Below 640 it is a bottom sheet — slides
up, drag-to-dismiss via `useDragControls` started from its own header (the
header carries `touch-action: none`, everything else stays `auto`, or the drag
eats the form's scroll); 640–1079 a centred card; at 1080 the Figma
composition. Below 1080 **the form is `order-1` and the details column
`order-2`** — on a phone the details are a screenful you did not open the
dialog to read. The panel scrolls inside itself (one scroll container, so the
scrim never scrolls behind the sheet) and `min-[1080px]:contents` takes that box
back out of the layout so the absolute offsets still resolve against the panel.

Two things that look incidental:

- **A "Contact details" button in the sheet header** jumps the scroller to the
  details column (`el.offsetTop - scroller.offsetTop` — both are laid out
  against the panel, the positioned ancestor, so the difference is the scroll
  offset). It **retires when the column is on screen**, via `useInView` with no
  `root`: IntersectionObserver resolves through the ancestor clip chain, so the
  scroller hiding the column already reads as not intersecting — and at 1080
  the scroller is `display: contents` and would not be a legal root. On a
  tablet the details are already partly visible, so the button never appears.
- **The header's buttons `stopPropagation` on pointerdown**, or pressing one
  starts the sheet's drag.
- **The scroller needs an explicit `overflow-x-hidden`.** `overflow-y: auto`
  alone computes the other axis to `auto` too, and the details column's two
  blobs — which no longer clip — give the box an 85px-wider `scrollWidth`. That
  was the sheet drifting sideways while it scrolled.

- **The blobs are clipped by the panel, never by the details column.** A column
  that clips them draws a hard rectangular edge of blue across the middle of
  the dialog — visible on every tablet screenshot before this.
- **The scroll lock takes the body out of flow** (`position: fixed` at
  `-scrollY`), not just `overflow: hidden`, which iOS Safari rubber-bands
  straight through; the offset is restored by hand on unlock, which is why the
  focus hand-back passes `preventScroll: true`. Focus goes to the panel, never
  to the first input — an autofocused field throws the keyboard up over a
  dialog nobody has read yet.

- **Submitting swaps in a confirmation.** There is no backend to post to and the
  design does not draw a sent state; this is the smallest honest ending for a
  form. Wire it to a real endpoint before launch.

### City detail views

**The video block shares the content column's rails.** Both are
`max-w-[1004px]` with `px-4` / `sm:px-5` *inside* that width, so the clip's
edges land on the cards' edges at every viewport (verified: identical left and
right at 390, 768, 1512 and 1990). It was a 1000px box nested inside the
padding, i.e. 36px wider than the 964px the content actually gets — don't put a
max-width back on the inner box.

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
