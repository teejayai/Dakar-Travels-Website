"use client";

/* Motion hero — Figma 36350:289714: a 1000×426 block, 11px radius, clipped,
   sitting 179px down the page and melting into the background at its bottom
   edge (the same haze the illustration hero uses).
   No city ships a video yet, so the block renders a mock frame until one is
   added to CityInfo.video. */

export default function CityVideo({
  src,
  poster,
  label,
}: {
  src?: string;
  poster?: string;
  label: string;
}) {
  return (
    <div
      className="relative aspect-[1000/426] w-full overflow-hidden rounded-[11px] bg-black"
      style={{
        WebkitMaskImage: "linear-gradient(to bottom, #000 78%, transparent 100%)",
        maskImage: "linear-gradient(to bottom, #000 78%, transparent 100%)",
      }}
    >
      {src ? (
        <video
          src={src}
          poster={poster}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-label={label}
          className="size-full object-cover"
        />
      ) : (
        /* mock frame: a slow sheen so the placeholder reads as footage, not a
           failed asset */
        <div aria-label={`${label} — video coming soon`} role="img" className="size-full">
          <div className="video-mock-sheen absolute inset-0" />
          <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_0%,rgba(126,255,95,0.10),transparent_60%)]" />
        </div>
      )}
    </div>
  );
}
