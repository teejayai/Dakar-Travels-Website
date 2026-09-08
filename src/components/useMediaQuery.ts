"use client";

/* One `matchMedia` subscription per query, read through `useSyncExternalStore`
   so it is SSR-safe: the server snapshot is always `false`, which is what makes
   the *desktop* composition the pre-hydration paint. Anything gated on this
   therefore has to be an enhancement — a sheet instead of a dialog, a tap
   affordance instead of a hover — never the only way to reach something. */

import { useCallback, useSyncExternalStore } from "react";

export function useMediaQuery(query: string) {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    [query],
  );

  const snapshot = useCallback(
    () => window.matchMedia(query).matches,
    [query],
  );

  return useSyncExternalStore(subscribe, snapshot, () => false);
}

/* Touch and pen: no hover to hang an interaction off, so anything that is
   hover-only needs a tap route as well. `any-pointer: coarse` rather than
   `pointer: coarse` so a laptop with a touchscreen gets both. */
export const useCoarsePointer = () =>
  useMediaQuery("(hover: none), (any-pointer: coarse)");

/* Phones get the bottom sheet; the centred dialog starts at `sm`. */
export const useSheet = () => useMediaQuery("(max-width: 639px)");
