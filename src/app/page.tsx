"use client";

import { useLayoutEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import LandmarkStrip from "@/components/LandmarkStrip";
import { consumeReturnState } from "@/components/returnState";

export default function Home() {
  const [query, setQuery] = useState("");

  /* When arriving via Go Back, skip the entrance choreography — only the
     returning landmark should move. (Child effects consume the storage
     first; we read the cached value.) */
  const [returning, setReturning] = useState(false);
  useLayoutEffect(() => {
    if (consumeReturnState()) setReturning(true);
  }, []);

  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-background">
      <Navbar />

      {/* Faint city skyline behind everything */}
      <motion.div
        key={returning ? "sky-r" : "sky-in"}
        initial={returning ? false : { opacity: 0 }}
        animate={{ opacity: 0.08 }}
        transition={{ duration: 1.2, ease: "easeOut", delay: 0.4 }}
        className="pointer-events-none absolute inset-x-0 bottom-0 z-0 flex justify-center"
        aria-hidden
      >
        <Image
          src="/landmarks/skyline.svg"
          alt=""
          width={1514}
          height={646}
          className="h-auto w-full max-w-none object-cover object-bottom"
          priority
        />
      </motion.div>

      <Hero key={returning ? "hero-r" : "hero-in"} instant={returning} query={query} setQuery={setQuery} />

      <LandmarkStrip query={query} />

      {/* Layer-blur fade (Figma node 503:3770) — two layers:
          a heavy 67.55px layer-blur haze plus a crisp gradient floor that
          guarantees the illustrations' baseline never shows. */}
      <div
        aria-hidden
        className="pointer-events-none absolute z-[25] h-[380px]"
        style={{
          left: "-257px",
          right: "-257px",
          bottom: "-80px",
          background:
            "linear-gradient(180deg, rgba(241,241,241,0) 0%, rgba(241,241,241,0.9) 28%, #f1f1f1 48%)",
          filter: "blur(67.55px)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[25] h-[150px]"
        style={{
          background:
            "linear-gradient(180deg, rgba(250,250,250,0) 0%, rgba(250,250,250,0.9) 45%, #fafafa 80%)",
        }}
      />
    </main>
  );
}
