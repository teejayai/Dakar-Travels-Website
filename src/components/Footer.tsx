/* Footer — Figma 36339:288840: a 1424×433 band inset 44px from the edges of the
   1512 frame (so it never runs edge-to-edge on wide screens). Earth mark
   top-left, oversized wordmark with a centre-weighted grey gradient, tagline /
   copyright row, and the two blurred brand blobs drifting behind it. */

import Image from "next/image";

export default function Footer() {
  return (
    <div className="w-full px-4 sm:px-[2.9%]">
      <footer className="relative isolate mx-auto w-full max-w-[1424px] overflow-hidden">
        {/* Ellipse 43 — #A4E9F9, 216px, bleeding off the bottom-left */}
        <div
          aria-hidden
          className="footer-blob-a pointer-events-none absolute bottom-[-13%] left-[-6.5%] -z-10 aspect-square w-[max(120px,15.2%)] rounded-full bg-[#a4e9f9] opacity-60 blur-[55px] sm:opacity-100 sm:blur-[93px]"
        />
        {/* Ellipse 44 — #8BF9B5, 164px, top-right */}
        <div
          aria-hidden
          className="footer-blob-b pointer-events-none absolute right-0 top-[-5.5%] -z-10 aspect-square w-[max(100px,11.5%)] rounded-full bg-[#8bf9b5] opacity-60 blur-[55px] sm:opacity-100 sm:blur-[93px]"
        />

        {/* rails: logo + tagline sit 109px in, the copyright 102px from the
            right edge of the 1424px band (Figma 36339:288844 / :288845) */}
        <div className="w-full px-5 pb-[clamp(48px,7.4vw,112px)] pt-[clamp(44px,5.5vw,83px)] sm:pl-[7.65%] sm:pr-[7.16%]">
          <Image
            src="/icons/earth.svg"
            alt=""
            width={32}
            height={32}
            unoptimized
            className="size-8"
          />

          <p className="mt-[-0.085em] bg-gradient-to-r from-[rgba(147,147,147,0)] via-[#2d2d2d] to-[rgba(147,147,147,0)] bg-clip-text text-center text-[clamp(38px,12.4vw,188px)] font-normal leading-[1.255] tracking-[-0.03em] text-transparent">
            Dakar Travels
          </p>

          <div className="mt-[-0.17em] flex items-center justify-between gap-4 text-[12px] font-light leading-[18px] tracking-[-0.28px] text-[#919191] sm:text-[14px]">
            <span>Find a city by feeling</span>
            <span className="text-right">© 2026 · Made with love</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
