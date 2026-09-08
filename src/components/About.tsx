"use client";

/* About us — Figma 36565:75440 (1512 frame).
   Every measurement below is transcribed from that frame; where a value has to
   scale it is written as a ratio of the frame (or of its own box) rather than
   re-guessed at each breakpoint.

   Frame rails: content column 1222px at x=145; the illustration band is a
   slightly wider 1232px (x=140) and stays centred. Navbar and Footer are the
   existing shared components — the design's nav pill and 1424×433 footer band
   are those components verbatim. */

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import SkyBand from "@/components/SkyBand";
import PortraitReveal from "@/components/PortraitReveal";
import { useContact } from "@/components/ContactModal";
import { useCoarsePointer } from "@/components/useMediaQuery";

const EASE = [0.22, 1, 0.36, 1] as const;

const MotionImage = motion.create(Image);

/* Same entrance as CityDetail's `rise`, driven by scroll for the lower
   sections so the page reveals as it is read.

   `prefers-reduced-motion` is honoured here in JS, not in CSS: the block in
   `globals.css` clamps CSS animations only, and every entrance on this page is
   a framer one. Reduced motion keeps the fade and drops the travel. */
const rise = (delay = 0, reduce = false) =>
  reduce
    ? {
        initial: { opacity: 0 },
        whileInView: { opacity: 1 },
        viewport: { once: true, amount: 0.25 },
        transition: { duration: 0.25, ease: EASE, delay: delay * 0.5 },
      }
    : {
        initial: { y: 24, opacity: 0 },
        whileInView: { y: 0, opacity: 1 },
        viewport: { once: true, amount: 0.25 },
        transition: { duration: 0.6, ease: EASE, delay },
      };

/* Centre-weighted grey gradient the headings clip to (36565:75442 / 75456 /
   75498 all use the same three stops, only the offsets differ). */
const GRADIENT_TEXT =
  "bg-gradient-to-r bg-clip-text text-transparent [-webkit-background-clip:text]";

/* Card shell — 390×N white panel, 10px radius, with a 382px inner well inset
   by 4px whose gradient runs #fafafa → white from 52.46%. */
const CARD = "overflow-hidden rounded-[10px] bg-white";

/* Hovering a value card lifts it a little and warms its shadow; everything
   inside — the number, the ground haze, the illustration — is driven by the
   same `rest`/`hover` labels, so one pointer event moves the whole card rather
   than four things that have to agree with each other. */
const CARD_HOVER: Variants = {
  rest: { y: 0, boxShadow: "0 0 0 0 rgba(0,0,0,0)" },
  hover: { y: -4, boxShadow: "0 10px 30px 0 rgba(0,0,0,0.05)" },
};

/* Each illustration moves the way its subject would: the bike rolls off and
   settles, the balloon lifts and drifts, the boat rocks on its swell. They keep
   running while the pointer is over the card (`repeatType: "mirror"`), because
   a single one-shot nudge reads as a glitch on a slow hover. */
const ICON_MOTION: Record<string, Variants> = {
  bicycle: {
    rest: { x: 0, y: 0, rotate: 0 },
    hover: {
      x: [0, 5, 9],
      y: [0, -1.5, 0],
      rotate: [0, -3, 0],
      transition: { duration: 1.5, ease: "easeInOut", repeat: Infinity, repeatType: "mirror" },
    },
  },
  balloon: {
    rest: { x: 0, y: 0, rotate: 0 },
    hover: {
      y: [0, -7],
      x: [0, 2.5],
      rotate: [0, 3],
      transition: { duration: 1.9, ease: "easeInOut", repeat: Infinity, repeatType: "mirror" },
    },
  },
  boat: {
    rest: { x: 0, y: 0, rotate: 0 },
    hover: {
      y: [0, 2],
      rotate: [-3.5, 3.5],
      transition: { duration: 1.4, ease: "easeInOut", repeat: Infinity, repeatType: "mirror" },
    },
  },
};
const WELL =
  "relative overflow-hidden rounded-[6px] bg-gradient-to-b from-[#fafafa] from-[52.46%] to-white";

/* The number sitting in each well's top-right corner (x=355 of 382, y=10). */
function WellIndex({ children }: { children: string }) {
  return (
    <motion.p
      variants={{ rest: { color: "#919191" }, hover: { color: "#303030" } }}
      transition={{ duration: 0.3, ease: EASE }}
      className="absolute right-[10px] top-[10px] text-[16px] font-light leading-[22px] tracking-[-0.32px]"
    >
      {children}
    </motion.p>
  );
}

