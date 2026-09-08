"use client";

/* Contact Us — Figma 36579:78597.

   A 1027×696 dialog on a `rgba(0,0,0,0.09)` scrim with a 5.45px backdrop blur:
   a 981px panel (415px details column + a 514px form starting at x=444, 26px
   down) and the 36×36 close button parked 10px off its right edge.

   The details column reuses the footer's two brand blobs — Ellipse 43 (#a4e9f9,
   216px) and Ellipse 44 (#8bf9b5, 164px) — at the same 93px CSS blur, which is
   what this frame's own exports carry (their canvases bleed 185.5px, and a
   Figma layer blur of X renders as `blur(X/2)`).

   Opened through `useContact()` so the navbar and the About CTA can both reach
   it; the provider owns the single instance and the page underneath keeps its
   scroll position.

   The form has no backend to post to, so submitting swaps in a confirmation —
   the design does not draw that state, and it is the smallest honest thing to
   do with a form that has to lead somewhere.

   ## Three presentations, one dialog

   | width        | shape                                                      |
   | ------------ | ---------------------------------------------------------- |
   | `< 640`      | bottom sheet: slides up, drag-to-dismiss by its own header  |
   | `640–1079`   | centred card, panel scrolls inside a capped height          |
   | `≥ 1080`     | the Figma composition, absolute offsets on a 981px panel     |

   Below 1080 **the form comes first and the details column follows it** (a CSS
   `order` swap, not a DOM one — at 1080 both are absolutely positioned and
   order stops meaning anything). On a phone the details column is a screenful
   of things you did not open the dialog to read; the form is why you tapped.

   The blobs are only clipped by the *panel* below 1080, never by the details
   column — a column that clips them draws a hard rectangular edge of blue
   across the middle of the panel. */

import Image from "next/image";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import {
  AnimatePresence,
  motion,
  useDragControls,
  useInView,
  useReducedMotion,
  type PanInfo,
} from "framer-motion";
import { CITIES } from "@/components/cities";
import { useSheet } from "@/components/useMediaQuery";

const EASE = [0.22, 1, 0.36, 1] as const;

/* Field underline — Vector 69, a 0.5px #E4E4E4 rule. */
const RULE = "border-b-[0.5px] border-[#e4e4e4]";
/* Field header — 20px #2e2e2e (36586:78886). Each one sets its own leading,
   which is the frame's own block height: 41 for the fields, 32 for the
   destination group, 38 for the brief. */
const HEADER = "text-[20px] tracking-[-0.02em] text-[#2e2e2e]";
/* the hint under it, which the inputs use as their placeholder */
const HINT =
  "text-[16px] font-light leading-[22px] tracking-[-0.28px] placeholder:text-[#cbcbcb] sm:text-[14px]";
/* 20px display line the labels and values share (36579:78689 and friends). */
const DISPLAY =
  "bg-gradient-to-r from-[#939393] via-[#2d2d2d] via-[50%] to-[#939393] bg-clip-text text-transparent [-webkit-background-clip:text]";
/* Chip — same pill as the cities index, 18/12 padding at a 123px radius. Goes
   to a 44px touch target below `sm` and snaps back to the frame's 42px at it. */
const CHIP =
  "flex h-11 shrink-0 cursor-pointer items-center rounded-[123px] px-5 text-[14px] font-light leading-[18px] tracking-[-0.42px] shadow-[0_2px_13.9px_0_rgba(0,0,0,0.02)] outline-none transition-[background-color,color,border-color,box-shadow,transform] duration-200 ease-out active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-green-500/60 sm:h-[42px] sm:px-[18px]";

type ContactValue = { open: () => void; close: () => void; isOpen: boolean };

const ContactCtx = createContext<ContactValue | null>(null);

export function useContact() {
  const ctx = useContext(ContactCtx);
  if (!ctx) throw new Error("useContact must be used inside <ContactProvider>");
  return ctx;
}

