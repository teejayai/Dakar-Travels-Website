"use client";

import Image from "next/image";
import { useRef, useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CITIES } from "./cities";

const EASE = [0.22, 1, 0.36, 1] as const;

/* Figma spec (frame 580:3915):
   cards 376×406, step 322px → 54px overlap (-27px each side),
   frame bleeds -42px left, strip bottom sits 31px above viewport bottom,
   content wider than viewport → horizontally scrollable. */
const CARD_W = 376;
const OVERLAP = 27;
const LEFT_BLEED = -42;

export default function LandmarkStrip({ query }: { query: string }) {
  const q = query.trim().toLowerCase();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  /* Entrance animation plays once; afterwards filter fades react instantly. */
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setEntered(true), 1400);
    return () => clearTimeout(t);
  }, []);

  /* ---- Seamless momentum scrolling ------------------------------------ */
  const target = useRef(0);
  const raf = useRef(0);
  const drag = useRef({
    active: false,
    startX: 0,
    startScroll: 0,
    moved: false,
    lastX: 0,
    lastT: 0,
    velocity: 0,
  });

  const clampTarget = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    target.current = Math.max(0, Math.min(target.current, el.scrollWidth - el.clientWidth));
  }, []);

  /** rAF loop that eases scrollLeft toward target — gives wheel + fling inertia. */
  const glide = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const diff = target.current - el.scrollLeft;
    if (Math.abs(diff) < 0.5) {
      el.scrollLeft = target.current;
      raf.current = 0;
      return;
    }
    el.scrollLeft += diff * 0.14;
    raf.current = requestAnimationFrame(glide);
  }, []);

  const startGlide = useCallback(() => {
    if (!raf.current) raf.current = requestAnimationFrame(glide);
  }, [glide]);

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  /* Search-driven centering: as the query narrows, the matching cities —
     as a group — glide to the horizontal center of the viewport. */
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el || !q) return;
    const centers = CITIES.flatMap((c, i) => {
      if (!c.name.toLowerCase().includes(q)) return [];
      const card = cardRefs.current[i];
      return card ? [card.offsetLeft + card.offsetWidth / 2] : [];
    });
    if (centers.length === 0) return;
    const groupCenter = (centers[0] + centers[centers.length - 1]) / 2;
    target.current = groupCenter - el.clientWidth / 2;
    clampTarget();
    startGlide();
  }, [q, clampTarget, startGlide]);

  const onWheel = useCallback(
    (e: React.WheelEvent) => {
      const el = scrollerRef.current;
      if (!el) return;
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (!raf.current) target.current = el.scrollLeft;
      target.current += delta * 1.4;
      clampTarget();
      startGlide();
    },
    [clampTarget, startGlide],
  );

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    const el = scrollerRef.current;
    if (!el || e.pointerType === "touch") return; // native touch scroll is already smooth
    cancelAnimationFrame(raf.current);
    raf.current = 0;
    el.setPointerCapture(e.pointerId);
    drag.current = {
      active: true,
      startX: e.clientX,
      startScroll: el.scrollLeft,
      moved: false,
      lastX: e.clientX,
      lastT: performance.now(),
      velocity: 0,
    };
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    const el = scrollerRef.current;
    const d = drag.current;
    if (!el || !d.active) return;
    const dx = e.clientX - d.startX;
    if (Math.abs(dx) > 5) d.moved = true;
    el.scrollLeft = d.startScroll - dx;
    const now = performance.now();
    const dt = now - d.lastT;
    if (dt > 0) d.velocity = (d.lastX - e.clientX) / dt; // px per ms
    d.lastX = e.clientX;
    d.lastT = now;
  }, []);

  const onPointerUp = useCallback(() => {
    const el = scrollerRef.current;
    const d = drag.current;
    if (!el || !d.active) return;
    d.active = false;
    if (d.moved && Math.abs(d.velocity) > 0.1) {
      // fling: project velocity into a decayed distance
      target.current = el.scrollLeft + d.velocity * 220;
      clampTarget();
      startGlide();
    }
  }, [clampTarget, startGlide]);

  const onClickCapture = useCallback((e: React.MouseEvent) => {
    if (drag.current.moved) {
      e.stopPropagation();
      e.preventDefault();
      drag.current.moved = false;
    }
  }, []);
  /* ---------------------------------------------------------------------- */

  return (
    <div
      ref={scrollerRef}
      onWheel={onWheel}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onClickCapture={onClickCapture}
      onDragStart={(e) => e.preventDefault()}
      className="absolute inset-x-0 bottom-0 z-20 cursor-grab touch-pan-x overflow-x-auto overflow-y-hidden select-none active:cursor-grabbing [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {/* pt gives room for the hover lift + pill inside the scroll clip */}
      {/* pr lets the last card glide all the way to the viewport center */}
      <div
        className="flex w-max items-end pb-[31px] pr-[calc(50vw-188px)] pt-[80px]"
        style={{ marginLeft: LEFT_BLEED }}
      >
        {CITIES.map((city, i) => {
          const isMatch = q.length === 0 || city.name.toLowerCase().includes(q);
          /* When the search has narrowed to exactly one city, its pill shows
             without hover — mirroring the prototype. */
          const soleMatch =
            q.length > 0 &&
            isMatch &&
            CITIES.filter((c) => c.name.toLowerCase().includes(q)).length === 1;

          return (
            /* Entrance animation lives on the outer element; hover motion is
               pure CSS on the inner one so it reacts instantly with no
               entrance-delay bleed. */
            <motion.div
              key={city.name}
              ref={(node) => {
                cardRefs.current[i] = node;
              }}
              initial={{ y: 140, opacity: 0 }}
              animate={{
                y: 0,
                opacity: isMatch ? 1 : 0.08,
                filter: isMatch ? "saturate(1)" : "saturate(0.15)",
              }}
              transition={{
                y: { duration: 0.95, ease: EASE, delay: entered ? 0 : 0.55 + i * 0.07 },
                opacity: {
                  duration: 0.45,
                  ease: "easeOut",
                  delay: entered ? 0 : 0.55 + i * 0.07,
                },
                filter: { duration: 0.45 },
              }}
              className="relative shrink-0 hover:z-30"
              style={{ width: CARD_W, marginLeft: i === 0 ? 0 : -2 * OVERLAP }}
            >
              <button
                type="button"
                aria-label={`Explore ${city.name}`}
                disabled={!isMatch}
                className="group block w-full cursor-pointer outline-none disabled:cursor-default"
              >
                {/* Hover / focus reveal pill — Figma Component 1 (527:1953) */}
                <span
                  className={`pointer-events-none absolute left-1/2 top-[10%] z-10 flex h-[45px] -translate-x-1/2 items-center gap-[41px] rounded-full border border-white px-[15px] shadow-[0_2px_13.9px_0_rgba(0,0,0,0.05)] transition-all duration-300 ease-out group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100 ${
                    soleMatch ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
                  }`}
                  style={{ backgroundImage: "linear-gradient(180deg, #fafafa 0.27%, #bffffc 350%)" }}
                >
                  <span className="flex items-center gap-2">
                    <span className="flex size-5 items-center justify-center overflow-hidden rounded-full border border-white bg-white">
                      <Image
                        src="/icons/india-flag.svg"
                        alt=""
                        width={20}
                        height={20}
                        className="size-5"
                      />
                    </span>
                    <span className="whitespace-nowrap text-[16px] font-light tracking-[-0.48px] text-green-ink">
                      {city.name}
                    </span>
                  </span>
                  <Image
                    src="/icons/arrow-circle.svg"
                    alt=""
                    width={18}
                    height={18}
                    className="size-[18px]"
                  />
                </span>

                {/* Landmark illustration — instant CSS lift on hover */}
                <Image
                  src={city.src}
                  alt={`${city.name} landmark`}
                  width={376}
                  height={406}
                  draggable={false}
                  className="h-auto w-full origin-bottom transition-transform duration-200 ease-out group-hover:-translate-y-[14px] group-hover:scale-[1.04] group-focus-visible:-translate-y-[14px]"
                  priority={i < 6}
                />
              </button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
