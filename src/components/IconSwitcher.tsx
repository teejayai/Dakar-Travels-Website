"use client";

/* The cities index' view switcher (Figma 36339:288858), generalised so the
   About page's two touch controls are the *same* control the rest of the site
   already uses: a 33.78px glass pill, 4px padding and gap, 25.78px buttons at a
   3.22px radius, the selected one sitting on #f6f6f6 and sliding between them
   on a shared `layoutId`. Only the icons and the labels change.

   Geometry is transcribed verbatim from `ViewSwitcher` rather than imported —
   that component stays typed to `CityView` and owns the cities page. What is
   shared here is the *shape*, and it is one file so the two cannot drift.

   These switchers are mounted on coarse pointers only (the mouse keeps hover),
   so the 44px `::after` target has no `lg:` escape hatch: every instance of
   this control is being touched. */

/* eslint-disable @next/next/no-img-element */

import { motion } from "framer-motion";

const EASE = [0.22, 1, 0.36, 1] as const;

const BUTTON =
  /* the ::after gives a 44px touch target without disturbing the 25.78px box */
  "relative flex size-[25.78px] shrink-0 items-center justify-center rounded-[3.22px] outline-none focus-visible:ring-2 focus-visible:ring-green-500/60 after:absolute after:left-1/2 after:top-1/2 after:size-[44px] after:-translate-x-1/2 after:-translate-y-1/2 after:content-['']";

export type SwitcherOption<T extends string> = {
  value: T;
  /* path under /icons, without the extension */
  icon: string;
  label: string;
};

export default function IconSwitcher<T extends string>({
  value,
  onChange,
  options,
  label,
  layoutId,
  className,
}: {
  value: T;
  onChange: (next: T) => void;
  options: readonly SwitcherOption<T>[];
  /* names the group, since the buttons themselves carry only icons */
  label: string;
  /* Distinct per mounted instance — a shared `layoutId` would make framer try
     to animate the selected pill between two different switchers. */
  layoutId: string;
  className?: string;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className={`flex gap-1 rounded-[6px] border-[0.5px] border-white bg-white/56 p-1 shadow-[0_2px_13.9px_0_rgba(0,0,0,0.02)] backdrop-blur-[13.5px] ${className ?? ""}`}
    >
      {options.map((o) => {
        const on = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            aria-label={o.label}
            aria-pressed={on}
            onClick={() => onChange(o.value)}
            className={`${BUTTON} ${on ? "cursor-default" : "cursor-pointer hover:bg-black/[0.03]"}`}
          >
            {on && (
              <motion.span
                layoutId={layoutId}
                transition={{ duration: 0.42, ease: EASE }}
                className="absolute inset-0 rounded-[3.22px] bg-[#f6f6f6]"
              />
            )}
            <img
              alt=""
              src={`/icons/${o.icon}.svg`}
              className="relative block size-[19.33px]"
            />
          </button>
        );
      })}
    </div>
  );
}
