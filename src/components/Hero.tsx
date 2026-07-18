"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CITIES } from "./cities";

const EASE = [0.22, 1, 0.36, 1] as const;
const HEADLINE = "Find a city in India by feeling, not by list.";

const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.045, delayChildren: 0.35 },
  },
};

const word = {
  hidden: { y: "0.9em", opacity: 0 },
  show: { y: 0, opacity: 1, transition: { duration: 0.7, ease: EASE } },
};

/** Small decorative icon that pops in, then gently floats forever. */
function FloatingIcon({
  src,
  className,
  delay,
  drift,
  width,
  height,
  instant,
}: {
  src: string;
  className: string;
  delay: number;
  drift: number;
  width: number;
  height: number;
  instant?: boolean;
}) {
  return (
    <motion.div
      className={className}
      initial={instant ? false : { scale: 0, opacity: 0, rotate: -20 }}
      animate={{ scale: 1, opacity: 1, rotate: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 16, delay }}
    >
      <motion.div
        animate={{ y: [0, drift, 0], rotate: [-3, 3, -3] }}
        transition={{ duration: 5.5, ease: "easeInOut", repeat: Infinity }}
      >
        <Image src={src} alt="" width={width} height={height} unoptimized />
      </motion.div>
    </motion.div>
  );
}

export default function Hero({
  query,
  setQuery,
  instant = false,
}: {
  query: string;
  setQuery: (v: string) => void;
  instant?: boolean;
}) {
  const router = useRouter();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim().toLowerCase();
    if (!q) return;
    const match = CITIES.find((c) => c.name.toLowerCase().includes(q));
    if (match) router.push(`/cities/${match.name.toLowerCase()}`);
  };

  return (
    <section className="pointer-events-none relative z-30 mx-auto flex min-h-screen max-w-[720px] flex-col items-center px-4 pt-[17vh] text-center sm:px-6 sm:pt-[20vh]">
      {/* Floating icons flanking the headline */}
      <FloatingIcon
        src="/icons/camera.svg"
        instant={instant}
        width={50}
        height={41}
        delay={0.9}
        drift={-14}
        className="absolute left-[4%] top-[21vh] hidden w-[50px] sm:block lg:left-[10%]"
      />
      <FloatingIcon
        src="/icons/tree-sunset.svg"
        instant={instant}
        width={39}
        height={48}
        delay={1.05}
        drift={12}
        className="absolute right-[4%] top-[25vh] hidden w-[40px] sm:block lg:right-[10%]"
      />

      {/* Headline */}
      <motion.h1
        variants={container}
        initial={instant ? "show" : "hidden"}
        animate="show"
        className="flex flex-wrap justify-center text-[clamp(34px,6vw,52px)] font-medium leading-[1.12] tracking-[-0.02em] text-headline"
      >
        {HEADLINE.split(" ").map((w, i) => (
          <span key={i} className="mr-[0.28em] inline-block overflow-hidden py-[0.04em]">
            <motion.span variants={word} className="inline-block">
              {w}
            </motion.span>
          </span>
        ))}
      </motion.h1>

      {/* Subtitle */}
      <motion.p
        initial={instant ? false : { y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: EASE, delay: 0.95 }}
        className="mt-6 text-[15px] font-light tracking-[-0.02em] text-muted"
      >
        Start typing to narrow the world
      </motion.p>

      {/* Search */}
      <motion.form
        onSubmit={onSubmit}
        initial={instant ? false : { y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.65, ease: EASE, delay: 1.05 }}
        className="pointer-events-auto mt-7 flex w-full max-w-[581px] items-center gap-2.5 sm:gap-[17px]"
      >
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search cities… Delhi, Kochi, Mumbai"
          className="h-[50px] w-full min-w-0 flex-1 rounded-[70px] border border-hairline bg-white pl-4 pr-4 text-[14px] font-light tracking-[-0.42px] text-[#2d2d2d] placeholder:font-light placeholder:text-muted shadow-[0_1px_2px_rgba(0,0,0,0.03)] outline-none transition-shadow focus:shadow-[0_0_0_3px_rgba(126,255,95,0.25)] sm:pl-[23px] sm:pr-6"
        />
        <button
          type="submit"
          className="flex h-[50px] shrink-0 items-center rounded-full border-[1.5px] border-white px-6 text-[15px] font-normal tracking-[-0.48px] text-green-ink shadow-[0_2px_13.9px_0_rgba(0,0,0,0.02)] transition-transform duration-300 hover:scale-[1.03] active:scale-95 sm:px-[34px] sm:text-[16px]"
          style={{ backgroundImage: "linear-gradient(180deg, #fafafa 0%, #7eff5f 62%)" }}
        >
          Search
        </button>
      </motion.form>
    </section>
  );
}
