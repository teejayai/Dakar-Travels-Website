"use client";

import Image from "next/image";
import Link from "next/link";
import { useLayoutEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ViewSwitcher, { type CityView } from "@/components/ViewSwitcher";
import CityVideo from "@/components/CityVideo";
import type { CityInfo } from "@/components/cityData";
import {
  MapIcon,
  FlowersIcon,
  EarthIcon,
  MoonIcon,
  LuggageIcon,
} from "@/components/DetailIcons";

const EASE = [0.22, 1, 0.36, 1] as const;

/* one shared curve for the illustration ⇄ video swap, so the hero, the page
   height and the content column all travel together */
const SWAP = { duration: 0.55, ease: EASE } as const;

const rise = (delay: number) => ({
  initial: { y: 24, opacity: 0 },
  animate: { y: 0, opacity: 1 },
  transition: { duration: 0.6, ease: EASE, delay },
});

/* Glass card per Figma: white/75, 11.45px backdrop blur, 0.5px white border */
const CARD =
  "rounded-[10px] border-[0.5px] border-white bg-white/75 backdrop-blur-[11.45px]";

function StatCard({
  title,
  icon,
  value,
  delay,
}: {
  title: string;
  icon: React.ReactNode;
  value: string;
  delay: number;
}) {
  return (
    <motion.div
      {...rise(delay)}
      className={`${CARD} flex flex-col gap-2.5 p-3 sm:gap-3 sm:p-4`}
    >
      <p className="text-[14px] font-normal leading-5 text-[#2d2d2d] sm:text-[16px]">
        {title}
      </p>
      <div className="flex min-h-[62px] flex-1 items-center rounded-[10px] bg-[#f8f8f8] px-1.5 py-2 sm:px-[11px]">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-[18px]">
          <span className="shrink-0 scale-[0.8] sm:scale-100">{icon}</span>
          <p className="line-clamp-2 min-w-[72px] flex-1 text-[11px] font-normal leading-[15px] tracking-[-0.2px] text-[#2d2d2d] sm:text-[16px] sm:leading-5 sm:tracking-normal">
            {value}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

type Flip = { dx: number; dy: number; s: number };

export default function CityDetail({ city }: { city: CityInfo }) {
  const mapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(
    `${city.name}, ${city.state}`,
  )}`;

  /* Shared-element zoom: if the home page stored the clicked landmark's rect,
     start the hero from that exact spot and glide it into place (FLIP).
     `undefined` = not measured yet, `null` = no handoff → default entrance. */
  const heroBoxRef = useRef<HTMLDivElement>(null);
  const [flip, setFlip] = useState<Flip | null | undefined>(undefined);
  const [view, setView] = useState<CityView>("illustration");
  /* Where this page was opened from, so Go Back returns to the actual source
     rather than always the landing page. */
  const [origin, setOrigin] = useState("/");
  // effect runs twice in dev (StrictMode) but storage can only be read once —
  // cache the first read so the second pass doesn't wipe it out
  const consumed = useRef<Flip | null | undefined>(undefined);

  useLayoutEffect(() => {
    if (consumed.current !== undefined) {
      setFlip(consumed.current);
      return;
    }
    let next: Flip | null = null;
    try {
      /* The card/landmark that was clicked hands over its view choice and the
         page it lives on. Read both before the first paint so the correct hero
         is the one that appears — no swap animation on mount. */
      const from = sessionStorage.getItem("city-origin");
      sessionStorage.removeItem("city-origin");
      if (from) setOrigin(from);

      const storedView = sessionStorage.getItem("city-view");
      sessionStorage.removeItem("city-view");
      if (storedView === "motion" || storedView === "illustration") {
        setView(storedView);
      }

      const raw = sessionStorage.getItem("landmark-zoom");
      sessionStorage.removeItem("landmark-zoom");
      if (raw) {
        const rect = JSON.parse(raw) as {
          slug: string;
          x: number;
          y: number;
          w: number;
          h: number;
        };
        const box = heroBoxRef.current;
        if (rect.slug === city.slug && box) {
          const to = box.getBoundingClientRect();
          next = {
            s: rect.w / to.width,
            dx: rect.x + rect.w / 2 - (to.x + to.width / 2),
            dy: rect.y + rect.h / 2 - (to.y + to.height / 2),
          };
        }
      }
    } catch {
      /* sessionStorage unavailable — fall back to default entrance */
    }
    consumed.current = next;
    setFlip(next);
  }, [city.slug]);

  /* nothing in the hero may paint until the handoff has been read */
  const ready = flip !== undefined;

  return (
    <main className="relative min-h-screen w-full overflow-x-clip bg-background">
      <Navbar />

      {/* Hero + content region. It exists so the view switcher's rail can span
          exactly this much of the page — the switcher should ride along while
          the hero and the cards are in view, then scroll away before the
          footer rather than hovering over it. */}
      <div className="relative">
        {/* View switcher — Figma puts it 104px in from the right edge of the
            1512 frame, 179px down (so 1304px of usable width between the
            rails). That is its resting spot; from there it sticks just clear
            of the navbar.

            From lg the rail spans this whole region, so it stays pinned all
            the way down the page — there is gutter either side of the 1004px
            content column for it to sit in. Below lg there is no gutter and a
            page-long rail parks the control right on top of the description
            text (measured: ~1750px² of overlap at 390), so that case is
            handled by the hero-scoped rail further down instead. */}
        <div className="pointer-events-none absolute inset-0 z-30 hidden lg:block">
          <div className="mx-auto h-full w-full max-w-[1304px] px-4">
            <div className="sticky top-[140px] mt-[179px] flex justify-end">
              <ViewSwitcher
                value={view}
                onChange={setView}
                className="pointer-events-auto flex-col"
                layoutId="detail-view-rail"
              />
            </div>
          </div>
        </div>

        {/* Hero stack — the two views live in the same cell and cross-fade; the
          wrapper animates its own height so everything below eases into place
          instead of jumping between the 595px landmark and the 426px video.

          `ready` gates BOTH heroes to opacity 0 until the layout effect has
          read the handoff. Without it the inactive hero paints once at full
          opacity before animating away — `animate` alone is not applied to the
          pre-hydration style, so the video block's dark box flashed through
          every zoom-in. `layout` also waits, or the first commit would animate
          the wrapper's height from the illustration's to the video's. */}
        <motion.div layout={ready} transition={SWAP} className="relative">
          {/* Below lg the rail is scoped to the hero: the switcher only ever
              changes the hero, so it rides along while that is on screen and
              scrolls away with it rather than following the reader down over
              the body text. */}
          <div className="pointer-events-none absolute inset-0 z-30 lg:hidden">
            <div className="mx-auto h-full w-full max-w-[1304px] px-6">
              <div className="sticky top-[100px] mt-[124px] flex justify-end">
                <ViewSwitcher
                  value={view}
                  onChange={setView}
                  className="pointer-events-auto flex-col"
                  layoutId="detail-view-hero"
                />
              </div>
            </div>
          </div>

          {/* Motion hero — Figma 36350:289714: 1000×426 video block, 179px down */}
          <motion.div
            initial={false}
            animate={{
              opacity: ready && view === "motion" ? 1 : 0,
              scale: view === "motion" ? 1 : 0.97,
            }}
            transition={SWAP}
            inert={!ready || view !== "motion"}
            /* Same rails as the content column below it — `max-w-[1004px]`
               with the padding *inside* it — so the clip and the cards line up
               at every width. It used to be a 1000px box inside the padding,
               which is 36px wider than the 964px the content actually gets. */
            className={`mx-auto w-full max-w-[1004px] px-4 pt-[112px] sm:px-5 sm:pt-[179px] ${
              view === "motion"
                ? "relative"
                : "pointer-events-none absolute inset-x-0 top-0"
            }`}
          >
            <div className="relative w-full">
              <CityVideo
                src={city.video}
                label={`${city.name} in motion`}
                active={view === "motion"}
              />
              {/* Bottom-edge haze, sized as a share of the video box (200/426
                tall, 40/426 of overhang, 200/1000 of side bleed) rather than
                fixed px. At 1512 the block is 426px tall, but on a phone it is
                ~150px, where a flat 200px haze covered the entire clip instead
                of just its bottom edge. The blur tracks the width for the same
                reason. */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-[-20%] bottom-[-9.4%] h-[47%]"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(241,241,241,0) 0%, rgba(241,241,241,0.9) 45%, #f1f1f1 75%)",
                  filter: "blur(clamp(16px,3.3vw,50px))",
                }}
              />
            </div>
          </motion.div>

          {/* Hero landmark — large, centered, melting into the page via mask +
          the layer-blur haze (Figma rect 648:9831) */}
          <motion.div
            initial={false}
            animate={{
              opacity: ready && view === "illustration" ? 1 : 0,
              scale: view === "illustration" ? 1 : 0.97,
            }}
            transition={SWAP}
            inert={!ready || view !== "illustration"}
            className={`flex justify-center pt-[96px] sm:pt-[120px] ${
              view === "illustration"
                ? "relative"
                : "pointer-events-none absolute inset-x-0 top-0"
            }`}
          >
            {/* static box: measured for the FLIP, never transformed itself */}
            <div ref={heroBoxRef} className="pointer-events-none relative">
              <motion.div
                key={flip ? "zoom" : "plain"}
                initial={
                  flip === undefined
                    ? false
                    : flip
                      ? { x: flip.dx, y: flip.dy, scale: flip.s, opacity: 1 }
                      : { y: 40, opacity: 0, scale: 0.96 }
                }
                animate={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                transition={
                  flip
                    ? { duration: 0.85, ease: EASE }
                    : { duration: 0.9, ease: EASE }
                }
                style={{
                  opacity: flip === undefined ? 0 : undefined,
                  WebkitMaskImage:
                    "linear-gradient(to bottom, #000 55%, transparent 96%)",
                  maskImage:
                    "linear-gradient(to bottom, #000 55%, transparent 96%)",
                }}
              >
                <Image
                  src={city.src}
                  alt={`${city.landmark} — ${city.name}`}
                  width={551}
                  height={595}
                  priority
                  unoptimized
                  className="h-auto w-[min(551px,70vw)]"
                />
              </motion.div>

              {/* soft haze over the base — a share of the landmark box (260/595
                tall, 40/595 of overhang, 200/551 of side bleed) rather than
                fixed px, so it stays a bottom-edge fade at every width instead
                of washing out the whole illustration on a phone. Absolutely
                positioned, so it does not affect the box the FLIP measures. */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-[-36%] bottom-[-6.7%] h-[44%]"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(241,241,241,0) 0%, rgba(241,241,241,0.9) 45%, #f1f1f1 75%)",
                  filter: "blur(clamp(16px,3.3vw,50px))",
                }}
              />
            </div>
          </motion.div>
        </motion.div>

        {/* Content */}
        <motion.div
          layout
          transition={SWAP}
          className={`relative z-10 mx-auto flex w-full max-w-[1004px] flex-col gap-[14px] px-4 pb-[clamp(72px,10.6vw,160px)] sm:px-5 ${
            view === "motion"
              ? "mt-6 sm:mt-[39px]" /* video bottom 605 → content 644 */
              : "-mt-10 sm:-mt-16"
          }`}
        >
          {/* Go Back chip */}
          <motion.div {...rise(0.15)}>
            <Link
              href={origin}
              onClick={() => {
                /* Mark the return so the grid only restores its scroll for an
                 actual Go Back — otherwise a stored offset from a card click
                 would still be sitting there and would hijack the next plain
                 visit to /cities. */
                if (origin === "/cities") {
                  try {
                    sessionStorage.setItem("cities-return", "1");
                  } catch {
                    /* storage unavailable — the grid just opens at the top */
                  }
                }
                /* The reverse zoom is only wired up on the landing strip, and the
                 payload is one-shot: writing it when we are NOT going there
                 would leave it in storage to fire on some later visit. */
                if (origin !== "/") return;
                // hand the hero's rect back so the landing page can glide the
                // landmark into its slot (reverse shared-element zoom)
                const box = heroBoxRef.current;
                if (!box) return;
                const r = box.getBoundingClientRect();
                // motion view hides the landmark, so there is nothing to hand back
                if (!r.width || !r.height) return;
                sessionStorage.setItem(
                  "landmark-zoom-back",
                  JSON.stringify({
                    slug: city.slug,
                    x: r.x,
                    y: r.y,
                    w: r.width,
                    h: r.height,
                  }),
                );
              }}
              className="inline-flex items-center gap-1 rounded-[10px] border-[0.5px] border-white bg-white/56 py-1 pl-1.5 pr-2 shadow-[0_2px_13.9px_0_rgba(0,0,0,0.02)] transition-transform hover:scale-[1.04] active:scale-95"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <path
                  d="M14.5 6 9 12l5.5 6"
                  stroke="#2d2d2d"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="text-[12px] font-light tracking-[-0.36px] text-[#2d2d2d]">
                Go Back
              </span>
            </Link>
          </motion.div>

          {/* Name + description */}
          <motion.section
            {...rise(0.22)}
            className={`${CARD} flex flex-col gap-3 p-4`}
          >
            <div className="flex items-center justify-between">
              <h1 className="text-[16px] font-normal leading-5 text-[#2d2d2d]">
                {city.name}
              </h1>
              <span className="flex size-5 items-center justify-center overflow-hidden rounded-full border border-white bg-white">
                <Image
                  src="/icons/india-flag.svg"
                  alt="India"
                  width={20}
                  height={20}
                  unoptimized
                  className="size-5"
                />
              </span>
            </div>
            <p className="text-[14px] font-light leading-[21px] text-muted">
              {city.description}
            </p>
          </motion.section>

          {/* Location + stats */}
          <div className="flex flex-col gap-[14px] lg:flex-row">
            {/* Location card */}
            <motion.section
              {...rise(0.3)}
              className={`${CARD} flex w-full flex-col gap-3 p-4 lg:h-[266px] lg:w-[509px]`}
            >
              <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                <p className="text-[16px] font-normal leading-5 text-[#2d2d2d]">
                  Location
                </p>
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-[11px] transition-opacity hover:opacity-70"
                >
                  <Image
                    src="/icons/detail/route.svg"
                    alt=""
                    width={20}
                    height={20}
                    unoptimized
                    className="size-5"
                  />
                  <span className="whitespace-nowrap text-[16px] font-light leading-5 text-muted underline decoration-dotted">
                    {city.state}
                  </span>
                </a>
              </div>
              <div className="relative h-[191px] w-full overflow-hidden rounded-[10px] bg-white">
                {/* exact Figma map export (477×191 @2x) with marker baked in */}
                <Image
                  src="/icons/detail/map-card.png"
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 477px, 100vw"
                  className="object-cover"
                />
              </div>
            </motion.section>

            {/* 2×2 stat grid */}
            <div className="grid flex-1 grid-cols-2 gap-[10px] sm:gap-[14px]">
              <StatCard
                title="Population"
                icon={<MapIcon />}
                value={city.population}
                delay={0.36}
              />
              <StatCard
                title="Nickname"
                icon={<FlowersIcon />}
                value={city.nickname}
                delay={0.42}
              />
              <StatCard
                title="Language"
                icon={<EarthIcon />}
                value={city.language}
                delay={0.48}
              />
              <StatCard
                title="Climate"
                icon={<MoonIcon />}
                value={city.climate}
                delay={0.54}
              />
            </div>
          </div>

          {/* CTA bar */}
          <motion.section
            {...rise(0.6)}
            className={`${CARD} flex flex-col gap-3 overflow-hidden p-4`}
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
              <div className="flex items-center gap-[9px]">
                <LuggageIcon />
                <p className="text-[14px] font-normal tracking-[-0.42px] text-[#2d2d2d]">
                  Ready to Experience {city.name}?
                </p>
              </div>
              <a
                href="#"
                className="flex h-[50px] items-center justify-center rounded-full border-[1.5px] border-white px-[34px] text-[16px] font-normal tracking-[-0.48px] text-green-ink shadow-[0_2px_13.9px_0_rgba(0,0,0,0.02)] transition-transform duration-300 hover:scale-[1.03] active:scale-95 sm:w-auto"
                style={{
                  backgroundImage:
                    "linear-gradient(180deg, #fafafa 0.27%, #7eff5f 62.5%)",
                }}
              >
                Explore in Person
              </a>
            </div>
          </motion.section>
        </motion.div>
      </div>

      <Footer />
    </main>
  );
}
