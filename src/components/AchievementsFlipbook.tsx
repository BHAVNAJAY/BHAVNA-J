"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useReducedMotion } from "motion/react";
import { achievements } from "@/data/achievements";
import type { FlipApi } from "./FlipbookBook";
import Reveal from "./Reveal";
import styles from "@/styles/achievements.module.css";

const FlipbookBook = dynamic(() => import("./FlipbookBook"), {
  ssr: false,
  loading: () => <div className={styles.bookLoading} aria-hidden />,
});

const FLIP_MS = 1100;
const FLIP_MS_REDUCED = 250;
/** Distance between two page turns in the scroll corridor (only matters for the scrollbar). */
const STEP_VH = 60;

/*
 * A "state" is a resting position of the book:
 *   two-page mode → cover, each spread, back cover
 *   one-page mode → every page
 */
const stateCount = (pages: number, single: boolean) => (single ? pages : 1 + Math.ceil((pages - 1) / 2));
const pageToState = (page: number, single: boolean) => (single ? page : page === 0 ? 0 : Math.ceil(page / 2));
const stateToPage = (s: number, single: boolean) => (single ? s : s === 0 ? 0 : 2 * s - 1);

/**
 * Scroll-driven flipbook — one scroll gesture = one page turn, both ways.
 *
 * The section is a tall corridor with a sticky, full-screen viewport.
 * While the book is pinned, every scroll gesture (touchpad swipe, mouse-wheel
 * click, phone swipe, arrow key) turns exactly one page:
 *   scroll down → next page   …   back cover → page continues to the next section
 *   scroll up   → previous page … front cover → page continues to the previous section
 * Coming back up from the sections below, the book is caught closed on its
 * back cover and then turns back, page by page, to the front.
 */
