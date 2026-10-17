import type { MotionValue } from "motion/react";

/**
 * Mutable bridge between the HTML layer (button, pointer, scroll) and the
 * Three.js render loop. It's a plain object read inside useFrame, so pointer
 * moves and scroll updates never trigger React re-renders.
 */
export type BadgeController = {
  /** Incremented by the HTML button; the scene flips once per increment. */
  flipRequests: number;
  /** Face the visitor's mouse asks for (hover = back, leave = front); null = no preference. */
  desiredFace: Face | null;
  /** Pointer position over the badge in -1..1 (mouse only). */
  pointer: { x: number; y: number; active: boolean };
  /** 0..1 hero scroll progress from Motion's useScroll. */
  progress: MotionValue<number> | null;
  reducedMotion: boolean;
};

export type Face = "front" | "back";

export type Rect = { left: number; top: number; width: number; height: number; containerW: number; containerH: number };