/* Ellipse 42 — the committed 342×83 white oval with 34.7px of Gaussian blur
   (public/landmarks/baseline-fade.svg). Its canvas carries that blur as bleed
   on all four sides, so the box is placed at the ellipse's position minus
   34.7px and sized 411.4×152.4 — expressed here as a share of the 382×149
   well so it tracks the card at every width. */
function BaselineFade() {
  return (
    <MotionImage
      variants={{ rest: { scaleX: 1, opacity: 1 }, hover: { scaleX: 1.06, opacity: 0.92 } }}
      transition={{ duration: 0.5, ease: EASE }}
      width={412}
      height={153}
      unoptimized
      alt=""
      src="/landmarks/baseline-fade.svg"
      aria-hidden
      className="pointer-events-none absolute left-[-3.85%] top-[59.26%] h-[102.28%] w-[107.7%] max-w-none"
    />
  );
}

/* The 60px illustrations carry transparent bleed in their own canvas, so the
   asset box is larger than the 60px slot (insets read off the Figma node).
   Outer div is the designed 60px box; the img is the bleeding leaf. */
function WellIcon({
  src,
  alt,
  leaf,
  motionVariants,
  playInView,
}: {
  src: string;
  alt: string;
  /* [width, height, left, top] of the leaf as a share of the 60px box */
  leaf: [string, string, string, string];
  motionVariants?: Variants;
  /* touch: run the loop while the card is on screen, since there is no
     pointer to rest over it */
  playInView?: boolean;
}) {
  const [w, h, left, top] = leaf;
  return (
    /* The 60px slot never moves — the leaf inside it does, so the icon can
       travel outside its box without the well reflowing. */
    <div className="pointer-events-none absolute left-1/2 top-1/2 size-[60px] -translate-x-1/2 -translate-y-1/2">
      <motion.div
        variants={motionVariants}
        /* The card's `hover` label reaches this leaf by propagation on a
           pointer device. On touch nothing ever sets that label, so the leaf
           drives itself from its own in-view state — the *card* stays still
           either way, so a scrolling phone does not get three cards lifting
           and dropping as it goes. */
        {...(playInView
          ? {
              initial: "rest" as const,
              whileInView: "hover" as const,
              viewport: { amount: 0.9 },
            }
          : {})}
        className="absolute"
        style={{ width: w, height: h, left, top }}
      >
        <Image
          src={src}
          alt={alt}
          width={90}
          height={90}
          unoptimized
          className="size-full max-w-none"
        />
      </motion.div>
    </div>
  );
}

/* 36565:75459 / 75471 / 75489 — icon well over a 58px text block. */
const VALUES: {
  index: string;
  title: string;
  body: string;
  icon: {
    src: string;
    leaf: [string, string, string, string];
    motion: keyof typeof ICON_MOTION;
  };
}[] = [
  {
    index: "01",
    title: "Local knowledge first",
    body: "Our guides are written by people who live and travel in these cities, not assembled from listings data.",
    icon: {
      src: "/icons/about/bicycle.svg",
      leaf: ["137.5%", "143.75%", "-15.63%", "-21.88%"],
      motion: "bicycle",
    },
  },
  {
    index: "02",
    title: "Honest recommendations",
    body: "No paid placements and no sponsored rankings. Destinations appear because they fit what you asked for.",
    icon: {
      src: "/icons/about/hot-air-balloon.svg",
      leaf: ["131.25%", "146.88%", "-15.63%", "-21.88%"],
      motion: "balloon",
    },
  },
  {
    index: "03",
    title: "Support at every stage",
    body: "From the first search to the return flight, a real person is available whenever plans need to change.",
    icon: {
      src: "/icons/about/boat-sailing.svg",
      leaf: ["140.63%", "121.88%", "-21.88%", "-3.13%"],
      motion: "boat",
    },
  },
];

/* 36565:75500 / 75508 / 75516 — portraits sit in the same 382px well as the
   value cards, only 304px tall. `mix-blend-luminosity` over the white-ish
   gradient is what greys them out in the design; the photo box is positioned
   as a share of the well, straight from the node's own frame. */
const TEAM: {
  index: string;
  name: string;
  role: string;
  photo: string;
  /* [width, height, left, top] of the photo as a share of the 382×304 well */
  box: [number, number, number, number];
}[] = [
  {
    index: "01",
    name: "Aarti Menon",
    role: "Founder & Managing Director",
    photo: "/about/team-1.webp",
    box: [121.36, 122.04, -10.68, 12.5],
  },
  {
    index: "02",
    name: "Devansh Rao",
    role: "Head of Product",
    photo: "/about/team-2.webp",
    box: [121.36, 122.04, -10.68, 12.5],
  },
  {
    index: "03",
    name: "Karan Sethi",
    role: "Head of Travel Operations",
    photo: "/about/team-3.webp",
    box: [134.29, 253.1, -15.97, -54.93],
  },
];

