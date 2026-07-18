/* Doodle icons for the city detail page — layered exports from Figma
   (color blob + hand-drawn line art), composited exactly per the design. */

/* eslint-disable @next/next/no-img-element */

const P = "/icons/detail";

export function MapIcon({ className }: { className?: string }) {
  return (
    <div className={className || "relative size-8"}>
      <div className="absolute h-[31px] left-[9px] top-px w-[17px]">
        <div className="absolute inset-[-25.81%_-47.06%]">
          <img alt="" className="block max-w-none size-full" src={`${P}/map-color.svg`} />
        </div>
      </div>
      <div className="absolute h-[22px] left-[4px] top-[5px] w-[24px]">
        <div className="absolute inset-[-2.27%_-2.08%]">
          <img alt="" className="block max-w-none size-full" src={`${P}/map-v1.svg`} />
        </div>
      </div>
      <div className="absolute h-[0.5px] left-[22px] top-[10px] w-[3px]">
        <div className="absolute inset-[-100%_-16.67%]">
          <img alt="" className="block max-w-none size-full" src={`${P}/map-v2.svg`} />
        </div>
      </div>
      <div className="absolute h-[7.5px] left-[6px] top-[11.5px] w-[21.5px]">
        <div className="absolute inset-[-6.67%_-2.33%]">
          <img alt="" className="block max-w-none size-full" src={`${P}/map-v3.svg`} />
        </div>
      </div>
      <div className="absolute h-[9px] left-[22.5px] top-[15.5px] w-[4px]">
        <div className="absolute inset-[-5.56%_-12.5%]">
          <img alt="" className="block max-w-none size-full" src={`${P}/map-v4.svg`} />
        </div>
      </div>
      <div className="absolute h-[6.066px] left-[5.48px] top-[10.93px] w-[4.043px]">
        <div className="absolute inset-[-8.24%_-12.37%]">
          <img alt="" className="block max-w-none size-full" src={`${P}/map-v5.svg`} />
        </div>
      </div>
      <div className="absolute left-[6.5px] size-[2px] top-[12px]">
        <img alt="" className="absolute block inset-0 max-w-none size-full" src={`${P}/map-v6.svg`} />
      </div>
    </div>
  );
}

export function FlowersIcon({ className }: { className?: string }) {
  return (
    <div className={className || "relative size-8"}>
      <div className="absolute h-[24px] left-px top-[6px] w-[29px]">
        <div className="absolute inset-[-33.33%_-27.59%]">
          <img alt="" className="block max-w-none size-full" src={`${P}/flowers-color.svg`} />
        </div>
      </div>
      <div className="absolute h-[23.44px] left-[3.42px] top-[4.23px] w-[25.159px]">
        <div className="absolute inset-[-2.13%_-1.99%]">
          <img alt="" className="block max-w-none size-full" src={`${P}/flowers-v.svg`} />
        </div>
      </div>
    </div>
  );
}

export function EarthIcon({ className }: { className?: string }) {
  return (
    <div className={className || "relative size-8"}>
      <div className="absolute h-[26px] left-[3px] top-[3px] w-[28px]">
        <div className="absolute inset-[-30.77%_-28.57%]">
          <img alt="" className="block max-w-none size-full" src={`${P}/earth-color.svg`} />
        </div>
      </div>
      <div className="absolute left-[2.75px] size-[26.5px] top-[2.75px]">
        <div className="absolute inset-[-1.89%]">
          <img alt="" className="block max-w-none size-full" src={`${P}/earth-v.svg`} />
        </div>
      </div>
    </div>
  );
}

export function MoonIcon({ className }: { className?: string }) {
  return (
    <div className={className || "relative size-8"}>
      <div className="absolute h-[30px] left-[3px] top-px w-[28px]">
        <div className="absolute inset-[-26.67%_-28.57%]">
          <img alt="" className="block max-w-none size-full" src={`${P}/moon-color.svg`} />
        </div>
      </div>
      <div className="absolute h-[25.233px] left-[4.53px] top-[3.77px] w-[22.468px]">
        <div className="absolute inset-[-1.98%_-2.23%]">
          <img alt="" className="block max-w-none size-full" src={`${P}/moon-v.svg`} />
        </div>
      </div>
    </div>
  );
}

export function LuggageIcon({ className }: { className?: string }) {
  return (
    <div className={className || "relative size-8"}>
      <div className="absolute h-[32px] left-[12px] top-0 w-[11px]">
        <div className="absolute inset-[-25%_-72.73%]">
          <img alt="" className="block max-w-none size-full" src={`${P}/luggage-color.svg`} />
        </div>
      </div>
      <div className="absolute h-[22px] left-[3px] top-[6px] w-[12px]">
        <div className="absolute inset-[-2.27%_-4.17%]">
          <img alt="" className="block max-w-none size-full" src={`${P}/luggage-v1.svg`} />
        </div>
      </div>
      <div className="absolute h-[11px] left-[17px] top-[17px] w-[12px]">
        <div className="absolute inset-[-4.55%_-4.17%]">
          <img alt="" className="block max-w-none size-full" src={`${P}/luggage-v2.svg`} />
        </div>
      </div>
    </div>
  );
}
