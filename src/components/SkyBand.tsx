"use client";

/* The About page's illustration band — Figma component set `36570:75642`
   (Component 17) with two variants:

   | variant                | node           | sky                                   | clouds                                        |
   | ---------------------- | -------------- | ------------------------------------- | --------------------------------------------- |
   | `Frame 1991427715` day | `36570:75643`  | linear 181.82° pale blue → white      | the two white cloud rasters                   |
   | `Frame 1991427725` eve | `36570:75703`  | skewed ellipse sunset gradient        | the same cloud raster as a 33% purple mask    |

   The plane is byte-identical in geometry between the two — only its art is
   relit — which is what makes the hover a *state* change rather than a
   different picture, and what lets the loop keep running straight through it.

   ## Why this is layers and not the one flat export it used to be

   The band shipped as a single `sky-band.webp`. It cannot animate: the plane is
   baked into the sky. So the frame is rebuilt from its own pieces —

   - both gradients as CSS / SVG (the evening one is an SVG because Figma skews
     its gradient ellipse ~45° and `radial-gradient()` has no way to say that),
   - the cloud rasters as the design's own image fills,
   - the plane as a transparent cutout, free to move.

   Every box below is a share of the 1232×650 frame (`x/1232`, `y/650`), so the
   whole composition is the same drawing at any width.

   Figma's own export of the plane group comes back opaque — the group is
   rendered over the canvas' slate backdrop — so `plane-day.webp` is that export
   with the flat backdrop keyed out, and `plane-evening.webp` is the evening
   render carrying the *day* matte (identical geometry, so the alpha is shared).
   Composited back at `left:0 / top:295` the result matches Figma's own band
   render to a mean 0.6/255 per channel, which is how the placement was fixed. */

import Image from "next/image";
import {
  motion,
  useAnimate,
  useInView,
  useReducedMotion,
} from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useCoarsePointer } from "@/components/useMediaQuery";
import IconSwitcher, {
  type SwitcherOption,
} from "@/components/IconSwitcher";

const EASE = [0.22, 1, 0.36, 1] as const;

/* One curve for the whole state change: sky, clouds and the plane's relight all
   travel on it, or the band reads as three separate things fading. */
const DUSK = { duration: 0.9, ease: EASE } as const;

/* Frame geometry (36570:75643 / 36570:75703), as % of the 1232×650 frame. */
const pctX = (px: number) => `${(px / 1232) * 100}%`;
const pctY = (px: number) => `${(px / 650) * 100}%`;

/* The plane's own box — 513.969×173.307 at (0, 295) in the frame. The loop
   moves this box; the two plane images inside it only cross-fade. */
const PLANE = {
  width: pctX(513.969),
  height: pctY(173.307),
  left: 0,
  top: pctY(295),
};

/* Cloud 2 / cloud 3 (36570:75644 / 36570:75645) — the design's image fills at
   their designed boxes, both bleeding well outside the frame. */
const DAY_CLOUDS = [
  {
    src: "/about/cloud-2.webp",
    w: 1912,
    h: 1274,
    style: {
      left: pctX(-107),
      top: pctY(-87),
      width: pctX(956),
      height: pctY(637),
    },
  },
  {
    src: "/about/cloud-3.webp",
    w: 375,
    h: 250,
    style: {
      left: pctX(578),
      top: pctY(-164),
      width: pctX(1050.943),
      height: pctY(791.268),
    },
  },
];

const DUSK_CLOUD = "rgba(67,50,100,0.33)";

/* A 33%-purple plate showing through the cloud raster — the evening variant's
   two "Mask group"s (36570:75704 / 36570:75707). The mask sits in its own
   child, sized and offset exactly as the node's mask-size / mask-position, so
   the plate can clip it rather than the mask having to be resolved against a
   box it does not match. */
function DuskCloud({
  plate,
  mask,
  rotate,
}: {
  plate: React.CSSProperties;
  mask: React.CSSProperties;
  rotate?: number;
}) {
  const plane = (
    <div className="relative size-full overflow-hidden">
      <div
        className="absolute"
        style={{
          ...mask,
          backgroundColor: DUSK_CLOUD,
          WebkitMaskImage: "url(/about/cloud-mask.webp)",
          maskImage: "url(/about/cloud-mask.webp)",
          WebkitMaskSize: "100% 100%",
          maskSize: "100% 100%",
          WebkitMaskRepeat: "no-repeat",
          maskRepeat: "no-repeat",
        }}
      />
    </div>
  );

  /* cloud 3 is a rotated plate centred in a larger box (the node keeps the
     rotation on a wrapper, so the plate itself stays axis-aligned inside) */
  if (rotate === undefined)
    return (
      <div className="absolute" style={plate}>
        {plane}
      </div>
    );

  return (
    <div className="absolute flex items-center justify-center" style={plate}>
      <div
        className="shrink-0"
        style={{
          transform: `rotate(${rotate}deg)`,
          width: "92.805%",
          height: "76.748%",
        }}
      >
        {plane}
      </div>
    </div>
  );
}