/* The portraits are cut-outs, and a cut-out's edge stays legible under white
   paint however soft the paint is — Ellipse 42 lightens the shoulders but the
   silhouette still reads. So the photograph itself is faded out: a mask takes
   it to nothing between `FADE_FROM` and `FADE_TO` of the *well*, which is where
   the ellipse has already done most of its work, and there is then no edge left
   to cover. Stops are solved per card because each photo box sits differently
   in the well. */
const FADE_FROM = 66;
const FADE_TO = 99;

const dissolve = ([, height, , top]: [number, number, number, number]) => {
  const at = (wellPct: number) => ((wellPct - top) / height) * 100;
  return `linear-gradient(to bottom, #000 ${at(FADE_FROM).toFixed(2)}%, transparent ${at(FADE_TO).toFixed(2)}%)`;
};

/* the same dissolve for an element that fills the well rather than sitting
   inside it at the photo's offset */
const WELL_DISSOLVE = `linear-gradient(to bottom, #000 ${FADE_FROM}%, transparent ${FADE_TO}%)`;

export default function About() {
  /* The card lift is a single small move, so it stays; the illustrations' hover
     loops are the part that keeps oscillating, so those are what get dropped. */
  const reduce = useReducedMotion();
  const contact = useContact();
  const coarse = useCoarsePointer();
  /* every `{...enter(d)}` below is `rise(d)` with this page's motion
     preference already folded in */
  const enter = (delay = 0) => rise(delay, !!reduce);

  return (
    <>
      {/* Hero — 36565:75441, a 459px centred column starting 179px down the
          frame (under the fixed navbar). */}
      <section className="mx-auto w-full max-w-[459px] px-4 pt-[clamp(132px,11.8vw,179px)] text-center">
        <motion.h1
          initial={reduce ? { opacity: 0 } : { y: 20, opacity: 0 }}
          animate={reduce ? { opacity: 1 } : { y: 0, opacity: 1 }}
          transition={{ duration: reduce ? 0.3 : 0.7, ease: EASE, delay: 0.15 }}
          className={`${GRADIENT_TEXT} from-[#939393] from-[15.795%] via-[#2d2d2d] via-[50.49%] to-[#939393] to-[85.185%] text-[clamp(32px,3.18vw,48px)] font-normal leading-[1.25] tracking-[-0.03em]`}
        >
          Travel planning, without the guesswork.
        </motion.h1>
        <motion.p
          initial={reduce ? { opacity: 0 } : { y: 16, opacity: 0 }}
          animate={reduce ? { opacity: 1 } : { y: 0, opacity: 1 }}
          transition={{ duration: reduce ? 0.3 : 0.7, ease: EASE, delay: reduce ? 0.15 : 0.3 }}
          className="mt-3 text-[15px] font-light leading-[22px] tracking-[-0.32px] text-[#919191] sm:text-[16px]"
        >
          We help travellers find the right destination and plan the trip around
          it — with honest guides, local knowledge and support from the first
          search to the journey home.
        </motion.p>
      </section>

      {/* Illustration band — Component 17 (36570:75642), the day ⇄ evening
          variant pair, rebuilt from its layers in `SkyBand` so the plane can
          fly.

          Below `lg` the band takes the page's own gutter (`px-4` / `sm:px-6`,
          the same rails as every other section) rather than running edge to
          edge; at `lg` it goes back to the frame's full-bleed 1232px.

          Two things dissolve the bottom edge, and both are needed. `SkyBand`
          fades its *own* sky to `--background` — the only way to be sure there
          is no cut, since a plate can only cover a hard edge, never remove it.
          The plate here is then Rectangle 34624285 (1890×413 at y=1067 with a
          37.8px blur), which carries the band into the section below and is
          positioned as a share of the band. */}
      <div className="relative mt-[clamp(36px,4vw,60px)]">
        <motion.div
          initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.985 }}
          animate={reduce ? { opacity: 1 } : { opacity: 1, scale: 1 }}
          transition={{ duration: reduce ? 0.3 : 0.9, ease: EASE, delay: reduce ? 0.2 : 0.4 }}
          className="relative mx-auto w-full max-w-[1232px] px-4 sm:px-6 lg:px-0"
        >
          <SkyBand />
        </motion.div>
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-[86.3%] h-[63.5%] w-[153%] -translate-x-1/2 bg-background"
          style={{ filter: "blur(clamp(16px,2.5vw,37.8px))" }}
        />
      </div>

      {/* Our Story — 36565:75453: label on the left rail, a 569px column on the
          right of the 1211px row. */}
      <motion.section
        {...enter()}
        className="relative z-10 mx-auto mt-8 flex w-full max-w-[1222px] flex-col gap-8 px-4 sm:px-6 lg:mt-0 lg:flex-row lg:justify-between lg:gap-10 lg:px-[6px]"
      >
        <p className="shrink-0 text-[16px] font-light leading-[22px] tracking-[-0.32px] text-[#919191]">
          Our Story
        </p>
        <div className="flex w-full flex-col gap-4 lg:w-[569px]">
          <h2
            className={`${GRADIENT_TEXT} from-[#939393] via-[#2d2d2d] via-[50%] to-[#939393] text-[clamp(20px,1.6vw,24px)] font-normal leading-[1.42] tracking-[-0.03em]`}
          >
            Choosing where to go is the hardest part of any trip. We make that
            decision simple, then take care of everything that follows.
          </h2>
          <div className="flex flex-col gap-[22px] text-[15px] font-light leading-[22px] tracking-[-0.32px] text-[#919191] sm:text-[16px]">
            <p>
              Dakar Travels was founded in 2019 to make travel across India
              easier to plan and better to experience. Instead of endless lists
              and filters, we start with what kind of trip you want — quiet,
              coastal, culinary, historic — and match you with the cities that
              deliver it.
            </p>
            <p>
              Every destination guide is researched and written by our own team,
              and every itinerary is built with local partners we know
              personally. Today we serve travellers in eight cities, with new
              destinations added as our on-the-ground network grows.
            </p>
          </div>
        </div>
      </motion.section>

      {/* Value cards — 36565:75458, three 390×255 panels with a 26px gutter. */}
      <section className="mx-auto mt-[clamp(48px,4vw,60px)] w-full max-w-[1222px] px-4 sm:px-6 lg:px-0">
        <div className="grid grid-cols-1 gap-[26px] sm:grid-cols-2 lg:grid-cols-3">
          {VALUES.map((v, i) => (
            <motion.article
              key={v.index}
              {...enter(i * 0.08)}
              /* `hover` is a label, so it reaches the number, the haze and the
                 illustration without each of them wiring up its own listener;
                 `whileTap` gives touch, which has no hover, the same beat. */
              className="rounded-[10px]"
            >
              <motion.div
                initial="rest"
                whileHover="hover"
                whileTap="hover"
                variants={CARD_HOVER}
                className={`${CARD} p-1`}
              >
                <div className={`${WELL} aspect-[382/149] w-full`}>
                  <BaselineFade />
                  <WellIcon
                    src={v.icon.src}
                    alt=""
                    leaf={v.icon.leaf}
                    motionVariants={
                      reduce ? undefined : ICON_MOTION[v.icon.motion]
                    }
                    playInView={!reduce && coarse}
                  />
                  <WellIndex>{v.index}</WellIndex>
                </div>
                <div className="flex flex-col gap-1 px-[10px] pb-[22px] pt-[22px]">
                  <h3 className="text-[14px] font-normal tracking-[-0.42px] text-[#303030]">
                    {v.title}
                  </h3>
                  <p className="text-[14px] font-light leading-[18px] tracking-[-0.28px] text-[#919191]">
                    {v.body}
                  </p>
                </div>
              </motion.div>
            </motion.article>
          ))}
        </div>
      </section>

      {/* Meet the Team — 36565:75497: 32px heading, then three 390×420 cards
          with a 30px gap between heading and row. */}
      <section className="mx-auto mt-[clamp(56px,5vw,60px)] w-full max-w-[1222px] px-4 sm:px-6 lg:px-0">
        <motion.h2
          {...enter()}
          className={`${GRADIENT_TEXT} from-[#939393] from-[10.298%] via-[#2d2d2d] via-[49.429%] to-[#939393] to-[108.75%] text-[clamp(26px,2.1vw,32px)] font-normal leading-[1.28] tracking-[-0.03em]`}
        >
          Meet the Team
        </motion.h2>
        <div className="mt-[30px] grid grid-cols-1 gap-[26px] sm:grid-cols-2 lg:grid-cols-3">
          {TEAM.map((m, i) => (
            <motion.article
              key={m.name}
              {...enter(i * 0.08)}
              className={`${CARD} p-1`}
            >
              <div className={`${WELL} aspect-[382/304] w-full`}>
                <Image
                  src={m.photo}
                  alt={m.name}
                  width={928}
                  height={743}
                  className="pointer-events-none absolute max-w-none object-cover mix-blend-luminosity"
                  style={{
                    width: `${m.box[0]}%`,
                    height: `${m.box[1]}%`,
                    left: `${m.box[2]}%`,
                    top: `${m.box[3]}%`,
                    WebkitMaskImage: dissolve(m.box),
                    maskImage: dissolve(m.box),
                  }}
                />
                {/* the hover lens: a colour copy of the same photograph,
                    masked to a disc that follows the pointer */}
                <PortraitReveal
                  photo={m.photo}
                  name={m.name}
                  box={m.box}
                  dissolve={WELL_DISSOLVE}
                />
                {/* Ellipse 42 again, at the team card's 660×209 size — exactly
                    as the node specifies it, since the photo now dissolves on
                    its own and the ellipse only has to carry the glow. */}
                <Image
                  src="/about/team-fade.svg"
                  alt=""
                  width={790}
                  height={339}
                  unoptimized
                  aria-hidden
                  className="pointer-events-none absolute left-[-53.44%] top-[57.19%] h-[111.61%] w-[206.88%] max-w-none"
                />
                <WellIndex>{m.index}</WellIndex>
              </div>
              <div className="flex flex-col gap-1 px-[10px] pb-[22px] pt-[clamp(28px,3.2vw,49px)]">
                <h3 className="text-[14px] font-normal tracking-[-0.42px] text-[#303030]">
                  {m.name}
                </h3>
                <p className="text-[14px] font-light leading-[18px] tracking-[-0.28px] text-[#919191]">
                  {m.role}
                </p>
              </div>
            </motion.article>
          ))}
        </div>
      </section>

      {/* CTA bar — 36565:75524: a 1217×110 white panel, 32/30 padding, luggage
          mark + copy on the left and the two pill buttons on the right. */}
      <motion.section
        {...enter()}
        className="mx-auto mt-[clamp(48px,4.6vw,60px)] w-full max-w-[1222px] px-4 sm:px-6 lg:px-0"
      >
        <div className="flex flex-col gap-6 rounded-[10px] bg-white px-6 py-7 sm:px-8 sm:py-[30px] lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-[14px]">
            <div className="relative size-8 shrink-0">
              <Image
                src="/icons/about/luggage.svg"
                alt=""
                width={32}
                height={48}
                unoptimized
                className="absolute left-0 top-[-25%] h-12 w-8 max-w-none"
              />
            </div>
            <div className="flex flex-col gap-[5px]">
              <p className="text-[15px] font-normal tracking-[-0.48px] text-[#2d2d2d] sm:text-[16px]">
                Ready to plan your next trip?
              </p>
              <p className="max-w-[465px] text-[14px] font-light leading-[18px] tracking-[-0.28px] text-[#919191]">
                Browse our destinations or talk to a travel specialist about a
                custom itinerary.
              </p>
            </div>
          </div>

          {/* stacked and full width on a phone: two pills side by side there
              are ~150px each, which is a target you have to aim at */}
          <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-5">
            <button
              type="button"
              onClick={contact.open}
              className="flex h-[52px] shrink-0 cursor-pointer items-center justify-center rounded-full border-[1.5px] border-white bg-background px-[26px] sm:h-[50px] sm:justify-start text-[15px] font-normal tracking-[-0.48px] text-green-ink shadow-[0_2px_13.9px_0_rgba(0,0,0,0.02)] outline-none transition-transform duration-300 hover:scale-[1.03] active:scale-95 focus-visible:ring-2 focus-visible:ring-green-500/60 sm:px-[34px] sm:text-[16px]"
            >
              Contact Us
            </button>
            <Link
              href="/cities"
              className="flex h-[52px] shrink-0 cursor-pointer items-center justify-center rounded-full border-[1.5px] border-white px-[26px] sm:h-[50px] sm:justify-start text-[15px] font-normal tracking-[-0.48px] text-green-ink shadow-[0_2px_13.9px_0_rgba(0,0,0,0.02)] transition-transform duration-300 hover:scale-[1.03] active:scale-95 sm:px-[34px] sm:text-[16px]"
              style={{
                backgroundImage:
                  "linear-gradient(180deg, #fafafa 0%, #7eff5f 62.5%)",
              }}
            >
              Explore Destinations
            </Link>
          </div>
        </div>
      </motion.section>
    </>
  );
}
