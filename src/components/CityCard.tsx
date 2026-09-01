"use client";

/* Cities index card — Figma 36385:291685 (and its seven siblings).

   275×282 white card, 10px radius. Inside:
     · illustration well  267×164 at (4,4), 6px radius,
                          linear-gradient(180deg, #fafafa 52.46%, #fff 100%)
     · Ellipse 42         342×83 white oval at (-37,123), 34.7px blur —
                          this is what dissolves the landmark's baseline
     · mini view switcher 36×18 at (223,8), brush / video-01
     · mood tags          left 14, top 185
     · title + blurb      left 14, top 210, text column 231, arrow 13px

   Every inner value is the literal Figma pixel; the card scales by being
   dropped into the grid at its natural 275px width. */

/* eslint-disable @next/next/no-img-element */

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import type { CityInfo } from "./cityData";
import type { CityView } from "./ViewSwitcher";

const EASE = [0.22, 1, 0.36, 1] as const;

/* Landmark placement inside the 267×164 well, straight off each card's
   instance node. All eight share the landmarks' native 376:406 ratio, so the
   width fixes the height. */
export type Placement = { w: number; x: number; y: number };

const CARD_TAG =
  "flex h-[17px] items-center rounded-[123px] border-[0.5px] border-[#f6f6f6] bg-[#fafafa] px-[6px] text-[10px] font-light leading-none tracking-[-0.3px] text-[#303030] shadow-[0_2px_13.9px_0_rgba(0,0,0,0.02)]";

const SWITCH_BTN =
  /* Figma's 16px box is a mouse-sized target, so below lg the whole control
     scales up to a thumb-friendly 26px (with a 38px hit area on top); from lg
     it snaps back to the exact spec. */
  "relative flex size-[26px] items-center justify-center rounded-[4px] transition-colors after:absolute after:left-1/2 after:top-1/2 after:size-[38px] after:-translate-x-1/2 after:-translate-y-1/2 after:content-[''] lg:size-[16px] lg:rounded-[2px] lg:after:hidden";

