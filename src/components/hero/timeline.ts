/**
 * Deterministic animation timeline for the hanging badge.
 *
 * Every value is a pure function of `t` (seconds since the badge artwork
 * finished loading), so the sequence plays identically on every visit and
 * never drifts with frame rate.
 *
 *  0.00 – 1.50  Phase A  drop from above, small overshoot, damped swing
 *  1.50 – 3.00  Phase B  front-facing pause
 *  3.00 – 3.95  Phase C  flip 180° to the back
 *  3.95 – 6.10  Phase D  back-facing pause
 *  6.10 – 7.05  Phase E  flip back to the front, then settle
 */

export const T = {
  entrance: 1.5,
  flipOut: 3.0,
  flipDur: 0.95,
  flipBack: 6.1,
  done: 7.4,
};

export const DROP_HEIGHT = 3.4; // world units above rest (in badge-scale units)

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

export const easeOutCubic = (x: number) => 1 - Math.pow(1 - x, 3);
export const easeInOutCubic = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

/**
 * easeInOutBack with a gentle constant: a hint of anticipation before the
 * turn and a ~3% overshoot after it, which reads as weight and inertia.
 */
export function easeInOutBack(x: number, c1 = 0.7) {
  const c2 = c1 * 1.525;
  return x < 0.5
    ? (Math.pow(2 * x, 2) * ((c2 + 1) * 2 * x - c2)) / 2
    : (Math.pow(2 * x - 2, 2) * ((c2 + 1) * (x * 2 - 2) + c2) + 2) / 2;
}

/**
 * Vertical offset of the hang point relative to rest.
 * 0–0.75 s: eased fall that overshoots slightly below rest (strap stretch).
 * 0.75–1.5 s: under-damped recoil back to rest. The recoil term uses
 * cos + (ζ/ω)·sin so its velocity is zero where the fall ends — no kink.
 */
export function dropOffset(t: number, height = DROP_HEIGHT) {
  const fallEnd = 0.75;
  const overshoot = -0.14;
  if (t <= 0) return height;
  if (t < fallEnd) {
    // accelerate like a falling object, then decelerate as the strap takes the load
    const x = t / fallEnd;
    const k = x < 0.55 ? 0.62 * Math.pow(x / 0.55, 2) : 0.62 + 0.38 * easeOutCubic((x - 0.55) / 0.45);
    return height + (overshoot - height) * k;
  }
  const u = t - fallEnd;
  const z = 5.2;
  const w = 2 * Math.PI * 1.25;
  return overshoot * Math.exp(-z * u) * (Math.cos(w * u) + (z / w) * Math.sin(w * u));
}

/** Pendulum swing (rotation around the hang point, radians) excited by the drop. */
export function entranceSwing(t: number) {
  if (t <= 0) return 0;
  return 0.11 * Math.exp(-1.9 * t) * Math.sin(2 * Math.PI * 0.72 * t);
}

/** A scheduled rotation of the badge around its vertical (lanyard) axis. */
export type FlipTween = { from: number; to: number; start: number; dur: number; overshoot: boolean };

export function flipValue(f: FlipTween, t: number) {
  const x = clamp01((t - f.start) / f.dur);
  const e = f.overshoot ? easeInOutBack(x) : easeInOutCubic(x);
  return f.from + (f.to - f.from) * e;
}

/** 0→1→0 bump while a flip is in progress – used for a sympathetic sway. */
export function flipBump(f: FlipTween, t: number) {
  const x = clamp01((t - f.start) / f.dur);
  return Math.sin(Math.PI * x);
}

export function autoFlips(): FlipTween[] {
  return [
    { from: 0, to: Math.PI, start: T.flipOut, dur: T.flipDur, overshoot: true },
    { from: Math.PI, to: 0, start: T.flipBack, dur: T.flipDur, overshoot: true },
  ];
}
