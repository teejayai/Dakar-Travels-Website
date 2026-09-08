"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useContact } from "@/components/ContactModal";

const EASE = [0.22, 1, 0.36, 1] as const;

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const contact = useContact();
  const pathname = usePathname();
  // the Cities link reads as current on /cities (but not on a city detail page)
  const onCities = pathname === "/cities";
  const onAbout = pathname === "/about";

  return (
    <motion.nav
      initial={{ y: -28, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: EASE, delay: 0.05 }}
      className="fixed inset-x-0 top-[30px] z-50 flex justify-center px-4 md:top-[50px]"
    >
      <div className="relative w-full max-w-[632px]">
        <div className="flex w-full items-center justify-between gap-2 rounded-full border border-white bg-white/40 px-2 py-2 pl-3 shadow-[0_0_20.9px_0_rgba(0,0,0,0.04)] backdrop-blur-md sm:gap-4 sm:px-3 sm:py-3 sm:pl-4">
          {/* Brand — left; mark and wordmark both go home */}
          <Link
            href="/"
            aria-label="Dakar Travels — home"
            className="flex items-center gap-1.5 rounded-full outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-green-500/60"
          >
            <Image
              src="/icons/earth.svg"
              alt=""
              width={32}
              height={32}
              className="h-8 w-8"
              priority
              unoptimized
            />
            <span className="whitespace-nowrap text-[14px] font-normal tracking-[-0.42px] text-[#2d2d2d]">
              Dakar Travels
            </span>
          </Link>

          {/* Right side: links (desktop) + Contact + menu (mobile) */}
          <div className="flex items-center gap-2 sm:gap-6">
            <div className="hidden items-center gap-6 sm:flex">
              <Link
                href="/cities"
                aria-current={onCities ? "page" : undefined}
                className={`text-[14px] font-light tracking-[-0.42px] transition-colors hover:text-[#2d2d2d] ${
                  onCities ? "text-[#2d2d2d]" : "text-muted"
                }`}
              >
                Cities
              </Link>
              <Link
                href="/about"
                aria-current={onAbout ? "page" : undefined}
                className={`text-[14px] font-light tracking-[-0.42px] transition-colors hover:text-[#2d2d2d] ${
                  onAbout ? "text-[#2d2d2d]" : "text-muted"
                }`}
              >
                About us
              </Link>
            </div>
            <button
              type="button"
              onClick={contact.open}
              className="flex h-[38px] cursor-pointer items-center rounded-full border border-white px-4 text-[13px] font-light tracking-[-0.42px] text-green-ink shadow-[0_2px_13.9px_0_rgba(0,0,0,0.02)] outline-none transition-transform duration-300 hover:scale-[1.03] active:scale-95 focus-visible:ring-2 focus-visible:ring-green-500/60 sm:h-[45px] sm:px-[34px] sm:text-[14px]"
              style={{
                backgroundImage:
                  "linear-gradient(180deg, #fafafa 0%, #d0ffbf 350%)",
              }}
            >
              Contact Us
            </button>
            {/* Menu icon — mobile only */}
            <button
              type="button"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
              className="flex size-[38px] items-center justify-center rounded-full border border-white bg-white/60 shadow-[0_2px_13.9px_0_rgba(0,0,0,0.02)] transition-transform active:scale-90 sm:hidden"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                {open ? (
                  <path
                    d="M6 6l12 12M18 6 6 18"
                    stroke="#9e9e9e"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                ) : (
                  <path
                    d="M4 7h16M4 12h16M4 17h16"
                    stroke="#9e9e9e"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile dropdown — same glass language */}
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ y: -8, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -8, opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.25, ease: EASE }}
              className="absolute inset-x-0 top-[calc(100%+8px)] flex flex-col overflow-hidden rounded-[22px] border border-white bg-white/70 p-2 shadow-[0_8px_30px_0_rgba(0,0,0,0.06)] backdrop-blur-md sm:hidden"
            >
              {[
                { label: "Cities", href: "/cities" },
                { label: "About us", href: "/about" },
              ].map(({ label, href }) => (
                <Link
                  key={label}
                  href={href}
                  onClick={() => setOpen(false)}
                  className="rounded-full px-4 py-3 text-[14px] font-light tracking-[-0.42px] text-[#2d2d2d] transition-colors active:bg-white"
                >
                  {label}
                </Link>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
}
