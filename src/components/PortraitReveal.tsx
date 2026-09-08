"use client";

/* The team portraits are greyed by `mix-blend-luminosity` (Figma 36565:75502).
   Hovering one puts a circle of colour under the pointer: a second, unblended
   copy of the same photograph sits on top, masked to a soft disc that follows
   the cursor, ringed by a hairline outline. The native cursor stays — the ring
   rides with it rather than replacing it.

   Both copies are the same file, so the reveal costs no extra bytes — the
   colour layer is the *unfiltered* image the grey one is already made from.

   Two masks, two elements, on purpose: the disc lives on the photo, and the
   bottom dissolve that hides the cut-out's edge lives on the well-sized wrapper
   above it. Composing them onto one element would mean `mask-composite`, and
   the two are in different coordinate spaces anyway — the disc in the well's,
   the dissolve in the photo's.

   ## On touch there is no pointer to follow

   A lens is a pointer idea: it needs somewhere to be. Tapping would strand it
   under a finger that is already gone, so touch gets the same *content* by a
   different move — the whole portrait cross-fades to colour and back, driven by
   the cities page's `IconSwitcher` (mono ⇄ colour) in the well's top-left
   corner. Not a degraded lens: a different affordance for the same reveal, in
   the control the rest of the site already uses for a picture with two
   states. */

import Image from "next/image";
import { useRef, useState } from "react";
import {
  animate,
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";
import { useCoarsePointer } from "@/components/useMediaQuery";
import IconSwitcher, {
  type SwitcherOption,
} from "@/components/IconSwitcher";

/* Lens radius as a share of the 382px-wide well, so it holds at every card
   width: a 156px disc on the Figma frame. */
const LENS = 78 / 382;
/* Solid nearly to the edge, then a short feather — a hard circle reads as a
   cut-out of a different photo, a long feather stops the ring meaning
   anything. The stops end where the ring is drawn. */
const MASK_STOPS = "#000 76%, rgba(0,0,0,0.55) 90%, transparent 100%";

const FOLLOW = { stiffness: 520, damping: 42, mass: 0.6 } as const;

type Tone = "mono" | "colour";
const TONE_OPTIONS: readonly SwitcherOption<Tone>[] = [
  { value: "mono", icon: "about/monochrome", label: "Black and white" },
  { value: "colour", icon: "about/colour", label: "Colour" },
];

export default function PortraitReveal({
  photo,
  name,
  box,
  dissolve,
}: {
  photo: string;
  name: string;
  /* [width, height, left, top] of the photo as a share of the well */
  box: [number, number, number, number];
  /* the bottom dissolve, in the *well's* coordinates */
  dissolve: string;
}) {
  const well = useRef<HTMLDivElement>(null);
  const [radius, setRadius] = useState(0);
  const [live, setLive] = useState(false);
  /* the touch reveal: the whole portrait, not a disc */
  const [shown, setShown] = useState(false);
  const coarse = useCoarsePointer();
  const reduce = useReducedMotion();

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, FOLLOW);
  const sy = useSpring(y, FOLLOW);
  /* 0 → 1, so the disc and the ring open and close together */
  const open = useMotionValue(0);

  const r = useTransform(open, (v) => v * radius);
  const mask = useMotionTemplate`radial-gradient(circle ${r}px at ${sx}px ${sy}px, ${MASK_STOPS})`;

  const ringX = useTransform([sx, r], ([px, rr]: number[]) => px - rr);
  const ringY = useTransform([sy, r], ([py, rr]: number[]) => py - rr);
  const ringSize = useTransform(r, (v) => v * 2);

  const track = (e: React.PointerEvent) => {
    const b = well.current?.getBoundingClientRect();
    if (!b) return { px: 0, py: 0 };
    return { px: e.clientX - b.left, py: e.clientY - b.top };
  };

  return (
    <div
      ref={well}
      onPointerEnter={(e) => {
        /* touch has no hover, and a tap would leave the lens stranded */
        if (e.pointerType !== "mouse") return;
        const b = well.current?.getBoundingClientRect();
        if (!b) return;
        const { px, py } = track(e);
        /* jump, don't spring, or the disc flies in from wherever it last was */
        x.jump(px);
        y.jump(py);
        setRadius(b.width * LENS);
        setLive(true);
        animate(open, 1, { duration: 0.34, ease: [0.22, 1, 0.36, 1] });
      }}
      onPointerMove={(e) => {
        if (!live) return;
        const { px, py } = track(e);
        x.set(px);
        y.set(py);
      }}
      onPointerLeave={() => {
        setLive(false);
        animate(open, 0, { duration: 0.28, ease: [0.22, 1, 0.36, 1] });
      }}
      className="absolute inset-0"
    >
      {/* only the photograph is dissolved — the ring is a sibling, or the
          card's own bottom fade would eat the cursor near the caption */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{ WebkitMaskImage: dissolve, maskImage: dissolve }}
      >
        <motion.div
          className="absolute inset-0"
          /* on touch there is no disc — the layer is unmasked and its
             *opacity* carries the reveal instead */
          /* `none`, not `undefined`: dropping the key leaves the mask framer
             last committed on the element — and before hydration `coarse` is
             always false, so that stale value is the zero-radius disc, i.e.
             nothing. */
          style={
            coarse
              ? { WebkitMaskImage: "none", maskImage: "none" }
              : { WebkitMaskImage: mask, maskImage: mask }
          }
          animate={{ opacity: coarse && !shown ? 0 : 1 }}
          transition={{ duration: reduce ? 0.001 : 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          <Image
            src={photo}
            alt=""
            width={928}
            height={743}
            className="pointer-events-none absolute max-w-none object-cover"
            style={{
              width: `${box[0]}%`,
              height: `${box[1]}%`,
              left: `${box[2]}%`,
              top: `${box[3]}%`,
            }}
          />
        </motion.div>
      </div>

      {/* the lens outline — a hairline ring around the disc, riding with the
          pointer alongside the real cursor */}
      <motion.span
        aria-hidden
        className="pointer-events-none absolute left-0 top-0 rounded-full border border-white/90 shadow-[0_2px_14px_0_rgba(0,0,0,0.10)] ring-1 ring-black/[0.08]"
        style={{
          x: ringX,
          y: ringY,
          width: ringSize,
          height: ringSize,
          opacity: open,
        }}
      />
      {coarse ? (
        /* Touch's route to the reveal: the cities page's switcher, mono ⇄
           colour. A tap on a photograph promises nothing on its own, so the
           card carries the same control the rest of the site uses for
           "this picture has two states".

           Top-left, because the bottom of the well is the dissolve and
           anything sitting in it is washed out by Ellipse 42. */
        <IconSwitcher
          value={shown ? "colour" : "mono"}
          onChange={(next) => setShown(next === "colour")}
          options={TONE_OPTIONS}
          label={`${name} — photo tone`}
          layoutId={`portrait-switcher-${photo}`}
          className="absolute left-[10px] top-[10px] z-10 flex-row"
        />
      ) : (
        <span className="sr-only">
          {name} — hover to see this photo in colour
        </span>
      )}
    </div>
  );
}