export default function AchievementsFlipbook() {
  const reduced = !!useReducedMotion();
  const flipMs = reduced ? FLIP_MS_REDUCED : FLIP_MS;
  const total = achievements.pages.length;
  const mirrored = achievements.turnDirection === "left-to-right";

  const [narrow, setNarrow] = useState<boolean | null>(null);
  const [aspect, setAspect] = useState<number | null>(null);
  const single = !!narrow;
  const states = stateCount(total, single);
  const [uiState, setUiState] = useState(0);

  const corridorRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const bookRegionRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<FlipApi | null>(null);

  // Mutable controller read by the (bound-once) event listeners.
  const k = useRef({
    target: 0, // where the book should be
    shown: 0, // where the book is (after the last completed turn)
    busy: false,
    ready: false,
    safety: 0,
    single,
    states,
    flipMs,
  });
  k.current.single = single;
  k.current.states = states;
  k.current.flipMs = flipMs;

  // Single page on narrow screens, two-page spreads otherwise.
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 760px)");
    const u = () => setNarrow(mq.matches);
    u();
    mq.addEventListener("change", u);
    return () => mq.removeEventListener("change", u);
  }, []);

  // Read the page shape from the cover PNG, so any Canva export size just works.
  useEffect(() => {
    let done = false;
    const finish = (a: number) => {
      if (done) return;
      done = true;
      setAspect(a > 0 && Number.isFinite(a) ? a : achievements.pageAspect);
    };
    const img = new Image();
    img.onload = () => finish(img.naturalWidth / img.naturalHeight);
    img.onerror = () => finish(achievements.pageAspect);
    img.src = achievements.pages[0]?.src ?? "";
    const t = window.setTimeout(() => finish(achievements.pageAspect), 2500);
    return () => {
      done = true;
      window.clearTimeout(t);
    };
  }, []);

  /** Corridor position in page coordinates. */
  const geometry = useCallback(() => {
    const c = corridorRef.current;
    const s = stickyRef.current;
    if (!c || !s) return null;
    const top = c.getBoundingClientRect().top + window.scrollY;
    const span = Math.max(0, c.offsetHeight - s.offsetHeight);
    const n = k.current.states;
    return { top, end: top + span, step: n > 1 ? span / (n - 1) : 0 };
  }, []);

  const setTarget = useCallback((s: number) => {
    const c = k.current;
    const clamped = Math.max(0, Math.min(c.states - 1, s));
    if (clamped === c.target) return;
    c.target = clamped;
    setUiState(clamped);
  }, []);

  /** Turn pages one at a time until the book shows the target state. */
  const pump = useCallback(() => {
    const c = k.current;
    const api = apiRef.current;
    if (!api || !c.ready || c.busy) return;
    const diff = c.target - c.shown;
    if (diff === 0) return;
    c.busy = true;
    if (Math.abs(diff) <= 2) {
      // queued gestures: always one visible turn per gesture
      if (diff > 0) api.flipNext();
      else api.flipPrev();
    } else {
      // big jump (scrollbar drag / nav link): one turn straight to the page
      api.flipTo(stateToPage(c.target, c.single));
    }
    // Safety net: if the engine ignored the call, jump there without animation
    // so the book can never get stuck.
    const from = c.shown;
    window.clearTimeout(c.safety);
    c.safety = window.setTimeout(() => {
      if (c.shown === from && c.target !== from) {
        api.turnTo(stateToPage(c.target, c.single));
        c.shown = c.target;
      }
      c.busy = false;
      pump();
    }, c.flipMs + 700);
  }, []);

  /** Book follows the scroll position (scrollbar drags, anchor jumps, flings). */
  const syncFromScroll = useCallback(() => {
    const g = geometry();
    if (!g || g.step <= 0) return;
    setTarget(Math.round((window.scrollY - g.top) / g.step));
    pump();
  }, [geometry, setTarget, pump]);

  /** Move exactly one page and park the scroll position in that page's slot. */
  const stepBy = useCallback(
    (dir: 1 | -1) => {
      const c = k.current;
      const g = geometry();
      if (!g) return false;
      const next = c.target + dir;
      if (next < 0 || next > c.states - 1) return false;
      // Never queue a turn behind one that is still animating — a swipe's inertia
      // would otherwise skip a whole spread (e.g. back cover → 2–3).
      if (Math.abs(next - c.shown) > 1) return true;
      setTarget(next);
      window.scrollTo({ top: g.top + next * g.step, behavior: "instant" as ScrollBehavior });
      pump();
      return true;
    },
    [geometry, setTarget, pump]
  );

  // Reset when the book is remounted (one-page ↔ two-page switch).
  useEffect(() => {
    const c = k.current;
    c.ready = false;
    c.busy = false;
    c.shown = 0;
  }, [narrow]);

  const onReady = useCallback(() => {
    const c = k.current;
    c.ready = true;
    c.shown = 0;
    c.busy = false;
    // If the visitor is already part-way through the corridor, open the book there instantly.
    const g = geometry();
    if (g && g.step > 0) {
      c.target = Math.max(0, Math.min(c.states - 1, Math.round((window.scrollY - g.top) / g.step)));
      setUiState(c.target);
      if (c.target > 0) {
        apiRef.current?.turnTo(stateToPage(c.target, c.single));
        c.shown = c.target;
      }
    }
  }, [geometry]);

  const onFlip = useCallback(
    (page: number) => {
      const c = k.current;
      c.shown = pageToState(page, c.single);
      c.busy = false;
      window.clearTimeout(c.safety);
      requestAnimationFrame(pump);
    },
    [pump]
  );

  const onIdle = useCallback(() => {
    const c = k.current;
    c.busy = false;
    window.clearTimeout(c.safety);
    requestAnimationFrame(pump);
  }, [pump]);

  /* ── input: touchpad / mouse wheel, touch, keyboard ──────────────────── */
  useEffect(() => {
    const TOL = 3;
    const MIN_GAP = 450; // ms between two turns from the same kind of input
    const html = document.documentElement;
    const now = () => performance.now();

    // While the book is on screen the page itself is frozen (overflow: hidden),
    // so neither touchpad inertia nor Chrome's non-cancelable wheel events can
    // scroll past it. Every gesture is read and turned into exactly one page.
    let trapped = false;
    let lastInput = -1e9; // last wheel / touch / key input (to tell it apart from scrollbar drags)
    let prevY = window.scrollY;

    const park = (y: number) => window.scrollTo({ top: y, behavior: "instant" as ScrollBehavior });
    const inside = (g: { top: number; end: number }, y = window.scrollY) => y >= g.top - TOL && y <= g.end + TOL;
    const atEdge = (dir: number) => (dir > 0 ? k.current.target >= k.current.states - 1 : k.current.target <= 0);

    const trap = (at?: number) => {
      if (!trapped) {
        trapped = true;
        html.style.scrollbarGutter = "stable"; // no layout jump when the scrollbar hides
        html.style.overflow = "hidden";
        window.__lenis?.stop(); // the book, not the smooth scroller, owns the wheel while pinned
      }
      if (at !== undefined) park(at);
      prevY = window.scrollY;
    };
    const release = (nudge = 0) => {
      if (!trapped) return;
      trapped = false;
      html.style.overflow = "";
      if (nudge) window.scrollBy({ top: nudge, behavior: "instant" as ScrollBehavior });
      const lenis = window.__lenis;
      if (lenis) {
        lenis.scrollTo(window.scrollY, { immediate: true, force: true });
        lenis.start();
      }
      prevY = window.scrollY;
    };
    /** Snap the scroll position onto the slot of the page currently targeted. */
    const parkOnTarget = (g: { top: number; step: number }) => park(g.top + k.current.target * g.step);

    /* Gesture detection.
       A touchpad swipe is a stream of wheel events: it speeds up, then slows
       down (inertia). One stream = one page. A new page needs either a pause
       in the stream (finger lifted, or a separate mouse-wheel click) or a clear
       new speed-up after the stream had slowed down (swiping again while the
       previous swipe is still coasting). Speeds are used rather than raw
       deltas, because the browser merges events while a page is animating. */
    const vel: number[] = [];
    let lastWheel = -1e9;
    let lastStep = -1e9;
    let newSeries = true; // a pause happened since the last turn
    let slowedDown = false; // the current stream decelerated since the last turn
    const avg = (n: number) => {
      const s = vel.slice(-n);
      return s.reduce((a, b) => a + b, 0) / Math.max(1, s.length);
    };

    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || document.querySelector("dialog[open]")) return; // pinch-zoom / modal
      const dy = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaMode === 2 ? e.deltaY * window.innerHeight : e.deltaY;
      if (!dy || Math.abs(dy) < Math.abs(e.deltaX)) return;
      const g = geometry();
      if (!g) return;
      const t = now();
      lastInput = t;
      const dir = dy > 0 ? 1 : -1;

      const gap = t - lastWheel;
      lastWheel = t;
      // A classic mouse wheel sends one fixed-size event per click.
      const wd = (e as WheelEvent & { wheelDeltaY?: number }).wheelDeltaY;
      const click = (e.deltaMode === 1 || (typeof wd === "number" && wd !== 0 && wd % 120 === 0)) && gap > 100;
      if (gap > 200 || click) {
        vel.length = 0;
        newSeries = true;
        slowedDown = false;
      }
      vel.push(Math.abs(dy) / Math.min(Math.max(gap, 16), 200));
      if (vel.length > 120) vel.shift();
      if (vel.length >= 8 && avg(4) < avg(20) * 0.75) slowedDown = true;
      const speedingUpAgain = slowedDown && vel.length >= 8 && avg(3) > avg(20) * 1.4 && t - lastStep > k.current.flipMs * 0.8;
      // a new page never starts before the previous turn has finished
      const isNewGesture = (newSeries || speedingUpAgain) && t - lastStep >= Math.max(MIN_GAP, k.current.flipMs + 100);

      if (!trapped) {
        const y = window.scrollY;
        // Arriving at the book from above or below: freeze on it, don't turn yet.
        const fromAbove = dir > 0 && y < g.top - TOL && y + dy >= g.top - TOL;
        const fromBelow = dir < 0 && y > g.end + TOL && y + dy <= g.end + TOL;
        if (fromAbove || fromBelow) {
          if (e.cancelable) e.preventDefault();
          trap(fromAbove ? g.top : g.end);
          lastStep = t; // the rest of this swipe only brings the book into view
          newSeries = false;
          slowedDown = false;
          return;
        }
        if (!inside(g, y)) return;
        // The page already slid onto the book: freeze it there, don't turn yet.
        if (e.cancelable) e.preventDefault();
        trap();
        parkOnTarget(g);
        lastStep = t;
        newSeries = false;
        slowedDown = false;
        return;
      }

      if (e.cancelable) e.preventDefault();
      if (!isNewGesture) return; // still the same swipe (or its inertia)

      lastStep = t;
      newSeries = false;
      slowedDown = false;
      if (atEdge(dir)) {
        // Past the front or back cover: hand scrolling back to the page.
        release(dir * (TOL + 2));
        return;
      }
      stepBy(dir);
    };

    /* Touch (phones / tablets): one swipe = one page. */
    const touch = { active: false, startY: 0, fired: false, exiting: false };
    const onTouchStart = (e: TouchEvent) => {
      lastInput = now();
      touch.active = e.touches.length === 1;
      touch.fired = false;
      touch.exiting = false;
      if (touch.active) touch.startY = e.touches[0].clientY;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!touch.active || touch.exiting || e.touches.length !== 1) return;
      lastInput = now();
      const g = geometry();
      if (!g) return;
      if (!trapped) {
        if (!inside(g)) return;
        trap();
        touch.fired = true; // this swipe brought the book into view — the next one turns
      }
      const dy = touch.startY - e.touches[0].clientY; // > 0 → swiping up = scrolling down
      if (dy === 0) return;
      const dir = dy > 0 ? 1 : -1;
      if (atEdge(dir) && !touch.fired) {
        touch.exiting = true; // let this swipe scroll out of the section
        release();
        return;
      }
      if (e.cancelable) e.preventDefault();
      if (!touch.fired && Math.abs(dy) > 30) touch.fired = stepBy(dir) || true;
    };
    const onTouchEnd = () => {
      touch.active = false;
      lastInput = now();
    };

    /* Keyboard: ↓ / PageDown / Space = next, ↑ / PageUp / Shift+Space = previous. */
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
      const el = e.target as HTMLElement | null;
      if (el && (/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) || el.isContentEditable)) return;
      if (document.querySelector("dialog[open]")) return;
      let dir = 0;
      if (e.key === "ArrowDown" || e.key === "PageDown") dir = 1;
      else if (e.key === "ArrowUp" || e.key === "PageUp") dir = -1;
      else if (e.key === " " && !(el && /^(BUTTON|A)$/.test(el.tagName))) dir = e.shiftKey ? -1 : 1;
      else if (bookRegionRef.current?.contains(el) && (e.key === "ArrowRight" || e.key === "ArrowLeft")) {
        const forwardKey = mirrored ? "ArrowLeft" : "ArrowRight";
        dir = e.key === forwardKey ? 1 : -1;
      }
      if (!dir) return;
      lastInput = now();
      const g = geometry();
      if (!g || !inside(g)) return;
      if (atEdge(dir)) {
        release(); // the key's normal scroll carries on to the next section
        return;
      }
      e.preventDefault();
      if (!trapped) trap();
      if (!e.repeat) stepBy(dir as 1 | -1);
    };

    const onScroll = () => {
      const y = window.scrollY;
      const g = geometry();
      if (!g) return;
      if (trapped) {
        const slot = g.top + k.current.target * g.step;
        if (Math.abs(y - slot) <= 1) return;
        if (now() - lastInput < 1500) {
          // Chrome keeps an already-running swipe/fling moving even after the
          // page is frozen — hold the book in place against it.
          park(slot);
          return;
        }
        // Moved by something else (nav link, find-in-page): let go and follow.
        release();
        syncFromScroll();
        return;
      }
      // A fling / keyboard jump that would shoot past the book is stopped on it.
      // (Scrollbar drags have no recent input and are left alone.)
      if (now() - lastInput < 1500) {
        if (prevY < g.top - TOL && y > g.top - TOL) {
          trap(g.top);
          lastStep = now();
          newSeries = false;
          touch.fired = true; // a swipe that brought the book into view doesn't also turn a page
          syncFromScroll();
          return;
        }
        if (prevY > g.end + TOL && y < g.end + TOL) {
          trap(g.end);
          lastStep = now();
          newSeries = false;
          touch.fired = true; // a swipe that brought the book into view doesn't also turn a page
          syncFromScroll();
          return;
        }
      }
      prevY = y;
      syncFromScroll();
    };

    const onResize = () => {
      const g = geometry();
      if (trapped && g) parkOnTarget(g);
    };

    // Phones / tablets (coarse pointer) never trap the scroll: the page scrolls natively and
    // the book simply follows it through the corridor (see syncFromScroll), so a swipe can
    // always carry on to the next section. Only mice, touchpads and keys pin the book.
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    window.addEventListener("wheel", onWheel, { passive: false });
    if (!coarse) {
      window.addEventListener("touchstart", onTouchStart, { passive: true });
      window.addEventListener("touchmove", onTouchMove, { passive: false });
      window.addEventListener("touchend", onTouchEnd, { passive: true });
      window.addEventListener("touchcancel", onTouchEnd, { passive: true });
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchEnd);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
      release();
      window.clearTimeout(k.current.safety);
    };
  }, [geometry, stepBy, syncFromScroll, mirrored]);

  /* ── presentation ────────────────────────────────────────────────────── */
  const page = stateToPage(uiState, single);
  const label = !single && page > 0 && page < total - 1 ? `${page + 1}–${Math.min(page + 2, total)}` : `${page + 1}`;

  // In two-page mode a closed book covers only one half; slide it to stay centred.
  const shift = single
    ? undefined
    : uiState === 0
      ? "cover"
      : uiState === states - 1 && total % 2 === 0
        ? "back"
        : undefined;

  return (
    <section id="achievements" className={styles.section} aria-labelledby="ach-title">
      <div
        ref={corridorRef}
        className={styles.scrollCorridor}
        style={{ "--states": states, "--step": `${STEP_VH}svh` } as React.CSSProperties}
      >
        <div ref={stickyRef} className={styles.stickyViewport}>
          <div className={styles.head}>
            <Reveal>
              <h2 id="ach-title" className={`${styles.title} section-title display`}>
                {achievements.heading}
              </h2>
            </Reveal>
            <Reveal delay={0.05}>
              <p className={`${styles.subtitle} serif`}>{achievements.subtitle}</p>
            </Reveal>
          </div>

          <div className={styles.bookArea}>
            <div
              ref={bookRegionRef}
              className={styles.bookWrap}
              data-narrow={single || undefined}
              data-shift={shift}
              data-mirrored={mirrored || undefined}
              style={{ "--aspect": aspect ?? achievements.pageAspect } as React.CSSProperties}
              role="region"
              aria-roledescription="flipbook"
              aria-label={`${achievements.heading}. Scroll, swipe or use the arrow keys to turn pages.`}
              tabIndex={0}
            >
              <div className={styles.mirror}>
                {narrow !== null && aspect !== null ? (
                  <FlipbookBook
                    key={`${single ? "single" : "spread"}-${aspect}`}
                    pages={achievements.pages}
                    aspect={aspect}
                    portrait={single}
                    flippingTime={flipMs}
                    apiRef={apiRef}
                    onReady={onReady}
                    onFlip={onFlip}
                    onIdle={onIdle}
                  />
                ) : (
                  <div className={styles.bookLoading} aria-hidden />
                )}
              </div>
            </div>
          </div>

          <div className={styles.footerRow}>
            <span className={styles.counter} aria-live="polite">
              <span className="visually-hidden">Page </span>
              <strong>{label}</strong> / {total}
            </span>
            <span className={styles.scrollHint} data-hidden={uiState > 0 || undefined} aria-hidden>
              Scroll to turn pages
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M8 3v10M4 9l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            {achievements.pdf && (
              <a className={styles.pdf} href={achievements.pdf} download>
                Download PDF
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}