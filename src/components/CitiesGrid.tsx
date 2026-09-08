"use client";

/* Cities index — Figma 36385:291662.

   The content column is 869px wide inside the 1512 frame (322px left inset).
   Grid: three 275px columns on a 297px step → a 22px gutter, rows on the same
   22px step (869 = 275·3 + 22·2). Filter chips sit 40px above the first row.

   Picking a mood re-sorts rather than unmounts: the matching cities gather at
   the front of the grid and the rest fall in behind them, dimmed. Nothing ever
   leaves the DOM, so every card keeps its own view state and the reflow is one
   `layout` glide instead of a mount/unmount flash. */

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { CITY_INFO, type Mood } from "./cityData";
import CityCard, { type Placement } from "./CityCard";
import ViewSwitcher, { type CityView } from "./ViewSwitcher";

const EASE = [0.22, 1, 0.36, 1] as const;

/* Card order as laid out in Figma, left→right then down. This is deliberately
   its own order — CITY_INFO's order is locked to the landmark strip. */
const ORDER = [
  "coimbatore",
  "chennai",
  "dehradun",
  "delhi",
  "hyderabad",
  "kochi",
  "mangalore",
  "mumbai",
] as const;

/* Landmark placement per card, read off each instance node inside its 267×164
   well (36385:291687, …291722, …291757, …291793, …291828, …291863, …291899,
   …291934). Height follows from the 376:406 landmark ratio. */
const PLACEMENT: Record<string, Placement> = {
  coimbatore: { w: 181, x: 43, y: -31 },
  chennai: { w: 148, x: 60, y: 8 },
  dehradun: { w: 129, x: 69, y: 36 },
  delhi: { w: 115, x: 76, y: 40 },
  hyderabad: { w: 158.5, x: 55, y: 8 },
  kochi: { w: 147, x: 60, y: 0 },
  mangalore: { w: 170, x: 49, y: -29 },
  mumbai: { w: 151, x: 58, y: -9 },
};

/* Filter chips — 36385:291668. `moods: null` is the "Everything" pass-through;
   a chip matches a city when the city carries any of the chip's moods. */
const FILTERS: { label: string; moods: Mood[] | null }[] = [
  { label: "Everything", moods: null },
  { label: "Somewhere quiet", moods: ["Quiet", "Slow"] },
  { label: "On the water", moods: ["Coastal"] },
  { label: "Full volume", moods: ["Loud"] },
  { label: "Green + Cool", moods: ["Green", "Cool"] },
  { label: "Old Stones", moods: ["Historic"] },
  { label: "Here to eat", moods: ["Food"] },
];

const CHIP =
  "relative flex shrink-0 items-center whitespace-nowrap cursor-pointer rounded-[123px] px-[15px] py-[12px] text-[14px] min-h-[44px] sm:px-[18px] lg:min-h-0 font-light tracking-[-0.42px] shadow-[0_2px_13.9px_0_rgba(0,0,0,0.02)] outline-none transition-[background-color,border-color,color,box-shadow,transform] duration-200 ease-out active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-green-500/60";