export default function CityCard({
  city,
  placement,
  dimmed,
  index,
  view,
  onViewChange,
  instant = false,
}: {
  city: CityInfo;
  placement: Placement;
  dimmed: boolean;
  index: number;
  /* Controlled by the grid, so the page-level ViewSwitcher (36385:291974) can
     flip every card at once while a card's own switcher still overrides it. */
  view: CityView;
  onViewChange: (next: CityView) => void;
  /* Set when the grid is being restored after a Go Back — the cards are already
     "in view" at the restored scroll offset, so re-running the reveal would
     read as a second page load. */
  instant?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const motionView = view === "motion";

  /* Only cards near the viewport actually stream. The page-level switcher
     flips all eight at once, which on a phone would pull ~32 MB and decode
     eight 1440p clips simultaneously; off-screen ones stay unloaded and the
     already-loaded ones pause. */
  const inView = useInView(cardRef, { margin: "300px 0px" });
  const shouldPlay = motionView && inView;

  /* Same rule as the detail page: never stream the clip until motion view is
     actually opened, then keep the element so switching back is instant.
     Latched during render rather than in an effect — the card can be flipped
     by its own button or by the page switcher, and an effect for that trips
     the cascading-render rule. */
  const [everMotion, setEverMotion] = useState(shouldPlay);
  if (shouldPlay && !everMotion) setEverMotion(true);
  const requested = everMotion;

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (shouldPlay) void el.play().catch(() => {});
    else el.pause();
  }, [shouldPlay, requested]);

  const hasVideo = Boolean(city.video);
  const showMotion = motionView && hasVideo;

  return (
    /* Two layers on purpose: the outer one owns the once-only entrance, the
       inner one owns the filter dim. Putting `whileInView` and `animate` on a
       single element lets the in-view variant win and the dim never lands. */
    <motion.div
      layout
      initial={instant ? false : { y: 22, opacity: 0 }}
      whileInView={{ y: 0, opacity: 1 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{
        duration: 0.7,
        ease: EASE,
        delay: instant ? 0 : 0.04 * index,
        layout: { duration: 0.55, ease: EASE },
      }}
      className="mx-auto w-full max-w-[460px] sm:max-w-none lg:mx-0 lg:max-w-[275px]"
      ref={cardRef}
    >
      <motion.article
        animate={
          dimmed
            ? { opacity: 0.24, filter: "saturate(0.2)" }
            : { opacity: 1, filter: "saturate(1)" }
        }
        transition={{ duration: 0.45, ease: "easeOut" }}
        className={`group relative flex min-h-[282px] w-full flex-col rounded-[10px] bg-white transition-shadow duration-300 ${
          dimmed
            ? "pointer-events-none"
            : "hover:shadow-[0_10px_34px_0_rgba(0,0,0,0.06)]"
        }`}
      >
        {/* the whole card is one link; the switcher sits above it */}
        <Link
          href={`/cities/${city.slug}`}
          aria-label={`Explore ${city.name}`}
          onClick={() => {
            try {
              // Go Back comes back here, at this scroll offset, and the detail
              // page opens on whichever view this card was showing
              sessionStorage.setItem("city-origin", "/cities");
              sessionStorage.setItem("city-view", view);
              sessionStorage.setItem("cities-scroll", String(window.scrollY));
            } catch {
              /* storage unavailable — the detail page falls back to defaults */
            }
          }}
          className="flex flex-1 flex-col rounded-[10px] outline-none focus-visible:ring-2 focus-visible:ring-green-500/60"
          tabIndex={dimmed ? -1 : undefined}
        >
          {/* Illustration well */}
          <div
            className="relative m-[4px] aspect-[267/164] overflow-hidden rounded-[6px]"
            style={{
              background:
                "linear-gradient(180deg, #fafafa 52.46%, #ffffff 100%)",
            }}
          >
            {/* landmark — placement as % of the well so it scales with the card */}
            <div
              className={`absolute transition-[transform,opacity] duration-500 ease-out ${
                showMotion
                  ? "opacity-0"
                  : "opacity-100 group-hover:-translate-y-[6px] group-hover:scale-[1.03]"
              }`}
              style={{
                left: `${(placement.x / 267) * 100}%`,
                top: `${(placement.y / 164) * 100}%`,
                width: `${(placement.w / 267) * 100}%`,
                transformOrigin: "center bottom",
              }}
            >
              <Image
                src={city.src}
                alt={`${city.name} landmark`}
                width={376}
                height={406}
                unoptimized
                draggable={false}
                className="h-auto w-full"
                priority={index < 3}
              />
            </div>

            {/* Ellipse 42 (36385:291688) — the exported blurred white oval that
              dissolves the landmark's baseline. The asset's own canvas is
              411.4×152.4 for a 342×83 oval, i.e. it carries 34.7px of blur
              bleed on every side, so the box is inset by that much. */}
            <img
              aria-hidden
              alt=""
              src="/landmarks/baseline-fade.svg"
              className="pointer-events-none absolute max-w-none"
              style={{
                left: `${((-37 - 34.7) / 267) * 100}%`,
                top: `${((123 - 34.7) / 164) * 100}%`,
                width: `${(411.4 / 267) * 100}%`,
                height: `${(152.4 / 164) * 100}%`,
              }}
            />

            {/* Motion view — cross-fades over the landmark, inert when hidden */}
            {hasVideo && (
              <div
                inert={!showMotion}
                className={`absolute inset-0 transition-opacity duration-500 ease-out ${
                  showMotion ? "opacity-100" : "opacity-0"
                }`}
                style={{
                  WebkitMaskImage:
                    "linear-gradient(to bottom, #000 72%, transparent 100%)",
                  maskImage:
                    "linear-gradient(to bottom, #000 72%, transparent 100%)",
                }}
              >
                {requested && (
                  <video
                    ref={videoRef}
                    src={city.video}
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    aria-label={`${city.name} in motion`}
                    className="size-full object-cover"
                  />
                )}
              </div>
            )}
          </div>

          {/* Mood tags */}
          <div className="flex h-[17px] items-center gap-[7px] px-[14px] pt-[13px] box-content">
            {city.moods.map((mood) => (
              <span key={mood} className={CARD_TAG}>
                {mood}
              </span>
            ))}
          </div>

          {/* Title + blurb + arrow */}
          <div className="flex items-start gap-[3px] px-[14px] pb-[14px] pt-[8px]">
            <div className="flex min-w-0 flex-1 flex-col gap-[4px]">
              <div className="flex h-[18px] items-center gap-[4px]">
                <span className="text-[14px] font-normal tracking-[-0.42px] text-[#303030]">
                  {city.name}
                </span>
                <Image
                  src="/icons/india-flag.svg"
                  alt=""
                  width={10}
                  height={10}
                  unoptimized
                  className="size-[10px] shrink-0 rounded-full"
                />
              </div>
              <p className="text-[12px] font-light leading-[18px] tracking-[-0.24px] text-[#919191]">
                {city.blurb}
              </p>
            </div>
            <Image
              src="/icons/arrow-circle.svg"
              alt=""
              width={13}
              height={13}
              unoptimized
              className="mt-[3px] size-[13px] shrink-0 transition-transform duration-300 group-hover:translate-x-[2px]"
            />
          </div>
        </Link>

        {/* Mini view switcher — 36×18 at (223,8) of the card, so it lands in the
          well's top-right. Sits above the link so it doesn't navigate. */}
        <div
          role="group"
          aria-label={`${city.name} view`}
          className="absolute right-[12px] top-[10px] z-10 flex h-[30px] items-center gap-[3px] rounded-[6px] border-[0.5px] border-[#f6f6f6] bg-white px-[2px] shadow-[0_2px_13.9px_0_rgba(0,0,0,0.02)] lg:right-[16px] lg:top-[12px] lg:h-[18px] lg:gap-[2px] lg:rounded-[3px] lg:px-px lg:py-[2px]"
        >
          {(
            [
              ["illustration", "brush", false],
              ["motion", "video-01", true],
            ] as const
          ).map(([key, icon, wantsMotion]) => {
            const selected = showMotion === wantsMotion;
            return (
              <button
                key={key}
                type="button"
                aria-label={wantsMotion ? "Motion view" : "Illustration view"}
                aria-pressed={selected}
                disabled={wantsMotion && !hasVideo}
                onClick={() =>
                  onViewChange(wantsMotion ? "motion" : "illustration")
                }
                className={`${SWITCH_BTN} ${selected ? "" : "hover:bg-black/[0.03]"} disabled:opacity-40`}
              >
                {selected && (
                  <motion.span
                    layoutId={`card-switch-${city.slug}`}
                    transition={{ duration: 0.35, ease: EASE }}
                    className="absolute inset-0 rounded-[4px] bg-[#f6f6f6] lg:rounded-[2px]"
                  />
                )}
                <img
                  alt=""
                  src={`/icons/detail/${icon}.svg`}
                  className="relative block size-[12px]"
                />
              </button>
            );
          })}
        </div>
      </motion.article>
    </motion.div>
  );
}