export function ContactProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setOpen] = useState(false);
  /* bumped on every open so the dialog remounts — that is what resets the form,
     rather than an effect writing state back on open */
  const [seq, setSeq] = useState(0);
  /* whatever opened the dialog gets focus back when it closes */
  const opener = useRef<HTMLElement | null>(null);

  const open = useCallback(() => {
    opener.current = document.activeElement as HTMLElement | null;
    setSeq((n) => n + 1);
    setOpen(true);
  }, []);
  const close = useCallback(() => {
    setOpen(false);
    /* the lock restores the page's scroll offset as it unwinds, so the focus
       hand-back must not scroll on top of it */
    opener.current?.focus?.({ preventScroll: true });
  }, []);

  return (
    <ContactCtx.Provider value={{ open, close, isOpen }}>
      {children}
      <ContactDialog key={seq} open={isOpen} onClose={close} />
    </ContactCtx.Provider>
  );
}

/* "Kochi", "Kochi and Delhi", "Kochi, Delhi and Mumbai" */
const listed = (names: string[]) =>
  names.length < 2
    ? names.join("")
    : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;

/* ── the dialog ───────────────────────────────────────────────────────────── */

function CopyLine({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center gap-1">
      <p
        className={`${DISPLAY} text-[18px] leading-[34px] tracking-[-0.03em] sm:text-[20px]`}
      >
        {value}
      </p>
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 1600);
          } catch {
            /* clipboard blocked — the value is selectable either way */
          }
        }}
        aria-label={copied ? `${label} copied` : `Copy ${label}`}
        /* the mark stays 18px; the *button* grows to a 44px target on touch
           and the negative margin keeps the line from growing with it */
        className="-my-2 flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full outline-none transition-opacity hover:opacity-60 focus-visible:ring-2 focus-visible:ring-green-500/60 sm:my-0 sm:size-[26px]"
      >
        <Image
          src="/icons/contact/copy.svg"
          alt=""
          width={18}
          height={18}
          unoptimized
          className="size-[18px]"
        />
      </button>
      <AnimatePresence>
        {copied && (
          <motion.span
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            className="text-[12px] font-light tracking-[-0.28px] text-[#919191]"
          >
            Copied
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-[16px] font-light leading-[22px] tracking-[-0.32px] text-[#919191]">
        {label}
      </p>
      {children}
    </div>
  );
}

function ContactDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const panel = useRef<HTMLDivElement>(null);
  const titleId = useId();
  /* multi-select: a trip can be a shortlist, so the chips are a set rather
     than a radio group — hence `aria-pressed` per chip instead of a
     single-choice group. */
  const [cities, setCities] = useState<string[]>([CITIES[0].name]);
  const [sent, setSent] = useState(false);

  /* the panel's own scroll container below 1080 — the confirmation replaces a
     tall form with a short block, so the view has to be taken back to it or
     the sheet is left looking at the details column */
  const scroller = useRef<HTMLDivElement>(null);
  /* the jump target — below 1080 the details column is a scroll away, and
     nothing in the header said it was there */
  const details = useRef<HTMLDivElement>(null);
  /* No `root`: the viewport is the right one. IntersectionObserver resolves
     through the ancestor clip chain, so the scroller hiding the column already
     reads as "not intersecting" — and at 1080 the scroller is `display:
     contents` and would not be a legal root anyway. */
  const detailsInView = useInView(details, { amount: 0.15 });
  const sheet = useSheet();
  const reduce = useReducedMotion();
  /* the sheet is dragged by its header only, so the drag can never swallow a
     flick meant for the form scrolling underneath it */
  const drag = useDragControls();

  /* Esc closes, the page underneath stops scrolling, and focus is kept inside
     the panel while it is up. */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab" || !panel.current) return;
      const focusable = panel.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input, textarea, select, [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);

    /* Scroll lock. `overflow: hidden` on the body is not enough on iOS Safari
       — it keeps rubber-banding the page behind the sheet — so the body is
       taken out of flow at its current offset and put back afterwards. That is
       also why the offset has to be restored by hand: a fixed body forgets it.
       The scrollbar's width is padded back on so the page does not jump as it
       locks (desktop only; touch has no persistent bar). */
    const body = document.body;
    const prev = {
      overflow: body.style.overflow,
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
      paddingRight: body.style.paddingRight,
    };
    const offset = window.scrollY;
    const bar = window.innerWidth - document.documentElement.clientWidth;
    body.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.top = `-${offset}px`;
    body.style.width = "100%";
    if (bar > 0) body.style.paddingRight = `${bar}px`;

    /* Focus goes to the panel, never to the first input: on a phone an
       autofocused field throws the keyboard up over the dialog you have not
       read yet. */
    panel.current?.focus({ preventScroll: true });

    return () => {
      document.removeEventListener("keydown", onKey);
      Object.assign(body.style, prev);
      window.scrollTo(0, offset);
    };
  }, [open, onClose]);

  /* `offsetTop` of the column minus the scroller's own offset within the
     panel: both are laid out against the panel, which is the positioned
     ancestor, so the difference is the scroll offset that puts the column at
     the top of the viewport. */
  const jumpToDetails = () => {
    const sc = scroller.current;
    const el = details.current;
    if (!sc || !el) return;
    sc.scrollTo({
      top: el.offsetTop - sc.offsetTop,
      behavior: reduce ? "auto" : "smooth",
    });
  };

  /* A flick down, or a drag past a third of the sheet, dismisses it — the two
     together are what makes the gesture feel like a sheet rather than a
     threshold you have to reach. */
  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y > 120 || info.velocity.y > 600) onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.28, ease: EASE }}
          /* pointerdown, not mousedown: a tap outside has to dismiss too */
          onPointerDown={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
          className="fixed inset-0 z-[100] flex items-end justify-center bg-[rgba(0,0,0,0.09)] backdrop-blur-[5.45px] sm:items-center sm:p-6 min-[1080px]:overflow-y-auto"
        >
          <motion.div
            {...(reduce
              ? {
                  initial: { opacity: 0 },
                  animate: { opacity: 1 },
                  exit: { opacity: 0 },
                  transition: { duration: 0.2, ease: EASE },
                }
              : sheet
                ? {
                    /* a sheet arrives from the edge it is attached to */
                    initial: { y: "100%" },
                    animate: { y: 0 },
                    exit: { y: "100%" },
                    transition: {
                      type: "spring" as const,
                      stiffness: 420,
                      damping: 38,
                      mass: 0.9,
                    },
                  }
                : {
                    initial: { opacity: 0, y: 18, scale: 0.985 },
                    animate: { opacity: 1, y: 0, scale: 1 },
                    exit: { opacity: 0, y: 10, scale: 0.99 },
                    transition: { duration: 0.42, ease: EASE },
                  })}
            {...(sheet && !reduce
              ? {
                  drag: "y" as const,
                  dragControls: drag,
                  /* the header starts the drag; the panel itself must stay
                     free to scroll */
                  dragListener: false,
                  dragConstraints: { top: 0, bottom: 0 },
                  dragElastic: { top: 0, bottom: 0.6 },
                  onDragEnd,
                }
              : {})}
            style={{ touchAction: "auto" }}
            className="flex w-full max-w-[1027px] items-start gap-[10px] sm:my-auto"
          >
            <div
              ref={panel}
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              tabIndex={-1}
              className="relative isolate flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-[20px] bg-background outline-none sm:max-h-[calc(100dvh-3rem)] sm:rounded-[10px] min-[1080px]:h-[696px] min-[1080px]:max-h-none min-[1080px]:flex-row"
            >
              {/* Sheet / tablet header. It is the drag handle as well as the
                  home of the close button — on a scrolling panel a `fixed`
                  close button floats over whatever happens to be under it,
                  and here it can never be anywhere else. */}
              <div
                onPointerDown={(e) => {
                  if (sheet && !reduce) drag.start(e);
                }}
                style={{ touchAction: sheet ? "none" : undefined }}
                className="relative z-20 flex shrink-0 flex-col border-b-[0.5px] border-[#ececec] bg-background min-[1080px]:hidden"
              >
                <span
                  aria-hidden
                  className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-[#dedede] sm:hidden"
                />
                <div className="flex items-center justify-between gap-2 px-5 py-2.5 sm:px-6 sm:py-3">
                  <div className="flex items-center gap-[3.3px]">
                    <Image
                      src="/icons/earth.svg"
                      alt=""
                      width={27}
                      height={27}
                      unoptimized
                      className="size-[26.5px]"
                    />
                    <span className="whitespace-nowrap text-[11.6px] font-normal tracking-[-0.35px] text-[#2d2d2d]">
                      Dakar Travels
                    </span>
                  </div>

                  {/* Below 1080 the phone number, the address and the hours are
                      a scroll below the form, with nothing to say so. This is
                      that signpost — and it retires once the column it points
                      at is on screen, rather than sitting there doing nothing.
                      `stopPropagation` on pointerdown so the press does not
                      also start the sheet's drag. */}
                  <AnimatePresence initial={false}>
                    {!detailsInView && (
                      <motion.button
                        type="button"
                        onClick={jumpToDetails}
                        onPointerDown={(e) => e.stopPropagation()}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: reduce ? 0.001 : 0.2 }}
                        className="ml-auto flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-full border-[0.5px] border-white bg-white/56 pl-3.5 pr-3 text-[13px] font-light tracking-[-0.28px] text-[#303030] shadow-[0_2px_13.9px_0_rgba(0,0,0,0.02)] outline-none transition-[background-color] duration-200 hover:bg-white focus-visible:ring-2 focus-visible:ring-green-500/60"
                      >
                        <span className="whitespace-nowrap">
                          Contact details
                        </span>
                        {/* the strip's chevron, turned to point down */}
                        <Image
                          src="/icons/detail/back-chevron.svg"
                          alt=""
                          width={4}
                          height={7}
                          unoptimized
                          aria-hidden
                          className="h-[7px] w-[4px] rotate-90"
                        />
                      </motion.button>
                    )}
                  </AnimatePresence>

                  <button
                    type="button"
                    onClick={onClose}
                    onPointerDown={(e) => e.stopPropagation()}
                    aria-label="Close"
                    className="-mr-2 flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-[10px] outline-none transition-opacity hover:opacity-70 active:opacity-50 focus-visible:ring-2 focus-visible:ring-green-500/60"
                  >
                    <Image
                      src="/icons/contact/x-close.svg"
                      alt=""
                      width={22}
                      height={22}
                      unoptimized
                      className="size-[22px]"
                    />
                  </button>
                </div>
              </div>

              {/* The panel scrolls inside itself below 1080 — one scroll
                  container, so the scrim never scrolls behind the sheet.
                  `contents` at 1080 takes this box back out of the layout so
                  the Figma composition's absolute offsets still resolve
                  against the panel. */}
              <div
                ref={scroller}
                /* `overflow-x-hidden` is not cosmetic: the details column no
                   longer clips, so its two blobs bleed sideways and give this
                   box a scrollWidth wider than the panel — which is the
                   horizontal drift the sheet had while scrolling. */
                className="flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden overscroll-contain min-[1080px]:contents"
              >
              {/* Details column — Component 16, 415×696. Below 1080 it sits
                  *after* the form (`order-2`) and does not clip: the panel
                  clips the blobs instead, so there is no hard blue edge across
                  the middle of the dialog. */}
              <div
                ref={details}
                className="relative order-2 shrink-0 border-t-[0.5px] border-[#ececec] px-5 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-6 sm:px-6 min-[1080px]:order-none min-[1080px]:border-0 min-[1080px]:w-[415px] min-[1080px]:overflow-hidden min-[1080px]:p-0">
                {/* Ellipse 43 / 44, the footer's blobs at this frame's sizes */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute bottom-[-15.52%] left-[-22.65%] -z-10 aspect-square w-[52.05%] rounded-full bg-[#a4e9f9] blur-[min(93px,14vw)]"
                />
                <div
                  aria-hidden
                  className="pointer-events-none absolute right-[-21.69%] top-[-10.78%] -z-10 aspect-square w-[39.52%] rounded-full bg-[#8bf9b5] blur-[min(93px,14vw)]"
                />

                {/* below 1080 the lockup lives in the sheet header instead */}
                <div className="hidden items-center gap-[3.3px] min-[1080px]:absolute min-[1080px]:left-6 min-[1080px]:top-[25px] min-[1080px]:flex">
                  <Image
                    src="/icons/earth.svg"
                    alt=""
                    width={27}
                    height={27}
                    unoptimized
                    className="size-[26.5px]"
                  />
                  <span className="whitespace-nowrap text-[11.6px] font-normal tracking-[-0.35px] text-[#2d2d2d]">
                    Dakar Travels
                  </span>
                </div>

                <div className="flex w-full flex-col gap-7 sm:mt-8 sm:gap-9 min-[1080px]:gap-[57px] min-[1080px]:absolute min-[1080px]:left-[39px] min-[1080px]:top-1/2 min-[1080px]:mt-0 min-[1080px]:w-[288px] min-[1080px]:-translate-y-1/2">
                  <Detail label="Speak to someone">
                    <CopyLine value="+91 22 4000 1180" label="phone number" />
                  </Detail>
                  <Detail label="Email Address">
                    <CopyLine value="hello@dakartravels.com" label="email address" />
                  </Detail>
                  <Detail label="Specialist hours">
                    <p
                      className={`${DISPLAY} text-[18px] leading-[29px] tracking-[-0.03em] sm:text-[20px]`}
                    >
                      Mon — Sat, 9:00 to 19:00 IST
                      <br />
                      Sunday by appointment
                    </p>
                  </Detail>
                  <Detail label="Office">
                    <p
                      className={`${DISPLAY} text-[18px] leading-[29px] tracking-[-0.03em] sm:text-[20px]`}
                    >
                      4th floor, Ferry Wharf Road
                      <br />
                      Fort, Mumbai 400001
                    </p>
                  </Detail>
                </div>

                <div className="mt-8 flex h-[30px] w-fit items-center gap-1 rounded-[123px] border-[0.5px] border-white bg-white/56 py-1.5 pl-2.5 pr-[18px] shadow-[0_2px_13.9px_0_rgba(0,0,0,0.02)] min-[1080px]:absolute min-[1080px]:left-[37px] min-[1080px]:top-[623px] min-[1080px]:mt-0">
                  <Image
                    src="/icons/contact/flash.svg"
                    alt=""
                    width={18}
                    height={18}
                    unoptimized
                    className="size-[18px]"
                  />
                  <span className="whitespace-nowrap text-[14px] font-light tracking-[-0.42px] text-[#303030]">
                    Replies within one business day.
                  </span>
                </div>
              </div>

              {/* Form — 514px column, 26px down, 444px in. `order-1` below
                  1080: the form is what the dialog was opened for. */}
              <div className="order-1 flex w-full flex-col gap-7 px-5 pb-8 pt-6 sm:gap-10 sm:px-6 min-[1080px]:absolute min-[1080px]:order-none min-[1080px]:left-[444px] min-[1080px]:top-[34px] min-[1080px]:w-[514px] min-[1080px]:p-0">
                <div className="flex flex-col gap-[5px] min-[1080px]:h-[87px]">
                  <h2
                    id={titleId}
                    className={`${DISPLAY} text-[20px] leading-[34px] tracking-[-0.03em]`}
                  >
                    Tell us about the trip
                  </h2>
                  <p className="text-[14px] font-light leading-[22px] tracking-[-0.28px] text-[#919191]">
                    Share a few details and a specialist will come back with
                    destination options and a draft itinerary.
                  </p>
                </div>

                {sent ? (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: EASE }}
                    className="flex flex-col gap-3 rounded-[10px] border-[0.5px] border-white bg-white/56 p-6"
                  >
                    <p
                      className={`${DISPLAY} text-[20px] leading-[34px] tracking-[-0.03em]`}
                    >
                      Thank you — that&apos;s with a specialist.
                    </p>
                    <p className="text-[14px] font-light leading-[22px] tracking-[-0.28px] text-[#919191]">
                      {cities.length
                        ? `We'll come back on ${listed(cities)}, plus anywhere else that fits, within one business day.`
                        : "We'll come back within one business day with destinations that fit."}
                    </p>
                  </motion.div>
                ) : (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      setSent(true);
                      scroller.current?.scrollTo({
                        top: 0,
                        behavior: reduce ? "auto" : "smooth",
                      });
                    }}
                    className="flex flex-col gap-10 sm:gap-[60px]"
                  >
                    <div className="flex flex-col gap-8 sm:gap-10">
                      <div className="flex flex-col gap-8 sm:flex-row sm:gap-[60px]">
                        <Field
                          name="name"
                          label="Your Name"
                          hint="e.g John Doe"
                          autoComplete="name"
                          required
                        />
                        <Field
                          name="email"
                          label="Email"
                          hint="e.g Johndoe@gmail.com"
                          type="email"
                          autoComplete="email"
                          required
                        />
                      </div>

                      <div
                        role="group"
                        aria-labelledby={`${titleId}-dest`}
                        className="flex flex-col gap-5"
                      >
                        <p
                          id={`${titleId}-dest`}
                          className={`${HEADER} leading-[32px]`}
                        >
                          Destination of interest
                        </p>
                        <div className="flex flex-wrap gap-[14px]">
                          {CITIES.map((c) => {
                            const on = cities.includes(c.name);
                            return (
                              <button
                                key={c.name}
                                type="button"
                                aria-pressed={on}
                                onClick={() =>
                                  setCities((prev) =>
                                    prev.includes(c.name)
                                      ? prev.filter((n) => n !== c.name)
                                      : /* keep the strip's order, not click order */
                                        CITIES.filter(
                                          (city) =>
                                            city.name === c.name ||
                                            prev.includes(city.name),
                                        ).map((city) => city.name),
                                  )
                                }
                                className={`${CHIP} ${
                                  on
                                    ? "border border-white bg-green-ink text-white hover:bg-[#2a4520] hover:shadow-[0_2px_10px_0_rgba(26,51,15,0.18)]"
                                    : "border-[0.5px] border-white bg-white/56 text-[#303030] hover:border-hairline hover:bg-white hover:text-green-ink hover:shadow-[0_2px_10px_0_rgba(0,0,0,0.05)]"
                                }`}
                              >
                                {c.name}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2.5">
                        <label
                          htmlFor={`${titleId}-brief`}
                          className={`${HEADER} leading-[38px]`}
                        >
                          What are you hoping for?
                        </label>
                        <input
                          id={`${titleId}-brief`}
                          name="brief"
                          placeholder="Inquiry about budget, pace or itinerary"
                          className={`${RULE} ${HINT} w-full bg-transparent pb-2.5 text-[#2d2d2d] outline-none focus:border-[#2d2d2d]`}
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      /* full width on a phone — a thumb-width target is worth
                         more there than the frame's hugged pill */
                      className="flex h-[52px] w-full shrink-0 cursor-pointer items-center justify-center rounded-full border-[1.5px] border-white px-[34px] text-[16px] font-normal tracking-[-0.48px] text-green-ink shadow-[0_2px_13.9px_0_rgba(0,0,0,0.02)] outline-none transition-transform duration-300 hover:scale-[1.03] active:scale-95 focus-visible:ring-2 focus-visible:ring-green-500/60 sm:h-[50px] sm:w-fit sm:justify-start"
                      style={{
                        backgroundImage:
                          "linear-gradient(180deg, #fafafa 0%, #7eff5f 62.5%)",
                      }}
                    >
                      Send Request
                    </button>
                  </form>
                )}
              </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="hidden size-9 shrink-0 cursor-pointer items-center justify-center rounded-[10px] bg-background outline-none transition-opacity hover:opacity-70 focus-visible:ring-2 focus-visible:ring-green-500/60 min-[1080px]:flex"
            >
              <Image
                src="/icons/contact/x-close.svg"
                alt=""
                width={22}
                height={22}
                unoptimized
                className="size-[22px]"
              />
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* Name / Email — 36586:78885: a dark 20px header, then the hint line the input
   borrows as its placeholder, then the 0.5px rule. 82px in the frame. */
function Field({
  name,
  label,
  hint,
  type = "text",
  autoComplete,
  required,
}: {
  name: string;
  label: string;
  hint: string;
  type?: string;
  autoComplete?: string;
  required?: boolean;
}) {
  const id = useId();
  return (
    <div className="flex w-full flex-col gap-2.5">
      <label htmlFor={id} className={`${HEADER} leading-[41px]`}>
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        required={required}
        autoComplete={autoComplete}
        placeholder={hint}
        className={`${RULE} ${HINT} w-full bg-transparent pb-2.5 text-[#2d2d2d] outline-none focus:border-[#2d2d2d]`}
      />
    </div>
  );
}
