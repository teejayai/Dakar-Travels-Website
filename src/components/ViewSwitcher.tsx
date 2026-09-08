"use client";

/* View switcher — Figma 36339:288858.
   33.78×63.56 glass pill, 4px padding/gap, two 25.78px buttons (3.22px radius)
   holding the 19.33px brush / video-01 exports. Selected button sits on #f6f6f6. */

/* eslint-disable @next/next/no-img-element */

import { motion } from "framer-motion";

export type CityView = "illustration" | "motion";

const EASE = [0.22, 1, 0.36, 1] as const;

const BUTTON =
  /* the ::after gives a ~44px touch target without disturbing the 25.78px box */
  "relative flex size-[25.78px] shrink-0 items-center justify-center rounded-[3.22px] after:absolute after:left-1/2 after:top-1/2 after:size-[44px] after:-translate-x-1/2 after:-translate-y-1/2 after:content-[''] lg:after:hidden";

export default function ViewSwitcher({
  value,
  onChange,
  className,
  layoutId = "view-switcher-pill",
}: {
  value: CityView;
  onChange: (next: CityView) => void;
  /* Must set a flex direction — the base class deliberately does not, so the
     same control can sit vertically in a rail or horizontally in a toolbar. */
  className?: string;
  /* Distinct per mounted instance. The cities index renders one for the
     toolbar and one for the rail (only ever one visible), and a shared
     `layoutId` would make framer try to animate the pill between them. */
  layoutId?: string;
}) {
  const item = (view: CityView, icon: string, label: string) => (
    <button
      type="button"
      aria-label={label}
      aria-pressed={value === view}
      onClick={() => onChange(view)}
      className={`${BUTTON} ${value === view ? "cursor-default" : "cursor-pointer hover:bg-black/[0.03]"}`}
    >
      {/* the selected pill slides between the two buttons */}
      {value === view && (
        <motion.span
          layoutId={layoutId}
          transition={{ duration: 0.42, ease: EASE }}
          className="absolute inset-0 rounded-[3.22px] bg-[#f6f6f6]"
        />
      )}
      <img
        alt=""
        src={`/icons/detail/${icon}.svg`}
        className="relative block size-[19.33px]"
      />
    </button>
  );

  return (
    <div
      role="group"
      aria-label="City view"
      className={`flex gap-1 rounded-[6px] border-[0.5px] border-white bg-white/56 p-1 shadow-[0_2px_13.9px_0_rgba(0,0,0,0.02)] backdrop-blur-[13.5px] ${className ?? ""}`}
    >
      {item("illustration", "brush", "Illustration view")}
      {item("motion", "video-01", "Motion view")}
    </div>
  );
}