export default function CitiesGrid() {
  const [active, setActive] = useState(0);

  /* Page-level view switcher (36385:291974) sets the view for the whole grid;
     a card's own switcher overrides just that card. Flipping the page switcher
     clears the overrides, so it always wins when you reach for it. */
  const [view, setView] = useState<CityView>("illustration");
  const [overrides, setOverrides] = useState<Record<string, CityView>>({});
  const setPageView = (next: CityView) => {
    setView(next);
    setOverrides({});
  };

  /* Coming back from a detail page: put the grid back where it was and skip the
     reveal, so Go Back reads as a return rather than a fresh load. Go Back is a
     push, not a history pop, so the browser restores nothing for us. Guarded by
     a ref because the effect runs twice under StrictMode and the key is
     one-shot. */
  const restored = useRef(false);
  const [returning, setReturning] = useState(false);
  useLayoutEffect(() => {
    if (restored.current) return;
    restored.current = true;

    let y: number | null = null;
    try {
      /* Both keys are cleared on every mount, so a stored offset can never
         outlive the one Go Back it was written for. */
      const raw = sessionStorage.getItem("cities-scroll");
      const viaGoBack = sessionStorage.getItem("cities-return");
      sessionStorage.removeItem("cities-scroll");
      sessionStorage.removeItem("cities-return");
      if (raw !== null && viaGoBack) y = Number(raw);
    } catch {
      /* storage unavailable — ordinary entrance */
    }
    if (y === null || Number.isNaN(y)) return;

    setReturning(true);

    /* Re-apply over a few frames rather than once: the App Router resets scroll
       to the top *after* this effect, and the grid is still settling, so a
       single scrollTo here gets thrown away. Bail the moment the reader takes
       over. */
    const target = y;
    let frames = 0;
    let cancelled = false;
    const stop = () => {
      cancelled = true;
    };
    window.addEventListener("wheel", stop, { once: true, passive: true });
    window.addEventListener("touchstart", stop, { once: true, passive: true });

    const apply = () => {
      if (cancelled) return;
      window.scrollTo(0, target);
      if (++frames < 8) requestAnimationFrame(apply);
    };
    requestAnimationFrame(apply);

    return () => {
      cancelled = true;
      window.removeEventListener("wheel", stop);
      window.removeEventListener("touchstart", stop);
    };
  }, []);

  const cards = useMemo(
    () =>
      ORDER.map((slug) => {
        const city = CITY_INFO.find((c) => c.slug === slug);
        if (!city)
          throw new Error(`cities index: no CITY_INFO entry for "${slug}"`);
        return city;
      }),
    [],
  );

  /* On narrow screens the chip row scrolls; keep the chosen one in view. */
  const chipsRef = useRef<HTMLDivElement>(null);
  const selectFilter = (i: number) => {
    setActive(i);
    const el = chipsRef.current?.children[i] as HTMLElement | undefined;
    el?.scrollIntoView({
      behavior: "smooth",
      inline: "nearest",
      block: "nearest",
    });
  };

  const filter = FILTERS[active];
  const matches = (moods: Mood[]) =>
    filter.moods === null || filter.moods.some((m) => moods.includes(m));

  const count = cards.filter((c) => matches(c.moods)).length;

  /* Matching cities first, the rest behind them — both groups keeping their
     Figma order, which a stable sort gives us for free. `index` stays the
     card's ORDER position so the entrance stagger and image `priority` don't
     shuffle with the filter. */
  const ordered = useMemo(
    () =>
      cards
        .map((city, index) => ({ city, index }))
        .sort(
          (a, b) =>
            Number(matches(b.city.moods)) - Number(matches(a.city.moods)),
        ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cards, active],
  );

  return (
    <section className="relative z-10 mx-auto w-full max-w-[917px] px-4 sm:px-6 lg:max-w-[869px] lg:px-0">
      {/* Heading — 36385:291664. 48px/60 with the centre-weighted grey gradient
          the footer wordmark also uses. */}
      <motion.div
        initial={{ y: 18, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.75, ease: EASE, delay: 0.15 }}
        className="flex flex-col items-center gap-[12px] text-center"
      >
        {/* the two-line break is part of the composition, so it is explicit
            rather than left to the 327px measure to find at 48px only */}
        <h1 className="bg-gradient-to-r from-[#939393] via-[#2d2d2d] to-[#939393] bg-clip-text text-[clamp(34px,5.2vw,48px)] font-normal leading-[1.25] tracking-[-0.03em] text-transparent">
          Eight Cities,
          <br />
          Eight Moods.
        </h1>
        <p className="max-w-[390px] text-[16px] font-light leading-[22px] tracking-[-0.32px] text-[#919191]">
          Not ranked, not sorted by popularity. Pick the feeling you&rsquo;re
          after and we&rsquo;ll narrow the map for you.
        </p>
      </motion.div>

      {/* Toolbar — the chips and the view switcher share one row below xl, and
          it sticks under the navbar while you scroll a grid that runs to ~3000px
          on a phone. At xl the switcher moves out to the Figma rail beside the
          grid and this reverts to a plain static row. */}
      <motion.div
        initial={{ y: 14, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: EASE, delay: 0.3 }}
        className="sticky top-[84px] z-20 -mx-4 mt-[clamp(28px,3.5vw,40px)] flex items-center gap-3 border-b border-hairline/70 bg-background/85 px-4 py-3 backdrop-blur-md sm:-mx-6 sm:top-[116px] sm:px-6 lg:static lg:mx-0 lg:border-0 lg:bg-transparent lg:px-0 lg:py-0 lg:backdrop-blur-none"
      >
        <div
          ref={chipsRef}
          role="tablist"
          aria-label="Filter cities by mood"
          className="flex min-w-0 flex-1 flex-nowrap gap-[10px] overflow-x-auto [-ms-overflow-style:none] [mask-image:linear-gradient(to_right,#000_0,#000_calc(100%-40px),transparent_100%)] [scrollbar-width:none] sm:gap-[14px] xl:overflow-visible xl:[mask-image:none] [&::-webkit-scrollbar]:hidden"
        >
          {FILTERS.map((f, i) => {
            const on = i === active;
            return (
              <button
                key={f.label}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => selectFilter(i)}
                className={`${CHIP} ${
                  on
                    ? "border border-white bg-green-ink text-white hover:bg-[#2a4520] hover:shadow-[0_2px_10px_0_rgba(26,51,15,0.18)]"
                    : "border-[0.5px] border-white bg-white/56 text-[#303030] hover:border-hairline hover:bg-white hover:text-green-ink hover:shadow-[0_2px_10px_0_rgba(0,0,0,0.05)]"
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        {/* horizontal here; the xl rail below carries the vertical one */}
        <div className="shrink-0 xl:hidden">
          <ViewSwitcher
            value={view}
            onChange={setPageView}
            className="flex-row"
            layoutId="cities-view-toolbar"
          />
        </div>
      </motion.div>

      {/* Cards — 22px gutters, 275px columns. `relative` so the view-switcher
          rail can hang off the column's right edge. */}
      <div className="relative mt-[clamp(20px,3.5vw,40px)]">
        {/* Figma puts the switcher at x=1373.78 of the 1512 frame — 182.78px
            right of the 869 column and 4px below the first card row. Past the
            width where that gap still fits, it tucks in against the viewport
            edge; below xl it sits above the grid, right-aligned. One instance
            only: ViewSwitcher's `layoutId` pill can't be mounted twice. */}
        {/* The rail is a full-height column beside the grid (inset-y-0) so the
            switcher can `sticky` inside it: it starts at the Figma offset
            (4px below the first card row), rides down with the cards, and
            scrolls away only when the grid itself does. */}
        <div className="pointer-events-none hidden xl:absolute xl:inset-y-0 xl:left-full xl:ml-[min(182.78px,calc((100vw-869px)/2-49.78px))] xl:block">
          <div className="pointer-events-auto sticky top-[140px] mt-[4px]">
            <ViewSwitcher
              value={view}
              onChange={setPageView}
              className="flex-col"
              layoutId="cities-view-rail"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 sm:gap-[22px] lg:grid-cols-3 lg:justify-items-start">
          {ordered.map(({ city, index }) => (
            <CityCard
              key={city.slug}
              city={city}
              placement={PLACEMENT[city.slug]}
              dimmed={!matches(city.moods)}
              index={index}
              instant={returning}
              view={overrides[city.slug] ?? view}
              onViewChange={(next) =>
                setOverrides((o) => ({ ...o, [city.slug]: next }))
              }
            />
          ))}
        </div>
      </div>

      <p aria-live="polite" className="sr-only">
        {count} {count === 1 ? "city" : "cities"} match {filter.label}.
      </p>
    </section>
  );
}
