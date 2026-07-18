/* Shared one-shot channel for the reverse zoom handoff.
   The first consumer (LandmarkStrip, child effects run first) reads and
   clears sessionStorage; later consumers (page shell, Hero) get the cached
   value so everyone agrees we're "returning" within the same paint. */

export type BackPayload = {
  slug: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

let cached: { back: BackPayload | null; at: number } | null = null;

export function consumeReturnState(): BackPayload | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem("landmark-zoom-back");
    if (raw !== null) {
      sessionStorage.removeItem("landmark-zoom-back");
      cached = { back: JSON.parse(raw) as BackPayload, at: Date.now() };
    }
  } catch {
    /* storage unavailable */
  }
  if (cached && Date.now() - cached.at < 3000) return cached.back;
  return null;
}