/* Cruise geometry, in multiples of the plane's own box width (41.7% of the
   frame, so 1% of x ≈ 0.417% of the band).

   `OFF_LEFT` / `OFF_RIGHT` are the first x where the plane art — which occupies
   9.6%–97% of its box, not the whole of it — is fully outside the frame. The
   loop wraps between those two, so the reset is never on screen. `PARKED` is
   the position the Figma frame draws, which the first pass starts from: a plane
   already in the sky reads better on arrival than an empty one. */
const OFF_LEFT = -110;
const OFF_RIGHT = 244;
const PARKED = -26;
const CROSSING = 34; /* seconds for a full OFF_LEFT → OFF_RIGHT pass */

/* Two states, two icons, no words — the same shape as the cities page's
   illustration ⇄ motion switch. */
type Sky = "day" | "evening";
const SKY_OPTIONS: readonly SwitcherOption<Sky>[] = [
  { value: "day", icon: "about/sun", label: "Daytime sky" },
  { value: "evening", icon: "about/moon", label: "Evening sky" },
];

export default function SkyBand() {
  const [dusk, setDusk] = useState(false);
  const reduce = useReducedMotion();
  const [plane, animatePlane] = useAnimate();

  /* Touch has no hover, so the day ⇄ evening state — the whole point of
     rebuilding this band from its layers — would be unreachable on a phone.
     It gets an explicit toggle instead of a gesture, because a tap on a
     picture is not a promise of anything. */
  const coarse = useCoarsePointer();

  /* The band is ~200px tall on a phone and the page is four screens long, so
     the crossing spends most of its life off screen. Gating the loop on
     `useInView` stops a 34s animation running against the battery behind three
     screenfuls of cards. */
  const band = useRef<HTMLDivElement>(null);
  const inView = useInView(band, { amount: 0.15 });

  useEffect(() => {
    if (reduce || !inView) return;
    let live = true;
    const pass = (from: number) =>
      animatePlane(
        plane.current,
        { x: [`${from}%`, `${OFF_RIGHT}%`], y: ["6%", "-6%"] },
        {
          duration: (CROSSING * (OFF_RIGHT - from)) / (OFF_RIGHT - OFF_LEFT),
          ease: "linear",
        },
      );

    (async () => {
      /* first pass picks up from the parked position, every pass after it is
         the full crossing */
      let from = PARKED;
      while (live) {
        await pass(from);
        from = OFF_LEFT;
      }
    })().catch(() => {
      /* animate() rejects when the element goes away mid-flight */
    });

    return () => {
      live = false;
    };
  }, [animatePlane, plane, reduce, inView]);

  return (
    <div
      ref={band}
      /* pointer events rather than mouseenter/leave, so a stylus or a
         touchscreen laptop does not get a sky stuck at dusk */
      onPointerEnter={(e) => {
        if (e.pointerType === "mouse") setDusk(true);
      }}
      onPointerLeave={(e) => {
        if (e.pointerType === "mouse") setDusk(false);
      }}
      /* At `lg` the band is full-bleed and its bottom edge dissolves into the
         page, so only the top corners are rounded. Below that it sits in the
         page's gutter as a card, and all four are — the bottom pair costs
         nothing, since the sky is already #fafafa by the time it reaches them.
         `overflow-hidden` on this box is what clips both skies and the plane. */
      /* The frame is a 1.9:1 letterbox, which on a phone is a ~190px strip.
         Below `lg` the band is given real height instead; the layers below
         all keep their own aspect (`object-contain` / `object-cover`), so a
         taller box crops and re-centres the picture rather than stretching
         it. At `lg` the ratio is the frame's again and nothing is cropped. */
      className="relative isolate aspect-[5/4] w-full overflow-hidden rounded-[20px] sm:aspect-[16/9] lg:aspect-[1232/650] lg:rounded-b-none"
    >
      {/* the description lives in its own node rather than as `role="img"` on
          this box: a `role="img"` container hides the toggle below from
          assistive tech */}
      <span className="sr-only">
        {dusk
          ? "An evening sky with a Dakar Travels plane crossing it"
          : "A bright daytime sky with a Dakar Travels plane crossing it"}
      </span>
      {/* Day sky — 181.82° pale blue wash, then the two white clouds */}
      <motion.div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(181.82deg, rgba(176,217,255,0.2) 73.111%, rgba(255,255,255,0.112) 105.95%)",
        }}
        animate={{ opacity: dusk ? 0 : 1 }}
        transition={DUSK}
      >
        {DAY_CLOUDS.map((c) => (
          <Image
            key={c.src}
            src={c.src}
            alt=""
            width={c.w}
            height={c.h}
            priority
            /* cover, not stretch: below `lg` these boxes are proportionally
               taller than the frame drew them, and a stretched cloud reads as
               a smear */
            className="absolute max-w-none object-cover"
            style={c.style}
          />
        ))}
      </motion.div>

      {/* Evening sky — the skewed sunset ellipse, then the same clouds as
          purple plates showing through the cloud raster */}
      <motion.div
        className="absolute inset-0"
        style={{
          backgroundImage: "url(/about/sky-evening.svg)",
          backgroundSize: "100% 100%",
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: dusk ? 1 : 0 }}
        transition={DUSK}
      >
        <DuskCloud
          plate={{
            left: pctX(-106),
            top: pctY(-72),
            width: pctX(937),
            height: pctY(505),
          }}
          mask={{
            left: `${(-9 / 937) * 100}%`,
            top: `${(-31 / 505) * 100}%`,
            width: `${(956 / 937) * 100}%`,
            height: `${(637 / 505) * 100}%`,
          }}
        />
        <DuskCloud
          rotate={-170.14}
          plate={{
            left: pctX(550.16),
            top: pctY(-112.78),
            width: pctX(1009.637),
            height: pctY(657.994),
          }}
          mask={{
            left: `${(-15.161 / 937) * 100}%`,
            top: `${(-101.221 / 505) * 100}%`,
            width: `${(1050.961 / 937) * 100}%`,
            height: `${(791.298 / 505) * 100}%`,
          }}
        />
      </motion.div>

      {/* The plane. Its box carries the loop; the two liveries inside it only
          cross-fade, so switching sky can never move the plane — position is
          shared state by construction rather than by two animations agreeing. */}
      <motion.div
        ref={plane}
        className="absolute"
        style={{ ...PLANE, x: `${PARKED}%`, y: "6%" }}
      >
        <motion.div
          className="relative size-full"
          animate={
            reduce ? {} : { y: ["0%", "-2.5%", "0%"], rotate: [0, -0.5, 0] }
          }
          transition={
            reduce
              ? {}
              : {
                  duration: 7,
                  ease: "easeInOut",
                  repeat: Infinity,
                }
          }
        >
          <Image
            src="/about/plane-day.webp"
            alt=""
            width={1028}
            height={347}
            priority
            /* `contain` is a no-op at `lg` (the box is the art's own
               2.966:1) and is what keeps the plane undistorted — and centred
               on the frame's own 58.7% of the band — where the band is
               taller. */
            className="absolute inset-0 size-full object-contain"
          />
          <motion.div
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: dusk ? 1 : 0 }}
            transition={DUSK}
          >
            <Image
              src="/about/plane-evening.webp"
              alt=""
              width={1028}
              height={347}
              className="size-full object-contain"
            />
          </motion.div>
        </motion.div>
      </motion.div>

      {/* The band's own dissolve. The page also lays a blurred #fafafa plate
          over the join, but a plate can only *cover* a hard edge — it cannot
          remove one, and against the evening sky a 16px-blurred rectangle
          reads as a second edge of its own. So the sky itself is taken to
          `--background` before the box ends: there is then nothing to hide.
          Above the plane, as the frame paints Rectangle 34624285.

          `lg:hidden`: at the frame's own width the plate is enough (the sky is
          nearly white by 86.3% there anyway), and the composition above that is
          matched to Figma's render to a mean 0.75/255 — this gradient would
          move the bottom third of it. */}
      <div
        aria-hidden
        /* the gradient has to *finish* before the edge, not at it: reaching
           #fafafa on the last pixel still leaves the one before it darker,
           which is exactly the step it was meant to remove */
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[38%] bg-gradient-to-b from-transparent via-background/60 via-[52%] to-background to-[86%] lg:hidden"
      />

      {/* Touch's route to the evening variant — the cities page's switcher,
          sun ⇄ moon. Rendered only where there is no hover to carry it, so a
          mouse still gets the frame unadorned.

          The inset is a share of the band, not a fixed one: the page's #fafafa
          dissolve plate covers the band from 86.3% down and would wash the
          control out at tablet widths, where the band is twice as tall. */}
      {coarse && (
        <IconSwitcher
          value={dusk ? "evening" : "day"}
          onChange={(next) => setDusk(next === "evening")}
          options={SKY_OPTIONS}
          label="Sky"
          layoutId="sky-band-switcher"
          className="absolute bottom-[16%] right-3 z-10 flex-row sm:right-5"
        />
      )}
    </div>
  );
}
