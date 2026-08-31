"use client";

/* View switcher — Figma 36339:288858.
   33.78×63.56 glass pill, 4px padding/gap, two 25.78px buttons (3.22px radius)
   holding the 19.33px brush / video-01 exports. Selected button sits on #f6f6f6. */

/* eslint-disable @next/next/no-img-element */

export type CityView = "illustration" | "motion";

const BUTTON =
  "flex size-[25.78px] shrink-0 items-center justify-center rounded-[3.22px] transition-colors duration-200";

export default function ViewSwitcher({
  value,
  onChange,
  className,
}: {
  value: CityView;
  onChange: (next: CityView) => void;
  className?: string;
}) {
  const item = (view: CityView, icon: string, label: string) => (
    <button
      type="button"
      aria-label={label}
      aria-pressed={value === view}
      onClick={() => onChange(view)}
      className={`${BUTTON} ${
        value === view ? "bg-[#f6f6f6]" : "hover:bg-black/[0.03]"
      }`}
    >
      <img
        alt=""
        src={`/icons/detail/${icon}.svg`}
        className="block size-[19.33px]"
      />
    </button>
  );

  return (
    <div
      role="group"
      aria-label="City view"
      className={`flex flex-col gap-1 rounded-[6px] border-[0.5px] border-white bg-white/56 p-1 shadow-[0_2px_13.9px_0_rgba(0,0,0,0.02)] backdrop-blur-[13.5px] ${className ?? ""}`}
    >
      {item("illustration", "brush", "Illustration view")}
      {item("motion", "video-01", "Motion view")}
    </div>
  );
}
