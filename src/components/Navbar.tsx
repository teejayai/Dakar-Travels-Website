"use client";

import Image from "next/image";
import { motion } from "framer-motion";

const EASE = [0.22, 1, 0.36, 1] as const;

export default function Navbar() {
  return (
    <motion.nav
      initial={{ y: -28, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: EASE, delay: 0.05 }}
      className="fixed inset-x-0 top-[30px] z-50 flex justify-center px-4 md:top-[50px]"
    >
      <div className="flex w-full max-w-[632px] items-center justify-between gap-4 rounded-full border border-white bg-white/40 px-3 py-3 pl-4 shadow-[0_0_20.9px_0_rgba(0,0,0,0.04)] backdrop-blur-md">
        {/* Brand */}
        <a href="#" className="flex items-center gap-1.5">
          <Image src="/icons/earth.svg" alt="" width={32} height={32} className="h-8 w-8" priority />
          <span className="text-[14px] font-normal tracking-[-0.42px] text-[#2d2d2d]">
            Dakar Travels
          </span>
        </a>

        {/* Links + CTA */}
        <div className="flex items-center gap-6">
          <div className="hidden items-center gap-6 sm:flex">
            <a
              href="#"
              className="text-[14px] font-light tracking-[-0.42px] text-muted transition-colors hover:text-[#2d2d2d]"
            >
              Cities
            </a>
            <a
              href="#"
              className="text-[14px] font-light tracking-[-0.42px] text-muted transition-colors hover:text-[#2d2d2d]"
            >
              About us
            </a>
          </div>
          <a
            href="#"
            className="flex h-[45px] items-center rounded-full border border-white px-[34px] text-[14px] font-light tracking-[-0.42px] text-green-ink shadow-[0_2px_13.9px_0_rgba(0,0,0,0.02)] transition-transform duration-300 hover:scale-[1.03] active:scale-95"
            style={{
              backgroundImage:
                "linear-gradient(180deg, #fafafa 0%, #d0ffbf 350%)",
            }}
          >
            Contact Us
          </a>
        </div>
      </div>
    </motion.nav>
  );
}
